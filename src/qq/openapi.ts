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

import { parseJson, proxyFetch } from "@/utils/proxy";

import {
    ACCESS_TOKEN_REFRESH_WINDOW,
    ACCESS_TOKEN_TOO_MANY_REQUESTS,
    ACCESS_TOKEN_URL,
    API_BASE_URL,
    API_METHODS,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type { IQQBotConfig } from "@/types/config";
import type { IAccessToken, IApiResponse } from "@/types/qq";

export type TCredentials = Pick<IQQBotConfig, "appid" | "secret">;

/* 调用 OpenAPI 的请求 */
export interface IApiRequest {
    url: string; // 请求路径, 以 `/` 开头, 相对 API_BASE_URL
    method: string; // 大写的请求方法
    body?: unknown; // JSON 请求体, undefined 表示没有请求体
}

/* 缓存的凭证 */
interface IAccessTokenCache extends TCredentials {
    value: string;
    expires: number; // 过期时刻 (ms)
}

/* 进行中的凭证请求, 并发调用共用同一个请求 */
interface IAccessTokenRequest extends TCredentials {
    promise: Promise<string>;
}

/* 重试无意义的错误 (如凭证错误) */
export class FatalError extends Error { }

/**
 * 校验 RPC call-qq-api 的参数
 * @param url - 请求路径, 如 `/v2/groups/{group_openid}/messages`; 必须以 `/` 开头, 凭证因此只会发给 API_BASE_URL
 * @param method - 请求方法, 不区分大小写
 * @param body - JSON 请求体, undefined 或 null 表示没有请求体 (JSON-RPC 的位置参数会把 undefined 序列化为 null)
 * @throws 参数无效
 */
export function resolveApiRequest(url: unknown, method: unknown, body: unknown): IApiRequest {
    if (typeof url !== "string" || !url.startsWith("/")) {
        throw new TypeError(`url must be a path starting with "/", got ${JSON.stringify(url)}`);
    }
    const upperMethod = typeof method === "string" ? method.toUpperCase() : "";
    if (!API_METHODS.has(upperMethod)) {
        throw new TypeError(`method must be one of ${[...API_METHODS].join(", ")}, got ${JSON.stringify(method)}`);
    }
    return { url, method: upperMethod, body: body ?? undefined };
}

/* 插件配置中的凭证, AppID 或 AppSecret 为空时返回 undefined */
export function resolveCredentials(config: TCredentials): TCredentials | undefined {
    const appid = config.appid.trim();
    const secret = config.secret.trim();
    return appid && secret ? { appid, secret } : undefined;
}

/* 响应体: JSON 解析后的值; 没有响应体时为 null, 不是 JSON 时为原始文本 */
function parseBody(text: string): unknown {
    if (!text) {
        return null;
    }
    const json = parseJson<unknown>(text);
    return json === undefined ? text : json;
}

/**
 * QQ 机器人开放平台服务端接口 (OpenAPI) 的客户端, 网关与 RPC call-qq-api 共用。
 * 凭证在有效期内复用, 请求经内核 /api/network/proxy 转发。
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/api-call-guide.html
 * Client of the QQ bot OpenAPI, shared by the gateway and the call-qq-api RPC
 * method. Reuses the access token while it is valid; requests go through the
 * kernel's /api/network/proxy.
 */
export class QQOpenApi {
    private readonly siyuan: kernel.ISiyuan;

    private token?: IAccessTokenCache;
    private tokenRequest?: IAccessTokenRequest;

    constructor(siyuan: kernel.ISiyuan) {
        this.siyuan = siyuan;
    }

    /**
     * 接口调用凭证: 距过期超过 60 秒时使用缓存, 否则重新获取
     * @throws FatalError - 凭证被拒绝 (AppID 或 AppSecret 错误等), 重试无意义
     * @throws Error - 请求失败或过于频繁, 可以稍后重试
     */
    public async accessToken(credentials: TCredentials): Promise<string> {
        const { appid, secret } = credentials;
        const token = this.token;
        if (token?.appid === appid && token.secret === secret && Date.now() < token.expires - ACCESS_TOKEN_REFRESH_WINDOW) {
            return token.value;
        }

        const pending = this.tokenRequest;
        if (pending?.appid === appid && pending.secret === secret) {
            return pending.promise;
        }

        const promise = this.fetchAccessToken(appid, secret);
        this.tokenRequest = { appid, secret, promise };
        try {
            return await promise;
        }
        finally {
            if (this.tokenRequest?.promise === promise) {
                this.tokenRequest = undefined;
            }
        }
    }

    /**
     * 以 `Authorization: QQBot {access_token}` 调用 OpenAPI
     * @returns 目标的响应, 任何状态码都会返回; 响应为 401 时丢弃缓存的凭证, 下次调用时重新获取
     * @throws 获取凭证失败、内核拒绝转发或请求超时
     */
    public async request(credentials: TCredentials, request: IApiRequest): Promise<IApiResponse> {
        const token = await this.accessToken(credentials);
        const response = await proxyFetch(this.siyuan, {
            url: `${API_BASE_URL}${request.url}`,
            method: request.method,
            headers: { Authorization: [`QQBot ${token}`] },
            json: request.body,
        });
        if (response.status === 401 && this.token?.value === token) {
            this.token = undefined;
        }
        return {
            status: response.status,
            headers: response.headers,
            body: parseBody(response.body),
        };
    }

    private async fetchAccessToken(appid: string, secret: string): Promise<string> {
        const response = await proxyFetch(this.siyuan, {
            url: ACCESS_TOKEN_URL,
            method: "POST",
            json: {
                appId: appid,
                clientSecret: secret,
            },
        });
        const body = parseJson<IAccessToken>(response.body);
        if (body?.access_token) {
            const expiresIn = Number(body.expires_in);
            this.token = {
                appid,
                secret,
                value: body.access_token,
                // 没有有效时间时不复用
                expires: Date.now() + (Number.isFinite(expiresIn) ? expiresIn * 1_000 : 0),
            };
            return body.access_token;
        }

        const detail = `get access token failed: ${response.status} ${response.body}`;
        if (response.status === 429 || response.status >= 500 || body?.code === ACCESS_TOKEN_TOO_MANY_REQUESTS) {
            throw new Error(detail);
        }
        throw new FatalError(`${detail}, check QQ_BOT_APPID and QQ_BOT_SECRET`);
    }
}
