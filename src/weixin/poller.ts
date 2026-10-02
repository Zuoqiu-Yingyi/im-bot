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

import { resultCode } from "./api";
import {
    BACKOFF_DELAY,
    MAX_CONSECUTIVE_FAILURES,
    RETRY_DELAY,
    SESSION_EXPIRED,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type { IGetUpdatesResponse, IWeixinAccount, IWeixinMessage } from "@/types/weixin";

import type { WeixinApi } from "./api";

/* 保存的游标, 只属于一次登录: 重新扫码登录后从头开始 */
interface ICursor {
    botId: string;
    loginTime: string;
    cursor: string; // get_updates_buf
}

/* 游标文件, 相对插件数据目录; 不需要监听其变化, 所以放在子目录中 (存储目录的监听不包括子目录) */
const CURSOR_FILE = "weixin/cursor.json";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 两份登录信息是否可以共用同一个轮询 */
function sameLogin(a: IWeixinAccount, b: IWeixinAccount): boolean {
    return a.botId === b.botId && a.token === b.token && a.baseUrl === b.baseUrl && a.userId === b.userId;
}

/**
 * 以长轮询 (getupdates) 接收微信消息, 游标保存在 weixin/cursor.json 中, 重新启动后从上次的位置继续, 重新登录后从头开始。
 * 重试规则与官方客户端的 monitor.ts 相同: 失败后 2 秒重试, 连续失败 3 次后等待 30 秒;
 * 返回 -14 (登录失效) 时停止轮询并调用 onExpired, 需要重新扫码 (官方客户端会暂停 1 小时后重试)。
 * 进行中的长轮询请求无法取消: 停止后它返回的消息被丢弃, 游标也不会前进, 下次轮询时会再次收到这些消息。
 * Receives WeChat messages by long polling getupdates, and keeps the cursor in
 * weixin/cursor.json to resume after a restart.
 */
export class WeixinPoller {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: WeixinApi;
    private readonly onMessage: (account: IWeixinAccount, message: IWeixinMessage) => void;
    private readonly onExpired: (account: IWeixinAccount) => void;

    private generation = 0; // 轮询序号, 开始或停止时递增, 旧的轮询据此退出
    private account?: IWeixinAccount; // 正在轮询的登录信息

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 微信接口客户端
     * @param onMessage - 接收每条消息, 包括机器人自己发出的消息
     * @param onExpired - 登录失效, 轮询已停止
     */
    constructor(
        siyuan: kernel.ISiyuan,
        api: WeixinApi,
        onMessage: (account: IWeixinAccount, message: IWeixinMessage) => void,
        onExpired: (account: IWeixinAccount) => void,
    ) {
        this.siyuan = siyuan;
        this.api = api;
        this.onMessage = onMessage;
        this.onExpired = onExpired;
    }

    /* 是否正在轮询 */
    public get running(): boolean {
        return this.account !== undefined;
    }

    /* 用 account 开始轮询; 已经在用相同的登录信息轮询时保持不变 */
    public start(account: IWeixinAccount): void {
        if (this.account && sameLogin(this.account, account)) {
            return;
        }
        void this.stop();
        const generation = ++this.generation;
        this.account = account;
        void this.run(generation, account);
    }

    /* 停止轮询, 并通知服务端 */
    public async stop(): Promise<void> {
        const account = this.account;
        if (!account) {
            return;
        }
        this.generation++;
        this.account = undefined;
        void this.siyuan.logger.info(`[weixin] stop receiving the messages of bot ${account.botId}`);
        await this.notify(account, "stop");
    }

    /* 删除保存的游标, 用于退出登录 */
    public async removeCursor(): Promise<void> {
        try {
            await this.siyuan.storage.remove(CURSOR_FILE);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] remove ${CURSOR_FILE} failed:`, errorMessage(error));
        }
    }

    private async run(generation: number, account: IWeixinAccount): Promise<void> {
        void this.siyuan.logger.info(`[weixin] start receiving the messages of bot ${account.botId}`);
        await this.notify(account, "start");
        let cursor = await this.loadCursor(account);
        let failures = 0;
        while (generation === this.generation) {
            let response: IGetUpdatesResponse;
            try {
                response = await this.api.getUpdates(account, cursor);
            }
            catch (error) {
                if (generation !== this.generation) {
                    return;
                }
                failures = await this.backoff(failures, `getupdates failed: ${errorMessage(error)}`);
                continue;
            }
            if (generation !== this.generation) {
                return;
            }

            const code = resultCode(response);
            if (code === SESSION_EXPIRED) {
                void this.siyuan.logger.error(`[weixin] the login of bot ${account.botId} expired (${response.errmsg ?? ""}), stop receiving messages until the QR code is scanned again`);
                this.generation++;
                this.account = undefined;
                this.onExpired(account);
                return;
            }
            if (code !== 0) {
                failures = await this.backoff(failures, `getupdates failed: ${code} ${response.errmsg ?? ""}`);
                continue;
            }

            failures = 0;
            if (response.get_updates_buf && response.get_updates_buf !== cursor) {
                cursor = response.get_updates_buf;
                await this.saveCursor(account, cursor);
            }
            for (const message of response.msgs ?? []) {
                try {
                    this.onMessage(account, message);
                }
                catch (error) {
                    void this.siyuan.logger.warn(`[weixin] handle the message ${message.message_id} failed:`, errorMessage(error));
                }
            }
        }
    }

    /**
     * 失败后等待: 连续失败 3 次时等待 30 秒并重新计数, 否则等待 2 秒
     * @returns 新的连续失败次数
     */
    private async backoff(failures: number, reason: string): Promise<number> {
        const count = failures + 1;
        if (count >= MAX_CONSECUTIVE_FAILURES) {
            void this.siyuan.logger.warn(`[weixin] ${reason}, ${count} consecutive failures, retry in ${BACKOFF_DELAY} ms`);
            await sleep(BACKOFF_DELAY);
            return 0;
        }
        void this.siyuan.logger.warn(`[weixin] ${reason}, retry in ${RETRY_DELAY} ms`);
        await sleep(RETRY_DELAY);
        return count;
    }

    /* notifystart 与 notifystop 只用于服务端对账, 失败时只记录日志 */
    private async notify(account: IWeixinAccount, event: "start" | "stop"): Promise<void> {
        try {
            const response = await this.api.notify(account, event);
            const code = resultCode(response);
            if (code !== 0) {
                void this.siyuan.logger.warn(`[weixin] notify${event} failed: ${code} ${response.errmsg ?? ""}`);
            }
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] notify${event} failed:`, errorMessage(error));
        }
    }

    /* 这次登录保存的游标, 没有时为空字符串 */
    private async loadCursor(account: IWeixinAccount): Promise<string> {
        try {
            const data = await (await this.siyuan.storage.get(CURSOR_FILE)).json() as null | Partial<ICursor>;
            return data?.botId === account.botId && data.loginTime === account.loginTime && typeof data.cursor === "string"
                ? data.cursor
                : "";
        }
        catch {
            // 还没有游标文件
            return "";
        }
    }

    private async saveCursor(account: IWeixinAccount, cursor: string): Promise<void> {
        const data: ICursor = { botId: account.botId, loginTime: account.loginTime, cursor };
        try {
            await this.siyuan.storage.put(CURSOR_FILE, JSON.stringify(data));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] save ${CURSOR_FILE} failed:`, errorMessage(error));
        }
    }
}
