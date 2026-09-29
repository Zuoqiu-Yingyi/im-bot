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
    ACCESS_TOKEN_URL,
    API_BASE_URL,
    DEFAULT_HEARTBEAT_INTERVAL,
    FATAL_CLOSE_CODES,
    IDENTIFY_CLOSE_CODES,
    OpCode,
    PROXY_DIAL_TIMEOUT,
    RECONNECT_BASE_DELAY,
    RECONNECT_MAX_DELAY,
} from "./constants";
import { formatIntents, resolveIntents } from "./intents";

import type * as kernel from "siyuan/kernel";

import type { IQQBotConfig } from "@/types/config";
import type { IAccessToken, IGatewayBot, IHelloData, IPayload, IReadyData } from "@/types/qq";

/* 生效中的连接参数 */
interface IOptions {
    appid: string;
    secret: string;
    intents: number;
}

/* 经内核转发的 HTTP 请求 */
interface IProxyRequest {
    url: string;
    method: "GET" | "POST";
    headers?: Record<string, string[]>; // 转发给目标的请求头
    json?: unknown; // JSON 请求体
}

/* 目标的响应 */
interface IProxyResponse {
    status: number;
    body: string;
}

/* 重试无意义的错误 (如凭证错误), 抛出后停止重连 */
class FatalError extends Error { }

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function parseJson<T>(text: string): T | undefined {
    try {
        return JSON.parse(text) as T;
    }
    catch {
        return undefined;
    }
}

