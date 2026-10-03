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

import { encodeBase64Url, redactProxyParams } from "@/utils/proxy";

import { FeishuApiError, resolveOptions } from "./api";
import {
    DEFAULT_PING_INTERVAL,
    DIAL_TIMEOUT,
    FRAGMENT_TTL,
    FrameHeader,
    FrameMethod,
    FrameType,
    PONG_GRACE_PERIOD,
    RECENT_EVENTS,
    RECONNECT_BASE_DELAY,
    RECONNECT_MAX_DELAY,
    WATCHDOG_INTERVAL,
} from "./constants";
import {
    decodeFrame,
    encodeFrame,
    frameHeader,
    utf8Decode,
    utf8Encode,
} from "./protobuf";

import type * as kernel from "siyuan/kernel";

import type { IFeishuBotConfig } from "@/types/config";
import type {
    IBotInfo,
    IClientConfig,
    IEvent,
    IFeishuConnectionState,
    TFeishuConnectionStatus,
} from "@/types/feishu";

import type { FeishuApi, IEndpoint, IFeishuOptions } from "./api";
import type { IFrame } from "./protobuf";

/* 收到事件的机器人: 调用服务端 API 所需的凭证, 以及机器人信息 */
export interface IFeishuBot {
    options: IFeishuOptions;
    info: IBotInfo;
}

/* 一个分片事件已收到的分片 */
interface IFragments {
    parts: (Uint8Array | undefined)[];
    createdAt: number;
}

/* 一条 WebSocket 连接 */
interface IConnection {
    socket: kernel.IWebSocket;
    serviceId: number; // 帧的 service 字段, 取自连接地址中的 service_id
    pingInterval: number; // 心跳间隔 (ms), 由服务端下发
    lastInbound: number; // 最近收到帧的时间
    healthy: boolean; // 是否收到过帧: 服务端接受了连接
    fragments: Map<string, IFragments>; // 帧头的 message_id → 已收到的分片
    ended: boolean;
    finish: (reason: string) => void; // 结束这条连接, reason 为结束的原因
    pingTimer?: ReturnType<typeof setTimeout>;
    watchdogTimer?: ReturnType<typeof setInterval>;
}

