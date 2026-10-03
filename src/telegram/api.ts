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

import { parseJson, proxyFetch, proxyFetchBinary } from "@/utils/proxy";

import {
    ALLOWED_UPDATES,
    DEFAULT_API_BASE_URL,
    MAX_SEND_RETRY_AFTER,
    POLL_LIMIT,
    SEND_ATTEMPTS,
    TOKEN_PATTERN,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type { ITelegramBotConfig } from "@/types/config";
import type {
    IChatMember,
    IFile,
    IMessage,
    IResponse,
    IResponseParameters,
    IUpdate,
    IUser,
} from "@/types/telegram";
import type { IProxyResponse } from "@/utils/proxy";

/* 调用 Bot API 所需的 Token 与服务器地址 */
export interface ITelegramOptions {
    token: string;
    apiBaseUrl: string; // 不带末尾的 `/`
}

const BASE_URL = /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/; // 不带查询参数与片段的 http 或 https 地址

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/* 机器人 ID: Token 中冒号之前的部分, 也是机器人的用户 ID */
export function botIdOf(token: string): string {
    return token.slice(0, token.indexOf(":"));
}

/* 把文本中的 Token 替换为 `<机器人 ID>:***`: Token 在请求地址中, 内核转发失败时的错误信息带有完整的地址 */
function redact(text: string, token: string): string {
    return text.replaceAll(token, () => `${botIdOf(token)}:***`);
}

/**
 * 校验配置中的 Token 与 Bot API 地址
 * @returns 没有填写 Token 时为 undefined
 * @throws Token 或 Bot API 地址的格式不正确, 错误信息中不含 Token
 */
export function resolveOptions(config: Pick<ITelegramBotConfig, "apiBaseUrl" | "token">): ITelegramOptions | undefined {
    const token = config.token.trim();
    if (!token) {
        return undefined;
    }
    if (!TOKEN_PATTERN.test(token)) {
        throw new Error("the token is not in the form <bot ID>:<secret> given by @BotFather");
    }
    const apiBaseUrl = (config.apiBaseUrl.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    if (!BASE_URL.test(apiBaseUrl)) {
        throw new Error(`the Bot API server ${apiBaseUrl} is not an http or https URL without a query or a fragment`);
    }
    return { token, apiBaseUrl };
}

/* Bot API 返回的错误 (ok 为 false), 或者不是 Bot API 格式的响应; 错误信息中不含 Token */
export class TelegramApiError extends Error {
    public readonly code: number; // error_code; 响应不是 Bot API 的格式时为 HTTP 状态码
    public readonly parameters: IResponseParameters;

    constructor(message: string, code: number, parameters: IResponseParameters = {}) {
        super(message);
        this.name = "TelegramApiError";
        this.code = code;
        this.parameters = parameters;
    }
}

/**
 * Telegram Bot API 的客户端, 请求经内核 /api/network/proxy 转发。
 * Token 是请求地址的一部分, 所以抛出的错误都去掉了 Token。
 * Client of the Telegram Bot API; requests go through the kernel's
 * /api/network/proxy. The token is part of the request URL, so it is removed
 * from every thrown error.
 */
export class TelegramApi {
    private readonly siyuan: kernel.ISiyuan;

    constructor(siyuan: kernel.ISiyuan) {
        this.siyuan = siyuan;
    }

    /* 机器人自己的信息, 用于验证 Token */
    public async getMe(options: ITelegramOptions): Promise<IUser> {
        return this.call(options, "getMe");
    }

    /**
     * 长轮询获取更新
     * @param options - Token 与服务器地址
     * @param offset - 第一个要返回的更新的 update_id, 之前的更新随之确认, 服务端不再返回; 省略时返回所有未确认的更新
     * @param timeout - 长轮询的秒数
     */
    public async getUpdates(options: ITelegramOptions, offset: number | undefined, timeout: number): Promise<IUpdate[]> {
        return this.call(options, "getUpdates", {
            offset,
            limit: POLL_LIMIT,
            timeout,
            allowed_updates: ALLOWED_UPDATES,
        });
    }

    /**
     * 发送一条纯文本消息
     * @param options - Token 与服务器地址
     * @param chatId - 会话 ID
     * @param text - 消息内容, 不解析格式
     * @param replyTo - 要回复的消息 ID; 该消息已被删除时直接发送
     */
    public async sendText(options: ITelegramOptions, chatId: number | string, text: string, replyTo?: number): Promise<IMessage> {
        return this.callWithRetry(options, "sendMessage", {
            chat_id: chatId,
            text,
            reply_parameters: replyTo === undefined
                ? undefined
                : { message_id: replyTo, allow_sending_without_reply: true },
            link_preview_options: { is_disabled: true },
        });
    }

    /* 用户在会话中的身份 */
    public async getChatMember(options: ITelegramOptions, chatId: number, userId: number): Promise<IChatMember> {
        return this.callWithRetry(options, "getChatMember", { chat_id: chatId, user_id: userId });
    }

    /* 文件的下载路径 file_path; 官方服务器只允许下载 20 MB 以内的文件 */
    public async getFile(options: ITelegramOptions, fileId: string): Promise<IFile> {
        return this.callWithRetry(options, "getFile", { file_id: fileId });
    }

    /**
     * 下载 getFile 返回的文件
     * @throws 内核无法转发、请求超时或 HTTP 状态码不是 2xx
     */
    public async download(options: ITelegramOptions, filePath: string): Promise<ArrayBuffer> {
        const path = filePath.split("/").map(encodeURIComponent).join("/");
        let response: IProxyResponse<ArrayBuffer>;
        try {
            response = await proxyFetchBinary(this.siyuan, {
                url: `${options.apiBaseUrl}/file/bot${options.token}/${path}`,
                method: "GET",
            });
        }
        catch (error) {
            throw new Error(redact(`download ${filePath} failed: ${errorMessage(error)}`, options.token));
        }
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`download ${filePath} failed: HTTP ${response.status}`);
        }
        return response.body;
    }

    /**
     * 调用 Bot API 方法, 参数以 JSON 发送
     * @throws TelegramApiError: 返回的 ok 为 false, 或者响应不是 Bot API 的格式; Error: 内核无法转发或请求超时
     */
    private async call<T>(options: ITelegramOptions, method: string, params: Record<string, unknown> = {}): Promise<T> {
        let response: IProxyResponse;
        try {
            response = await proxyFetch(this.siyuan, {
                url: `${options.apiBaseUrl}/bot${options.token}/${method}`,
                method: "POST",
                json: params,
            });
        }
        catch (error) {
            throw new Error(redact(`${method} failed: ${errorMessage(error)}`, options.token));
        }

        const body = parseJson<Partial<IResponse<T>>>(response.body);
        if (typeof body?.ok !== "boolean") {
            throw new TelegramApiError(redact(`${method} failed: HTTP ${response.status} ${response.body.slice(0, 200)}`, options.token), response.status);
        }
        if (!body.ok) {
            const code = body.error_code ?? response.status;
            throw new TelegramApiError(redact(`${method} failed: ${code} ${body.description ?? ""}`.trim(), options.token), code, body.parameters);
        }
        return body.result as T;
    }

    /* 与 call 相同, 但超过频率限制 (返回 retry_after) 时等待后重试, 最多尝试 SEND_ATTEMPTS 次 */
    private async callWithRetry<T>(options: ITelegramOptions, method: string, params: Record<string, unknown>): Promise<T> {
        for (let attempt = 1; ; attempt++) {
            try {
                return await this.call<T>(options, method, params);
            }
            catch (error) {
                const retryAfter = error instanceof TelegramApiError ? error.parameters.retry_after : undefined;
                if (retryAfter === undefined || attempt >= SEND_ATTEMPTS || retryAfter > MAX_SEND_RETRY_AFTER) {
                    throw error;
                }
                void this.siyuan.logger.info(`[telegram] ${method} is rate limited, retry in ${retryAfter} s`);
                await sleep(retryAfter * 1000);
            }
        }
    }
}