/* /api/network/proxy 与 /ws/network/proxy 的 u、h 参数: 不带填充的 base64url */
function encodeBase64Url(text: string): string {
    // eslint-disable-next-line node/prefer-global/buffer
    return Buffer.from(text, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/**
 * QQ 机器人 WebSocket 网关客户端: 鉴权、心跳、断线 resume 与退避重连。
 * 内核插件的 siyuan.client 只能访问本机内核, 所以 HTTP 请求经 /api/network/proxy,
 * WebSocket 经 /ws/network/proxy 转发到 QQ 服务器。
 * QQ bot WebSocket gateway client: identify, heartbeat, resume and reconnect with backoff.
 * siyuan.client only reaches the local kernel, so HTTP goes through
 * /api/network/proxy and the WebSocket through /ws/network/proxy.
 */
export class QQBotGateway {
    private readonly siyuan: kernel.ISiyuan;
    private readonly onDispatch: (payload: IPayload) => void;

    private options?: IOptions; // undefined 表示未启动或已停止

    private socket?: kernel.IWebSocket;
    private connection = 0; // 连接序号, 连接建立或废弃时递增, 旧连接的回调据此忽略

    private token = "";
    private sessionId = "";
    private seq = 0;

    private heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL;
    private heartbeatTimer?: ReturnType<typeof setInterval>;
    private heartbeatAcked = true;

    private reconnectTimer?: ReturnType<typeof setTimeout>;
    private reconnectAttempts = 0;

    /**
     * @param siyuan - 内核插件全局对象
     * @param onDispatch - 接收网关推送的每个事件 (op=0), 包括 READY 与 RESUMED
     */
    constructor(siyuan: kernel.ISiyuan, onDispatch: (payload: IPayload) => void) {
        this.siyuan = siyuan;
        this.onDispatch = onDispatch;
    }

    /**
     * 应用配置: 连接参数变化时重新连接, 未变化且仍在运行时保持现有连接
     */
    public async update(config: IQQBotConfig): Promise<void> {
        const options = this.resolveOptions(config);
        if (options
            && this.options
            && options.appid === this.options.appid
            && options.secret === this.options.secret
            && options.intents === this.options.intents) {
            return;
        }

        await this.stop();
        if (options) {
            this.options = options;
            void this.siyuan.logger.info(`[qq] connecting, intents: ${formatIntents(options.intents)}`);
            void this.connect();
        }
    }

    /**
     * 断开连接并停止重连
     */
    public async stop(): Promise<void> {
        this.options = undefined;
        this.clearReconnect();
        this.resetSession();
        await this.detach(1000, "stop");
    }

    /* 校验配置, 配置不完整时返回 undefined */
    private resolveOptions(config: IQQBotConfig): IOptions | undefined {
        const appid = config.appid.trim();
        const secret = config.secret.trim();
        if (!appid || !secret) {
            void this.siyuan.logger.info("[qq] QQ_BOT_APPID or QQ_BOT_SECRET is not configured, skip connecting");
            return undefined;
        }

        const intents = resolveIntents(config.intents);
        if (intents === 0) {
            void this.siyuan.logger.warn("[qq] no event is subscribed in QQ_BOT_INTENTS, skip connecting");
            return undefined;
        }
        return { appid, secret, intents };
    }

    /* 获取凭证与接入点, 然后经内核代理连接网关 */
    private async connect(): Promise<void> {
        const options = this.options;
        if (!options) {
            return;
        }

        const connection = ++this.connection;
        try {
            const token = await this.fetchAccessToken(options);
            const gateway = await this.fetchGateway(token);
            if (connection !== this.connection) {
                return;
            }
            this.token = token;

            const limit = gateway.session_start_limit;
            void this.siyuan.logger.debug(`[qq] gateway: ${gateway.url}, session start limit: ${JSON.stringify(limit)}`);
            if (!this.sessionId && limit && limit.remaining <= 0) {
                void this.siyuan.logger.warn(`[qq] no session starts remaining, retry in ${limit.reset_after} ms`);
                this.scheduleReconnect(limit.reset_after);
                return;
            }

            const socket = await this.siyuan.client.socket(`/ws/network/proxy?u=${encodeBase64Url(gateway.url)}`);
            if (connection !== this.connection) {
                socket.close().catch(() => { });
                return;
            }
            this.socket = socket;

            socket.onmessage = (event) => this.onMessage(connection, event);
            socket.onclose = (event) => this.onDisconnect(connection, `closed ${event.code} ${event.reason}`, event.code);
            socket.onerror = (event) => {
                // 连接断开时内核先调用 onerror, 收到关闭帧时才紧接着调用带关闭码的 onclose;
                // 推迟处理, 让 onclose 先按关闭码决定能否重连
                setTimeout(() => this.onDisconnect(connection, `error ${errorMessage(event.error)}`), 0);
            };
            await socket.open();
        }
        catch (error) {
            if (connection !== this.connection) {
                return;
            }
            if (error instanceof FatalError) {
                void this.siyuan.logger.error(`[qq] ${error.message}, stop connecting`);
                this.options = undefined;
                return;
            }
            this.onDisconnect(connection, `connect failed: ${errorMessage(error)}`);
        }
    }

    /* 处理网关下发的数据包 */
    private onMessage(connection: number, event: kernel.IWebSocketMessageEvent): void {
        if (connection !== this.connection || typeof event.data !== "string") {
            return;
        }

        let payload: IPayload;
        try {
            payload = JSON.parse(event.data);
        }
        catch {
            void this.siyuan.logger.warn(`[qq] invalid payload: ${event.data}`);
            return;
        }

        switch (payload.op) {
            case OpCode.HELLO:
                this.heartbeatInterval = (payload.d as IHelloData | undefined)?.heartbeat_interval || DEFAULT_HEARTBEAT_INTERVAL;
                void this.siyuan.logger.debug(`[qq] hello, heartbeat interval: ${this.heartbeatInterval} ms`);
                if (this.sessionId) {
                    this.resume(connection);
                }
                else {
                    this.identify(connection);
                }
                break;

            case OpCode.DISPATCH:
                if (typeof payload.s === "number") {
                    this.seq = payload.s;
                }
                if (payload.t === "READY") {
                    this.sessionId = (payload.d as IReadyData).session_id;
                    this.onSessionReady(connection);
                }
                else if (payload.t === "RESUMED") {
                    this.onSessionReady(connection);
                }
                this.onDispatch(payload);
                break;

            case OpCode.HEARTBEAT: // 网关要求立即发送心跳
                this.sendHeartbeat(connection);
                break;

            case OpCode.HEARTBEAT_ACK:
                this.heartbeatAcked = true;
                void this.siyuan.logger.trace("[qq] heartbeat ACK");
                break;

            case OpCode.RECONNECT:
                this.onDisconnect(connection, "the gateway requests a reconnect");
                break;

            case OpCode.INVALID_SESSION:
                this.resetSession();
                this.onDisconnect(connection, "invalid session");
                break;

            default:
                void this.siyuan.logger.debug(`[qq] unhandled payload: ${event.data}`);
                break;
        }
    }

    /* READY 或 RESUMED: 重置退避并开始心跳 */
    private onSessionReady(connection: number): void {
        this.reconnectAttempts = 0;
        this.stopHeartbeat();
        this.sendHeartbeat(connection);
        this.heartbeatTimer = setInterval(() => {
            if (!this.heartbeatAcked) {
                this.onDisconnect(connection, "no heartbeat ACK within the heartbeat interval");
                return;
            }
            this.sendHeartbeat(connection);
        }, this.heartbeatInterval);
    }

    /**
     * 连接断开或需要重连
     * @param connection - 触发断开的连接序号, 不是当前连接时忽略
     * @param reason - 写入日志的原因
     * @param code - 网关的关闭码, 决定 resume、重新 identify 还是停止
     */
    private onDisconnect(connection: number, reason: string, code?: number): void {
        if (connection !== this.connection) {
            return;
        }
        void this.detach(4000, "reconnect");

        if (code !== undefined && FATAL_CLOSE_CODES.has(code)) {
            void this.siyuan.logger.error(`[qq] disconnected (${reason}): ${FATAL_CLOSE_CODES.get(code)}, stop reconnecting`);
            this.options = undefined;
            this.resetSession();
            return;
        }
        if (code !== undefined && IDENTIFY_CLOSE_CODES.has(code)) {
            this.resetSession();
        }

        void this.siyuan.logger.warn(`[qq] disconnected (${reason}), will ${this.sessionId ? "resume" : "identify"}`);
        this.scheduleReconnect();
    }

    /* 废弃当前连接: 之后它的回调都会被忽略 */
    private async detach(code: number, reason: string): Promise<void> {
        this.connection++;
        this.stopHeartbeat();
        const socket = this.socket;
        this.socket = undefined;
        // 连接可能已经关闭, 此时 close 会失败
        await socket?.close(code, reason).catch(() => { });
    }

    private scheduleReconnect(delay: number = this.nextReconnectDelay()): void {
        if (!this.options) {
            return;
        }
        this.clearReconnect();
        void this.siyuan.logger.info(`[qq] reconnect in ${delay} ms`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            void this.connect();
        }, delay);
    }

    /* 指数退避: 1s, 2s, 4s ... 最长 60s */
    private nextReconnectDelay(): number {
        const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** this.reconnectAttempts, RECONNECT_MAX_DELAY);
        this.reconnectAttempts++;
        return delay;
    }

    private clearReconnect(): void {
        if (this.reconnectTimer !== undefined) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }

    private resetSession(): void {
        this.sessionId = "";
        this.seq = 0;
    }

    private identify(connection: number): void {
        void this.send(connection, {
            op: OpCode.IDENTIFY,
            d: {
                token: `QQBot ${this.token}`,
                intents: this.options?.intents,
                shard: [0, 1],
            },
        });
    }

    private resume(connection: number): void {
        void this.send(connection, {
            op: OpCode.RESUME,
            d: {
                token: `QQBot ${this.token}`,
                session_id: this.sessionId,
                seq: this.seq,
            },
        });
    }

    private sendHeartbeat(connection: number): void {
        this.heartbeatAcked = false;
        void this.siyuan.logger.trace(`[qq] heartbeat, seq: ${this.seq}`);
        void this.send(connection, {
            op: OpCode.HEARTBEAT,
            d: this.seq || null,
        });
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer !== undefined) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }

    private async send(connection: number, payload: IPayload): Promise<void> {
        const socket = this.socket;
        if (connection !== this.connection || !socket) {
            return;
        }
        try {
            await socket.send(JSON.stringify(payload));
        }
        catch (error) {
            // 发送失败说明连接已断开, 由 onclose/onerror 或心跳超时处理重连
            void this.siyuan.logger.warn(`[qq] send op ${payload.op} failed: ${errorMessage(error)}`);
        }
    }

    /* 只有 identify/resume 需要凭证, 每次连接前重新获取, 避免使用过期凭证 */
    private async fetchAccessToken(options: IOptions): Promise<string> {
        const response = await this.proxy({
            url: ACCESS_TOKEN_URL,
            method: "POST",
            json: {
                appId: options.appid,
                clientSecret: options.secret,
            },
        });
        const body = parseJson<IAccessToken>(response.body);
        if (body?.access_token) {
            return body.access_token;
        }

        const detail = `get access token failed: ${response.status} ${response.body}`;
        if (response.status === 429 || response.status >= 500) {
            throw new Error(detail);
        }
        throw new FatalError(`${detail}, check QQ_BOT_APPID and QQ_BOT_SECRET`);
    }

    /* 获取带分片信息的 WebSocket 接入点 */
    private async fetchGateway(token: string): Promise<IGatewayBot> {
        const response = await this.proxy({
            url: `${API_BASE_URL}/gateway/bot`,
            method: "GET",
            headers: { Authorization: [`QQBot ${token}`] },
        });
        const body = parseJson<IGatewayBot>(response.body);
        if (body?.url) {
            return body;
        }
        throw new Error(`get gateway failed: ${response.status} ${response.body}`);
    }

    /**
     * 经内核 /api/network/proxy 发出 HTTP 请求。
     * 内核把请求方法、请求体与 Content-Type 转发给 u 参数指定的目标, 其他请求头只能放在 h 参数中;
     * 目标的响应一律以 application/octet-stream 返回, 其他媒体类型是内核自身的拒绝 (参数错误、无法连接目标等)。
     */
    private async proxy(request: IProxyRequest): Promise<IProxyResponse> {
        const headers = request.headers
            ? `&h=${encodeBase64Url(JSON.stringify(request.headers))}`
            : "";
        const response = await this.siyuan.client.fetch(`/api/network/proxy?u=${encodeBase64Url(request.url)}&t=${PROXY_DIAL_TIMEOUT}ms${headers}`, request.json === undefined
            ? { method: request.method }
            : {
                    method: request.method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request.json),
                });

        const body = await response.text();
        const contentType: string | undefined = response.headers["Content-Type"];
        if (!contentType?.startsWith("application/octet-stream")) {
            const failure = parseJson<{ msg?: string }>(body);
            throw new Error(`proxy ${request.method} ${request.url} failed: ${response.status} ${failure?.msg ?? body}`);
        }
        return { status: response.status, body };
    }
}