/* 一条连接结束的结果 */
interface ISessionResult {
    healthy: boolean;
    reason: string;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function sameOptions(a: IFeishuOptions, b: IFeishuOptions): boolean {
    return a.appId === b.appId && a.appSecret === b.appSecret && a.apiBaseUrl === b.apiBaseUrl;
}

/* 服务端下发的秒数转为毫秒, 无效时为 undefined */
function milliseconds(seconds: number | undefined): number | undefined {
    return typeof seconds === "number" && seconds > 0 ? seconds * 1000 : undefined;
}

/* 连接地址的主机名, 用于日志: 地址中的 access_key 与 ticket 不能记录 */
function hostOf(url: string): string {
    return /^wss?:\/\/([^/?#]+)/i.exec(url)?.[1] ?? "the long connection server";
}

/**
 * 飞书长连接客户端: 换取连接地址、经内核 /ws/network/proxy 建立 WebSocket、心跳、合并分片、回包与退避重连,
 * 并记录连接状态供设置面板显示。帧是 protobuf 编码的二进制帧, 见 ./protobuf。
 * 收到的事件在 3 秒内回包 (code 200), 否则服务端会重推; 重推的事件按 event_id 丢弃。
 * 内核的 socket 没有读超时: 2 个心跳间隔加 5 秒内没有收到任何帧时, 认为连接已断开并重新连接。
 * 握手失败时内核只给出 502, 看不到飞书在响应头中说明的原因 (票据失效、鉴权失败、超过连接数), 所以都按可重试处理;
 * App ID 或 App Secret 无效时, 换取地址或获取 tenant_access_token 就会失败, 此时停止连接, 修改设置后再次连接。
 * Feishu long connection client: gets the endpoint, opens the WebSocket
 * through /ws/network/proxy, sends pings, merges fragments, acknowledges
 * events within 3 seconds and reconnects with backoff, keeping the state for
 * the settings panel.
 */
export class FeishuGateway {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: FeishuApi;
    private readonly onEvent: (bot: IFeishuBot, event: IEvent) => void;

    private generation = 0; // 运行序号, 开始或停止时递增, 旧的运行据此退出
    private options?: IFeishuOptions; // 正在使用的凭证; undefined 表示没有运行
    private connection?: IConnection;
    private current: IFeishuConnectionState = { status: "stopped" }; // 连接状态
    private readonly recent = new Set<string>(); // 最近收到的事件 ID

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 开放平台客户端
     * @param onEvent - 接收每个事件 (重推的除外)
     */
    constructor(siyuan: kernel.ISiyuan, api: FeishuApi, onEvent: (bot: IFeishuBot, event: IEvent) => void) {
        this.siyuan = siyuan;
        this.api = api;
        this.onEvent = onEvent;
    }

    /* 当前的连接状态 */
    public get state(): IFeishuConnectionState {
        return { ...this.current };
    }

    /**
     * 应用配置: 凭证或开放平台地址变化时重新连接, 没有变化且仍在运行时保持现有连接;
     * 遇到不能自动恢复的错误而停止后, 再次调用时重新连接
     */
    public update(config: IFeishuBotConfig): void {
        let options: IFeishuOptions | undefined;
        try {
            options = resolveOptions(config);
        }
        catch (error) {
            void this.stop();
            void this.siyuan.logger.error(`[feishu] ${errorMessage(error)}, skip connecting`);
            this.setState("failed", { error: errorMessage(error) });
            return;
        }
        if (!options) {
            void this.stop();
            void this.siyuan.logger.info("[feishu] the App ID or App Secret is not configured, skip connecting");
            this.setState("unconfigured");
            return;
        }
        if (this.options && sameOptions(this.options, options)) {
            return;
        }

        void this.stop();
        const generation = ++this.generation;
        this.options = options;
        void this.run(generation, options);
    }

    /* 断开连接并停止重连 */
    public async stop(): Promise<void> {
        if (this.options) {
            void this.siyuan.logger.info(`[feishu] stop the long connection of app ${this.options.appId}`);
        }
        this.generation++;
        this.options = undefined;
        const connection = this.connection;
        this.connection = undefined;
        this.setState("stopped");
        if (connection) {
            connection.finish("stopped");
            // 连接可能已经关闭, 此时 close 会失败
            await connection.socket.close(1000, "stop").catch(() => { });
        }
    }

    private async run(generation: number, options: IFeishuOptions): Promise<void> {
        void this.siyuan.logger.info(`[feishu] connect the long connection of app ${options.appId}`);
        this.setState("connecting");

        let info: IBotInfo | undefined;
        let attempts = 0; // 连续失败的次数, 决定下次重新连接前的等待时间
        while (generation === this.generation) {
            let reason: string;
            try {
                if (!info) {
                    const result = await this.api.botInfo(options);
                    if (generation !== this.generation) {
                        return;
                    }
                    info = result;
                    void this.siyuan.logger.info(`[feishu] app ${options.appId} is the bot ${info.app_name} (${info.open_id})`);
                }
                const endpoint = await this.api.endpoint(options);
                if (generation !== this.generation) {
                    return;
                }
                const result = await this.session(generation, { options, info }, endpoint);
                if (generation !== this.generation) {
                    return;
                }
                if (result.healthy) {
                    attempts = 0;
                }
                reason = result.reason;
            }
            catch (error) {
                if (generation !== this.generation) {
                    return;
                }
                if (error instanceof FeishuApiError && error.fatal) {
                    void this.siyuan.logger.error(`[feishu] ${error.message}, stop connecting until the settings change`);
                    this.generation++;
                    this.options = undefined;
                    this.setState("failed", { error: error.message });
                    return;
                }
                reason = errorMessage(error);
            }

            const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** attempts, RECONNECT_MAX_DELAY);
            attempts++;
            void this.siyuan.logger.warn(`[feishu] disconnected (${reason}), reconnect in ${delay} ms`);
            this.setState("reconnecting", { error: reason, retryAt: new Date(Date.now() + delay).toISOString() });
            await sleep(delay);
        }
    }

    /**
     * 建立一条连接并一直使用到它断开
     * @returns 连接结束的原因, 以及服务端是否接受了这条连接
     */
    private async session(generation: number, bot: IFeishuBot, endpoint: IEndpoint): Promise<ISessionResult> {
        const host = hostOf(endpoint.url);
        const socket = await this.siyuan.client.socket(`/ws/network/proxy?u=${encodeBase64Url(endpoint.url)}&t=${DIAL_TIMEOUT}`);
        let resolve!: (reason: string) => void;
        const ended = new Promise<string>((done) => {
            resolve = done;
        });
        const connection: IConnection = {
            socket,
            serviceId: Number(/[?&]service_id=(\d+)/.exec(endpoint.url)?.[1] ?? 0),
            pingInterval: milliseconds(endpoint.config.PingInterval) ?? DEFAULT_PING_INTERVAL,
            lastInbound: Date.now(),
            healthy: false,
            fragments: new Map(),
            ended: false,
            finish: (reason) => {
                if (connection.ended) {
                    return;
                }
                connection.ended = true;
                clearTimeout(connection.pingTimer);
                clearInterval(connection.watchdogTimer);
                resolve(reason);
            },
        };
        if (generation !== this.generation) {
            await socket.close().catch(() => { });
            return { healthy: false, reason: "stopped" };
        }
        this.connection = connection;

        socket.onmessage = (event) => this.onMessage(connection, bot, event);
        socket.onclose = (event) => connection.finish(`closed ${event.code} ${event.reason}`.trim());
        socket.onerror = (event) => {
            // 收到关闭帧时内核先调用 onerror, 紧接着调用带关闭码的 onclose: 推迟处理, 让 onclose 记录关闭码
            const reason = `error ${redactProxyParams(errorMessage(event.error))}`;
            setTimeout(() => connection.finish(reason), 0);
        };
        try {
            await socket.open();
        }
        catch (error) {
            connection.finish("open failed");
            if (this.connection === connection) {
                this.connection = undefined;
            }
            return { healthy: false, reason: `connect to ${host} failed: ${redactProxyParams(errorMessage(error))}` };
        }

        if (generation === this.generation) {
            connection.lastInbound = Date.now();
            void this.siyuan.logger.info(`[feishu] connected to ${host}`);
            this.setState("connected", { username: bot.info.app_name });
            this.ping(connection);
            connection.watchdogTimer = setInterval(() => {
                const silence = Date.now() - connection.lastInbound;
                if (silence > 2 * connection.pingInterval + PONG_GRACE_PERIOD) {
                    connection.finish(`no frame received in ${silence} ms`);
                }
            }, WATCHDOG_INTERVAL);
        }
        else {
            connection.finish("stopped");
        }

        const reason = await ended;
        if (this.connection === connection) {
            this.connection = undefined;
        }
        await socket.close(1000, "reconnect").catch(() => { });
        return { healthy: connection.healthy, reason };
    }

    /* 立即发送心跳, 之后按服务端下发的间隔发送 */
    private ping(connection: IConnection): void {
        if (connection.ended) {
            return;
        }
        void this.send(connection, {
            SeqID: "0",
            LogID: "0",
            service: connection.serviceId,
            method: FrameMethod.CONTROL,
            headers: [{ key: FrameHeader.TYPE, value: FrameType.PING }],
        });
        connection.pingTimer = setTimeout(() => this.ping(connection), connection.pingInterval);
    }

    private async send(connection: IConnection, frame: IFrame): Promise<void> {
        if (connection.ended) {
            return;
        }
        const bytes = encodeFrame(frame);
        try {
            // siyuan.client.socket 只把 ArrayBuffer 作为二进制帧发送, Uint8Array 会被转为文本帧
            await connection.socket.send(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
        }
        catch (error) {
            // 发送失败说明连接已断开, 由 onclose、onerror 或读超时处理重连
            void this.siyuan.logger.debug(`[feishu] send a frame failed: ${errorMessage(error)}`);
        }
    }

    /* 处理服务端下发的帧 */
    private onMessage(connection: IConnection, bot: IFeishuBot, event: kernel.IWebSocketMessageEvent): void {
        if (connection.ended) {
            return;
        }
        connection.lastInbound = Date.now();
        connection.healthy = true;
        if (typeof event.data === "string") {
            // 服务端会把文本帧原样发回, 协议中只有二进制帧
            void this.siyuan.logger.debug(`[feishu] ignore a text frame: ${event.data.slice(0, 200)}`);
            return;
        }

        let frame: IFrame;
        try {
            frame = decodeFrame(new Uint8Array(event.data));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] decode a frame of ${event.data.byteLength} bytes failed: ${errorMessage(error)}`);
            return;
        }

        const type = frameHeader(frame, FrameHeader.TYPE);
        if (frame.method === FrameMethod.CONTROL) {
            if (type === FrameType.PONG) {
                this.onPong(connection, frame);
            }
            return;
        }
        if (frame.method !== FrameMethod.DATA) {
            return;
        }
        if (type !== FrameType.EVENT) {
            // 卡片回调等: 插件不处理, 与官方 SDK 一样不回包
            void this.siyuan.logger.debug(`[feishu] ignore a data frame of type ${type}`);
            return;
        }

        const payload = this.merge(connection, frame);
        if (!payload) {
            return;
        }
        const started = Date.now();
        let data: IEvent;
        try {
            data = JSON.parse(utf8Decode(payload)) as IEvent;
        }
        catch (error) {
            // 不回包: 服务端稍后会重推
            void this.siyuan.logger.warn(`[feishu] the event ${frameHeader(frame, FrameHeader.TRACE_ID)} is not JSON: ${errorMessage(error)}`);
            return;
        }
        // 先回包再处理: 服务端最多等待 3 秒, 写入收集箱等处理都在后台进行
        void this.send(connection, {
            ...frame,
            headers: [...frame.headers, { key: FrameHeader.BIZ_RT, value: String(Date.now() - started) }],
            payload: utf8Encode(JSON.stringify({ code: 200 })),
        });
        this.dispatch(bot, data);
    }

    /* pong 中有服务端下发的新参数 */
    private onPong(connection: IConnection, frame: IFrame): void {
        if (!frame.payload?.length) {
            return;
        }
        try {
            const config = JSON.parse(utf8Decode(frame.payload)) as IClientConfig;
            const interval = milliseconds(config.PingInterval);
            if (interval && interval !== connection.pingInterval) {
                // 读超时按新的间隔计算, 已经安排的下一次心跳也要按新的间隔重新安排
                connection.pingInterval = interval;
                clearTimeout(connection.pingTimer);
                connection.pingTimer = setTimeout(() => this.ping(connection), interval);
            }
        }
        catch {
            void this.siyuan.logger.debug("[feishu] the pong has no valid client config");
        }
    }

    /**
     * 合并分片: 分片以帧头的 message_id 归组, 收齐 sum 片后按 seq 拼接; 超过 10 秒没有收齐的分片被丢弃
     * @returns 完整的事件数据; 还没有收齐或分片信息无效时为 undefined
     */
    private merge(connection: IConnection, frame: IFrame): Uint8Array | undefined {
        const payload = frame.payload ?? new Uint8Array(0);
        const sum = Number(frameHeader(frame, FrameHeader.SUM) ?? 1);
        const seq = Number(frameHeader(frame, FrameHeader.SEQ) ?? 0);
        if (sum === 1 && seq === 0) {
            return payload;
        }
        const id = frameHeader(frame, FrameHeader.MESSAGE_ID);
        if (!id || !Number.isInteger(sum) || !Number.isInteger(seq) || sum < 1 || seq < 0 || seq >= sum) {
            void this.siyuan.logger.warn(`[feishu] drop a fragment with invalid metadata: message_id ${id}, sum ${sum}, seq ${seq}`);
            return undefined;
        }

        const now = Date.now();
        for (const [key, item] of connection.fragments) {
            if (now - item.createdAt > FRAGMENT_TTL) {
                connection.fragments.delete(key);
                void this.siyuan.logger.warn(`[feishu] drop the incomplete fragments of ${key}`);
            }
        }
        let item = connection.fragments.get(id);
        if (item && item.parts.length !== sum) {
            connection.fragments.delete(id);
            void this.siyuan.logger.warn(`[feishu] drop the fragments of ${id}: sum ${sum} differs from ${item.parts.length}`);
            return undefined;
        }
        if (!item) {
            item = { parts: Array.from<Uint8Array | undefined>({ length: sum }).fill(undefined), createdAt: now };
            connection.fragments.set(id, item);
        }
        item.parts[seq] = payload;

        let length = 0;
        for (const part of item.parts) {
            if (!part) {
                return undefined;
            }
            length += part.length;
        }
        connection.fragments.delete(id);
        const merged = new Uint8Array(length);
        let offset = 0;
        for (const part of item.parts) {
            merged.set(part!, offset);
            offset += part!.length;
        }
        void this.siyuan.logger.debug(`[feishu] merged ${sum} fragments of ${id} into ${length} bytes`);
        return merged;
    }

    /* 把事件交给 onEvent; 服务端重推的事件 (event_id 相同) 只处理一次 */
    private dispatch(bot: IFeishuBot, event: IEvent): void {
        const id = event.header?.event_id ?? event.uuid;
        if (id) {
            if (this.recent.has(id)) {
                void this.siyuan.logger.debug(`[feishu] the event ${id} is delivered again, skip it`);
                return;
            }
            this.recent.add(id);
            if (this.recent.size > RECENT_EVENTS) {
                this.recent.delete(this.recent.values().next().value!);
            }
        }
        try {
            this.onEvent(bot, event);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] handle the event ${id} failed:`, errorMessage(error));
        }
    }

    private setState(status: TFeishuConnectionStatus, details: Pick<IFeishuConnectionState, "error" | "retryAt" | "username"> = {}): void {
        this.current = { status, since: new Date().toISOString(), ...details };
    }
}
