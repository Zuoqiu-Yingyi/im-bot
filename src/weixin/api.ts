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

import { proxyFetch } from "@/utils/proxy";

import {
    API_BASE_URL,
    APP_ID,
    BOT_AGENT_NAME,
    BOT_TYPE,
    MessageItemType,
    MessageState,
    MessageType,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type {
    IBaseInfo,
    IGetUpdatesResponse,
    IQRCodeResponse,
    IQRCodeStatusResponse,
    IResult,
    ISendMessageResponse,
    IWeixinAccount,
} from "@/types/weixin";
import type { IProxyResponse } from "@/utils/proxy";

/* 调用鉴权接口所需的登录信息 */
export type TCredentials = Pick<IWeixinAccount, "baseUrl" | "token">;

/* 值为 uint64 的字段, 以 JSON 中带引号的键表示 */
const LOSSLESS_KEYS = new Set([
    "\"message_id\"",
    "\"msg_id\"",
    "\"svr_id\"",
]);
const WHITESPACE = /\s/;
const DIGIT = /\d/;

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * 解析 JSON, 并把 message_id、msg_id 与 svr_id 的整数值转为字符串: 这些 ID 是 uint64, 超过 2^53 时 JSON.parse 会丢失精度。
 * 只改写对象属性的值, 不会改动 JSON 字符串中的内容, 与官方客户端的 parseWeixinApiJson 相同
 * @throws 不是有效的 JSON
 */
export function parseLosslessJson<T>(text: string): T {
    const chunks: string[] = [];
    let copied = 0; // text 中已复制到 chunks 的长度
    let index = 0;
    while (index < text.length) {
        if (text[index] !== "\"") {
            index++;
            continue;
        }

        // 跳过整个字符串, 字符串中的转义字符不会结束字符串
        const start = index++;
        while (index < text.length) {
            const char = text[index++];
            if (char === "\\") {
                index++;
            }
            else if (char === "\"") {
                break;
            }
        }
        if (!LOSSLESS_KEYS.has(text.slice(start, index))) {
            continue;
        }

        // 键后面的冒号与整数
        let cursor = index;
        while (WHITESPACE.test(text[cursor] ?? "")) {
            cursor++;
        }
        if (text[cursor] !== ":") {
            continue;
        }
        cursor++;
        while (WHITESPACE.test(text[cursor] ?? "")) {
            cursor++;
        }
        const numberStart = cursor;
        if (text[cursor] === "-") {
            cursor++;
        }
        const digitsStart = cursor;
        while (DIGIT.test(text[cursor] ?? "")) {
            cursor++;
        }
        if (cursor > digitsStart) {
            chunks.push(text.slice(copied, numberStart), "\"", text.slice(numberStart, cursor), "\"");
            copied = cursor;
            index = cursor;
        }
    }
    chunks.push(text.slice(copied));
    return JSON.parse(chunks.join("")) as T;
}

/* iLink-App-ClientVersion: 版本号 x.y.z 按 0x00XXYYZZ 编码后的十进制字符串 */
export function encodeClientVersion(version: string): string {
    const [major = 0, minor = 0, patch = 0] = version.split(".").map((part) => Number.parseInt(part, 10) || 0);
    return String(((major & 0xFF) << 16) | ((minor & 0xFF) << 8) | (patch & 0xFF));
}

/* 业务返回码: ret 与 errcode 中第一个不为 0 的值; 都为 0 或缺失时为 0 */
export function resultCode(result: IResult): number {
    return result.ret || result.errcode || 0;
}

/* 接口地址与路径拼接为 URL */
function endpointUrl(baseUrl: string, endpoint: string): string {
    return `${baseUrl.replace(/\/+$/, "")}/${endpoint}`;
}

/* 0 到 2^32 - 1 的随机整数; goja 没有 crypto 模块, 这些值只用于请求标识, 不需要密码学安全 */
function randomUint32(): number {
    return Math.floor(Math.random() * 0x1_0000_0000);
}

/* X-WECHAT-UIN: 随机 uint32 的十进制字符串再做 base64, 每个请求都重新生成 */
function randomUin(): string {
    // eslint-disable-next-line node/prefer-global/buffer
    return Buffer.from(String(randomUint32()), "utf8").toString("base64");
}

/**
 * 微信 iLink Bot API 的客户端, 请求经内核 /api/network/proxy 转发。
 * 请求头与 base_info 与官方客户端相同, 但版本号与 bot_agent 使用本插件的。
 * Client of the WeChat iLink Bot API; requests go through the kernel's
 * /api/network/proxy.
 */
export class WeixinApi {
    private readonly siyuan: kernel.ISiyuan;

    constructor(siyuan: kernel.ISiyuan) {
        this.siyuan = siyuan;
    }

    /* 获取登录二维码, 不需要鉴权; local_token_list 为空, 每次扫码都得到新的 bot_token */
    public async getQRCode(): Promise<IQRCodeResponse> {
        return this.post("get_bot_qrcode", API_BASE_URL, `ilink/bot/get_bot_qrcode?bot_type=${BOT_TYPE}`, { local_token_list: [] });
    }

    /**
     * 查询扫码状态, 服务端最多保持约 35 秒 (长轮询)
     * @param baseUrl - 接口地址, 收到 scaned_but_redirect 后改用 redirect_host
     * @param qrcode - 二维码 ID; 扫码确认后用它可以取得 bot_token, 所以不写入错误信息
     * @param verifyCode - 用户输入的手机上显示的数字
     */
    public async getQRCodeStatus(baseUrl: string, qrcode: string, verifyCode?: string): Promise<IQRCodeStatusResponse> {
        let endpoint = `ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(qrcode)}`;
        if (verifyCode) {
            endpoint += `&verify_code=${encodeURIComponent(verifyCode)}`;
        }
        try {
            const response = await proxyFetch(this.siyuan, {
                url: endpointUrl(baseUrl, endpoint),
                method: "GET",
                headers: this.commonHeaders(),
            });
            return this.parse("get_qrcode_status", response);
        }
        catch (error) {
            const message = errorMessage(error)
                .replaceAll(encodeURIComponent(qrcode), "***")
                .replaceAll(qrcode, "***");
            throw new Error(message);
        }
    }

    /**
     * 长轮询获取新消息, 服务端最多保持约 35 秒
     * @param credentials - 登录信息
     * @param cursor - 上次响应中的 get_updates_buf, 首次请求为空字符串
     */
    public async getUpdates(credentials: TCredentials, cursor: string): Promise<IGetUpdatesResponse> {
        return this.post("getupdates", credentials.baseUrl, "ilink/bot/getupdates", {
            get_updates_buf: cursor,
            base_info: this.baseInfo(),
        }, credentials.token);
    }

    /**
     * 发送一条文本消息
     * @param credentials - 登录信息
     * @param to - 接收消息的用户 ID
     * @param text - 消息内容
     * @param contextToken - 所回复消息的 context_token
     * @returns 服务端分配的消息 ID; 返回码为 0 却没有消息 ID 时为 undefined, 表示消息没有送达
     * @throws 请求失败或返回码不为 0
     */
    public async sendText(credentials: TCredentials, to: string, text: string, contextToken?: string): Promise<string | undefined> {
        const response = await this.post<ISendMessageResponse>("sendmessage", credentials.baseUrl, "ilink/bot/sendmessage", {
            msg: {
                from_user_id: "",
                to_user_id: to,
                client_id: `${BOT_AGENT_NAME}:${Date.now()}-${randomUint32().toString(16).padStart(8, "0")}`,
                message_type: MessageType.BOT,
                message_state: MessageState.FINISH,
                item_list: [{ type: MessageItemType.TEXT, text_item: { text } }],
                context_token: contextToken,
            },
            base_info: this.baseInfo(),
        }, credentials.token);
        const code = resultCode(response);
        if (code !== 0) {
            throw new Error(`sendmessage failed: ${code} ${response.errmsg ?? ""}`);
        }
        return response.message_id;
    }

    /* 通知服务端客户端开始或停止接收消息, 与官方客户端一样在开始轮询前与停止轮询后调用 */
    public async notify(credentials: TCredentials, event: "start" | "stop"): Promise<IResult> {
        return this.post(`notify${event}`, credentials.baseUrl, `ilink/bot/msg/notify${event}`, {
            base_info: this.baseInfo(),
        }, credentials.token);
    }

    private version(): string {
        return this.siyuan.plugin.version || "0.0.0";
    }

    private baseInfo(): IBaseInfo {
        const version = this.version();
        return {
            channel_version: version,
            bot_agent: `${BOT_AGENT_NAME}/${version}`,
        };
    }

    /* 所有请求都带的请求头 */
    private commonHeaders(): Record<string, string[]> {
        return {
            "iLink-App-Id": [APP_ID],
            "iLink-App-ClientVersion": [encodeClientVersion(this.version())],
        };
    }

    /**
     * POST JSON 请求体
     * @param label - 写入错误信息的接口名
     * @param baseUrl - 接口地址
     * @param endpoint - 接口路径, 可以带查询参数
     * @param body - 请求体, 以 JSON 发送
     * @param token - bot_token, 获取二维码时没有
     * @throws 内核拒绝转发、请求超时、HTTP 状态码不是 2xx 或响应体不是 JSON
     */
    private async post<T>(label: string, baseUrl: string, endpoint: string, body: unknown, token?: string): Promise<T> {
        const headers: Record<string, string[]> = {
            "AuthorizationType": ["ilink_bot_token"],
            "X-WECHAT-UIN": [randomUin()],
            ...this.commonHeaders(),
        };
        if (token) {
            headers.Authorization = [`Bearer ${token}`];
        }
        const response = await proxyFetch(this.siyuan, {
            url: endpointUrl(baseUrl, endpoint),
            method: "POST",
            headers,
            json: body,
        });
        return this.parse<T>(label, response);
    }

    private parse<T>(label: string, response: IProxyResponse): T {
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`${label} failed: HTTP ${response.status} ${response.body.slice(0, 200)}`);
        }
        try {
            return parseLosslessJson<T>(response.body);
        }
        catch {
            throw new Error(`${label} returned invalid JSON: ${response.body.slice(0, 200)}`);
        }
    }
}
