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

import {
    parseJson,
    proxyFetch,
    proxyFetchBinary,
    redactProxyParams,
} from "@/utils/proxy";

import {
    DEFAULT_API_BASE_URL,
    ENDPOINT_FATAL_CODES,
    ENDPOINT_PATH,
    INVALID_TOKEN_CODES,
    TOKEN_FATAL_CODES,
    TOKEN_REFRESH_MARGIN,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type { IFeishuBotConfig } from "@/types/config";
import type {
    IApiMessage,
    IBotInfo,
    IChatInfo,
    IChatMembers,
    IClientConfig,
    IEndpointResponse,
    IResponse,
    ITenantTokenResponse,
} from "@/types/feishu";
import type { IProxyRequest, IProxyResponse } from "@/utils/proxy";

/* 调用开放平台所需的凭证与地址 */
export interface IFeishuOptions {
    appId: string;
    appSecret: string;
    apiBaseUrl: string; // 不带末尾的 `/`
}

/* 长连接的地址与参数 */
export interface IEndpoint {
    url: string; // wss 地址, 其中的票据只能使用一次
    config: IClientConfig;
}

/* 下载的资源文件 */
export interface IResource {
    data: ArrayBuffer;
    contentType: string; // 如 image/jpeg, 没有时为空字符串
}

/* 资源文件的类型: 图片为 image, 文件、音频与视频都是 file */
export type TResourceType = "file" | "image";

interface ICachedToken {
    token: string;
    expiresAt: number; // 过期时间 (ms)
}

const BASE_URL = /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/; // 不带查询参数与片段的 http 或 https 地址
const ERROR_BODY_MAX_BYTES = 64 * 1024; // 开放平台的错误响应很小, 超过这个大小的下载内容一定是资源文件本身

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 响应头的值, 不区分名称的大小写 */
function headerOf(headers: Record<string, string>, name: string): string {
    const lower = name.toLowerCase();
    return Object.entries(headers).find(([key]) => key.toLowerCase() === lower)?.[1] ?? "";
}

/**
 * 校验配置中的凭证与开放平台地址
 * @returns 没有填写 App ID 或 App Secret 时为 undefined
 * @throws 开放平台地址的格式不正确
 */
export function resolveOptions(config: Pick<IFeishuBotConfig, "apiBaseUrl" | "appId" | "appSecret">): IFeishuOptions | undefined {
    const appId = config.appId.trim();
    const appSecret = config.appSecret.trim();
    if (!appId || !appSecret) {
        return undefined;
    }
    const apiBaseUrl = (config.apiBaseUrl.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    if (!BASE_URL.test(apiBaseUrl)) {
        throw new Error(`the open platform address ${apiBaseUrl} is not an http or https URL without a query or a fragment`);
    }
    return { appId, appSecret, apiBaseUrl };
}

/* 开放平台返回的错误 (code 不为 0), 或者不是开放平台格式的响应 */
export class FeishuApiError extends Error {
    public readonly code: number; // 错误码; 响应不是开放平台的格式时为 HTTP 状态码
    public readonly status: number; // HTTP 状态码
    public readonly fatal: boolean; // 凭证无效等不能自动恢复的错误

    constructor(message: string, code: number, status: number, fatal = false) {
        super(message);
        this.name = "FeishuApiError";
        this.code = code;
        this.status = status;
        this.fatal = fatal;
    }
}

/**
 * 飞书开放平台的客户端, 请求经内核 /api/network/proxy 转发, 以应用身份 (tenant_access_token) 调用服务端 API。
 * tenant_access_token 按凭证缓存到过期前 5 分钟, 并发的请求共用同一次获取; 返回凭证无效的错误码时重新获取后重试一次。
 * Client of the Feishu open platform; requests go through the kernel's
 * /api/network/proxy as the app (tenant_access_token). The token is cached per
 * credentials until 5 minutes before it expires.
 */
export class FeishuApi {
    private readonly siyuan: kernel.ISiyuan;

    private readonly tokens = new Map<string, ICachedToken>(); // 凭证 → tenant_access_token
    private readonly pending = new Map<string, Promise<string>>(); // 凭证 → 进行中的获取

    constructor(siyuan: kernel.ISiyuan) {
        this.siyuan = siyuan;
    }

    /**
     * 换取长连接的地址与参数; 每次连接前都要重新换取, 地址中的票据只能使用一次
     * @throws FeishuApiError: 换取失败, App ID 或 App Secret 无效时 fatal 为 true; Error: 内核无法转发或请求超时
     */
    public async endpoint(options: IFeishuOptions): Promise<IEndpoint> {
        const label = "get the long connection endpoint";
        const response = await this.forward({
            url: `${options.apiBaseUrl}${ENDPOINT_PATH}`,
            method: "POST",
            headers: { locale: ["zh"] },
            json: { AppID: options.appId, AppSecret: options.appSecret },
        }, label);
        const body = parseJson<IEndpointResponse>(response.body);
        if (typeof body?.code !== "number") {
            throw new FeishuApiError(`${label} failed: HTTP ${response.status} ${response.body.slice(0, 200)}`, response.status, response.status);
        }
        if (body.code !== 0) {
            const fatal = ENDPOINT_FATAL_CODES.get(body.code);
            throw new FeishuApiError(fatal ? `${fatal} (${body.code})` : `${label} failed: ${body.code} ${body.msg ?? ""}`.trim(), body.code, response.status, !!fatal);
        }
        if (!body.data?.URL) {
            throw new FeishuApiError(`${label} failed: no URL is returned`, body.code, response.status);
        }
        return { url: body.data.URL, config: body.data.ClientConfig ?? {} };
    }

    /* 机器人的名称与 open_id; 应用没有添加机器人能力, 或者添加后还没有发布版本时失败 */
    public async botInfo(options: IFeishuOptions): Promise<IBotInfo> {
        // 该接口把结果放在 bot 字段中, 不在 data 中
        const body = await this.call<{ code: number; msg?: string; bot?: IBotInfo }>(options, "GET", "/open-apis/bot/v3/info");
        if (!body.bot?.open_id) {
            throw new FeishuApiError("get the bot info failed: no bot is returned, add the bot capability to the app and publish a version", 0, 200);
        }
        return body.bot;
    }

    /**
     * 向会话发送一条文本消息
     * @returns 发送的消息的 ID
     */
    public async sendText(options: IFeishuOptions, chatId: string, text: string): Promise<string> {
        const data = await this.request<{ message_id: string }>(options, "POST", "/open-apis/im/v1/messages?receive_id_type=chat_id", {
            receive_id: chatId,
            msg_type: "text",
            content: JSON.stringify({ text }),
        });
        return data.message_id;
    }

    /**
     * 回复一条消息
     * @returns 回复的消息的 ID
     */
    public async replyText(options: IFeishuOptions, messageId: string, text: string): Promise<string> {
        const data = await this.request<{ message_id: string }>(options, "POST", `/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`, {
            msg_type: "text",
            content: JSON.stringify({ text }),
        });
        return data.message_id;
    }

    /**
     * 获取指定消息; 合并转发消息还返回其中的子消息 (带 upper_message_id), 嵌套的合并转发也会展开
     * @returns 该消息在前, 之后是子消息
     */
    public async getMessage(options: IFeishuOptions, messageId: string): Promise<IApiMessage[]> {
        const data = await this.request<{ items?: IApiMessage[] }>(options, "GET", `/open-apis/im/v1/messages/${encodeURIComponent(messageId)}?user_id_type=open_id`);
        return data.items ?? [];
    }

    /* 群信息, 其中的用户 ID 为 open_id; 需要获取群信息的权限 */
    public async getChat(options: IFeishuOptions, chatId: string): Promise<IChatInfo> {
        return this.request<IChatInfo>(options, "GET", `/open-apis/im/v1/chats/${encodeURIComponent(chatId)}?user_id_type=open_id`);
    }

    /* 群成员列表的一页, 成员 ID 为 open_id; 需要获取群成员的权限 */
    public async getChatMembers(options: IFeishuOptions, chatId: string, pageToken?: string): Promise<IChatMembers> {
        const page = pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : "";
        return this.request<IChatMembers>(options, "GET", `/open-apis/im/v1/chats/${encodeURIComponent(chatId)}/members?member_id_type=open_id&page_size=100${page}`);
    }

    /**
     * 下载消息中的资源文件 (图片、文件、音频与视频); 合并转发中的资源要用收到的合并转发消息的 ID, 不能用子消息的 ID
     * @throws FeishuApiError: 开放平台返回错误; Error: 内核无法转发或请求超时
     */
    public async downloadResource(options: IFeishuOptions, messageId: string, key: string, type: TResourceType): Promise<IResource> {
        const label = `download the resource ${key} of the message ${messageId}`;
        for (let attempt = 1; ; attempt++) {
            const token = await this.tenantToken(options);
            let response: IProxyResponse<ArrayBuffer>;
            try {
                response = await proxyFetchBinary(this.siyuan, {
                    url: `${options.apiBaseUrl}/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/resources/${encodeURIComponent(key)}?type=${type}`,
                    method: "GET",
                    headers: { Authorization: [`Bearer ${token}`] },
                });
            }
            catch (error) {
                throw new Error(`${label} failed: ${redactProxyParams(errorMessage(error))}`);
            }

            const contentType = headerOf(response.headers, "Content-Type");
            const ok = response.status >= 200 && response.status < 300;
            // 资源文件本身也可能是 JSON: 成功的响应中, 只有带非 0 错误码的小 JSON 才是开放平台的错误
            if (ok && (!contentType.includes("json") || response.body.byteLength > ERROR_BODY_MAX_BYTES)) {
                return { data: response.body, contentType };
            }
            // eslint-disable-next-line node/prefer-global/buffer
            const text = Buffer.from(response.body).toString("utf8");
            const body = parseJson<IResponse<unknown>>(text);
            const code = typeof body?.code === "number" ? body.code : undefined;
            if (ok && !code) {
                return { data: response.body, contentType };
            }
            if (code !== undefined && INVALID_TOKEN_CODES.has(code) && attempt === 1) {
                this.dropToken(options);
                continue;
            }
            throw new FeishuApiError(
                code !== undefined
                    ? `${label} failed: ${code} ${body?.msg ?? ""}`.trim()
                    : `${label} failed: HTTP ${response.status} ${text.slice(0, 200)}`,
                code ?? response.status,
                response.status,
            );
        }
    }

    /**
     * 调用服务端 API, 返回 data
     * @throws FeishuApiError: code 不为 0, 或者响应不是开放平台的格式; Error: 内核无法转发或请求超时
     */
    public async request<T>(options: IFeishuOptions, method: string, path: string, json?: unknown): Promise<T> {
        const body = await this.call<IResponse<T>>(options, method, path, json);
        return body.data ?? {} as T;
    }

    /* 调用服务端 API, 返回整个响应体 (code 为 0); 凭证无效时重新获取后重试一次 */
    private async call<T extends { code?: number; msg?: string }>(options: IFeishuOptions, method: string, path: string, json?: unknown): Promise<T> {
        const label = `${method} ${path.replace(/\?.*$/, "")}`;
        for (let attempt = 1; ; attempt++) {
            const token = await this.tenantToken(options);
            const response = await this.forward({
                url: `${options.apiBaseUrl}${path}`,
                method,
                headers: { Authorization: [`Bearer ${token}`] },
                json,
            }, label);
            const body = parseJson<T>(response.body);
            if (typeof body?.code !== "number") {
                throw new FeishuApiError(`${label} failed: HTTP ${response.status} ${response.body.slice(0, 200)}`, response.status, response.status);
            }
            if (body.code === 0) {
                return body;
            }
            if (INVALID_TOKEN_CODES.has(body.code) && attempt === 1) {
                this.dropToken(options);
                continue;
            }
            throw new FeishuApiError(`${label} failed: ${body.code} ${body.msg ?? ""}`.trim(), body.code, response.status);
        }
    }

    /**
     * 获取 tenant_access_token, 缓存到过期前 5 分钟
     * @throws FeishuApiError: 获取失败, App ID 或 App Secret 无效时 fatal 为 true
     */
    private async tenantToken(options: IFeishuOptions): Promise<string> {
        const key = this.cacheKey(options);
        const cached = this.tokens.get(key);
        if (cached && cached.expiresAt - TOKEN_REFRESH_MARGIN > Date.now()) {
            return cached.token;
        }
        let pending = this.pending.get(key);
        if (!pending) {
            pending = this.fetchToken(options).finally(() => this.pending.delete(key));
            this.pending.set(key, pending);
        }
        return pending;
    }

    private async fetchToken(options: IFeishuOptions): Promise<string> {
        const label = "get tenant_access_token";
        const response = await this.forward({
            url: `${options.apiBaseUrl}/open-apis/auth/v3/tenant_access_token/internal`,
            method: "POST",
            json: { app_id: options.appId, app_secret: options.appSecret },
        }, label);
        const body = parseJson<ITenantTokenResponse>(response.body);
        if (typeof body?.code !== "number") {
            throw new FeishuApiError(`${label} failed: HTTP ${response.status} ${response.body.slice(0, 200)}`, response.status, response.status);
        }
        if (body.code !== 0 || !body.tenant_access_token) {
            throw new FeishuApiError(`${label} failed: ${body.code} ${body.msg ?? ""}`.trim(), body.code, response.status, TOKEN_FATAL_CODES.has(body.code));
        }
        this.tokens.set(this.cacheKey(options), {
            token: body.tenant_access_token,
            expiresAt: Date.now() + (body.expire ?? 7200) * 1000,
        });
        return body.tenant_access_token;
    }

    private dropToken(options: IFeishuOptions): void {
        this.tokens.delete(this.cacheKey(options));
    }

    private cacheKey(options: IFeishuOptions): string {
        return JSON.stringify([options.apiBaseUrl, options.appId, options.appSecret]);
    }

    /* 经内核转发请求; 目标地址中没有凭证, 但内核地址的 h 参数中有 Authorization, 记录错误前要去掉 */
    private async forward(request: IProxyRequest, label: string): Promise<IProxyResponse> {
        try {
            return await proxyFetch(this.siyuan, request);
        }
        catch (error) {
            throw new Error(`${label} failed: ${redactProxyParams(errorMessage(error))}`);
        }
    }
}
