// Copyright (C) 2026 Zuoqiu Yingyi
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { botIdOf, resolveOptions, TelegramApiError } from "./api";
import {
    BACKOFF_DELAY,
    FATAL_ERROR_CODES,
    MAX_CONSECUTIVE_FAILURES,
    POLL_TIMEOUT,
    RETRY_DELAY,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type { ITelegramBotConfig } from "@/types/config";
import type {
    ITelegramConnectionState,
    IUpdate,
    IUser,
    TTelegramConnectionStatus,
} from "@/types/telegram";

import type { ITelegramOptions, TelegramApi } from "./api";

/* 收到更新的机器人: 调用接口所需的 Token 与服务器地址, 以及 getMe 的结果 */
export interface ITelegramBot {
    options: ITelegramOptions;
    me: IUser;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function sameOptions(a: ITelegramOptions, b: ITelegramOptions): boolean {
    return a.token === b.token && a.apiBaseUrl === b.apiBaseUrl;
}

/**
 * 以长轮询 (getUpdates) 接收 Telegram 的更新, 并记录连接状态供设置面板显示。
 * 确认位置 (offset) 只保存在内存中: 服务端记得哪些更新已经确认, 重新开始后不带 offset 请求即可收到所有未确认的更新;
 * 机器人一周没有更新后, 下一个 update_id 是随机的, 保存下来的 offset 可能比它更大, 之后就收不到更新了。
 * 服务端最多保留未确认的更新 24 小时。
 * 开始后先以 timeout 0 请求一次, 立即确认能否接收, 之后才是长轮询。
 * 失败后 2 秒重试, 连续失败 3 次后等待 30 秒; 超过频率限制时按 retry_after 等待;
 * Token 无效 (401、404) 与冲突 (409: 设置了 Webhook, 或者其他程序也在接收) 时停止, 修改设置后再次开始。
 * 进行中的长轮询请求无法取消: 停止后它返回的更新被丢弃, 也没有被确认, 下次开始时会再次收到;
 * 新的 getUpdates 请求会让服务端以 409 结束旧的请求, 旧请求的结果已被丢弃, 不受影响。
 * Receives Telegram updates by long polling getUpdates and keeps the
 * connection state for the settings panel. The offset is kept in memory only,
 * because the server remembers the confirmed updates.
 */
export class TelegramPoller {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: TelegramApi;
    private readonly onUpdate: (bot: ITelegramBot, update: IUpdate) => void;
    private readonly onReady: (bot: ITelegramBot) => void;

    private generation = 0; // 轮询序号, 开始或停止时递增, 旧的轮询据此退出
    private options?: ITelegramOptions; // 正在使用的 Token 与服务器地址; undefined 表示没有运行
    private current: ITelegramConnectionState = { status: "stopped" }; // 连接状态

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - Bot API 客户端
     * @param onUpdate - 接收每个更新
     * @param onReady - 每次开始接收后 getMe 成功时调用
     */
    constructor(
        siyuan: kernel.ISiyuan,
        api: TelegramApi,
        onUpdate: (bot: ITelegramBot, update: IUpdate) => void,
        onReady: (bot: ITelegramBot) => void,
    ) {
        this.siyuan = siyuan;
        this.api = api;
        this.onUpdate = onUpdate;
        this.onReady = onReady;
    }

    /* 当前的连接状态 */
    public get state(): ITelegramConnectionState {
        return { ...this.current };
    }

    /**
     * 应用配置: Token 或 Bot API 地址变化时重新开始, 没有变化且仍在接收时保持不变;
     * 遇到不能自动恢复的错误而停止后, 再次调用时重新开始
     */
    public update(config: ITelegramBotConfig): void {
        let options: ITelegramOptions | undefined;
        try {
            options = resolveOptions(config);
        }
        catch (error) {
            this.stop();
            void this.siyuan.logger.error(`[telegram] ${errorMessage(error)}, skip receiving updates`);
            this.setState("failed", { error: errorMessage(error) });
            return;
        }
        if (!options) {
            this.stop();
            void this.siyuan.logger.info("[telegram] the token is not configured, skip receiving updates");
            this.setState("unconfigured");
            return;
        }
        if (this.options && sameOptions(this.options, options)) {
            return;
        }

        this.stop();
        const generation = ++this.generation;
        this.options = options;
        void this.run(generation, options);
    }

    /* 停止接收 */
    public stop(): void {
        if (this.options) {
            void this.siyuan.logger.info(`[telegram] stop receiving the updates of bot ${botIdOf(this.options.token)}`);
        }
        this.generation++;
        this.options = undefined;
        this.setState("stopped");
    }

    private async run(generation: number, options: ITelegramOptions): Promise<void> {
        const id = botIdOf(options.token);
        void this.siyuan.logger.info(`[telegram] start receiving the updates of bot ${id}`);
        this.setState("connecting");

        let me: IUser | undefined;
        let offset: number | undefined;
        let failures = 0;
        while (generation === this.generation) {
            try {
                if (!me) {
                    const result = await this.api.getMe(options);
                    if (generation !== this.generation) {
                        return;
                    }
                    me = result;
                    void this.siyuan.logger.info(`[telegram] bot ${id} is @${me.username ?? ""}`);
                    this.onReady({ options, me });
                }

                const connected = this.current.status === "connected";
                const updates = await this.api.getUpdates(options, offset, connected ? POLL_TIMEOUT : 0);
                if (generation !== this.generation) {
                    return;
                }
                failures = 0;
                if (!connected) {
                    this.setState("connected", me.username ? { username: me.username } : {});
                }
                if (updates.length === 0) {
                    continue;
                }

                offset = Math.max(...updates.map((update) => update.update_id)) + 1;
                const bot: ITelegramBot = { options, me };
                for (const update of updates) {
                    try {
                        this.onUpdate(bot, update);
                    }
                    catch (error) {
                        void this.siyuan.logger.warn(`[telegram] handle the update ${update.update_id} failed:`, errorMessage(error));
                    }
                }
            }
            catch (error) {
                if (generation !== this.generation) {
                    return;
                }
                if (error instanceof TelegramApiError && FATAL_ERROR_CODES.has(error.code)) {
                    void this.siyuan.logger.error(`[telegram] ${error.message}, stop receiving the updates of bot ${id} until the settings change`);
                    this.generation++;
                    this.options = undefined;
                    this.setState("failed", { error: error.message });
                    return;
                }
                failures = await this.wait(error, failures);
            }
        }
    }

    /**
     * 失败后等待: 超过频率限制时等待 retry_after 秒; 否则连续失败 3 次时等待 30 秒并重新计数, 其余等待 2 秒
     * @returns 新的连续失败次数
     */
    private async wait(error: unknown, failures: number): Promise<number> {
        const reason = errorMessage(error);
        const retryAfter = error instanceof TelegramApiError ? error.parameters.retry_after : undefined;
        let delay = RETRY_DELAY;
        let count = failures + 1;
        if (retryAfter !== undefined) {
            delay = retryAfter * 1000;
            count = failures;
        }
        else if (count >= MAX_CONSECUTIVE_FAILURES) {
            delay = BACKOFF_DELAY;
            count = 0;
        }
        void this.siyuan.logger.warn(`[telegram] ${reason}, retry in ${delay} ms`);
        this.setState("reconnecting", { error: reason, retryAt: new Date(Date.now() + delay).toISOString() });
        await sleep(delay);
        return count;
    }

    private setState(status: TTelegramConnectionStatus, details: Pick<ITelegramConnectionState, "error" | "retryAt" | "username"> = {}): void {
        this.current = { status, since: new Date().toISOString(), ...details };
    }
}
