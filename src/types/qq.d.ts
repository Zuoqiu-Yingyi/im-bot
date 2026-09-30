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

import type { OpCode } from "@/qq/constants";

/* 网关收发的数据包 */
export interface IPayload<T = any> {
    op: OpCode;
    d?: T;
    s?: number; // 事件序号, 心跳与 resume 时回传最新值
    t?: string; // 事件类型, 仅 op=0 (DISPATCH) 时存在
    id?: string; // 事件 ID
}

/* op=10 (HELLO) */
export interface IHelloData {
    heartbeat_interval: number; // 心跳间隔 (ms)
}

/* op=0 (DISPATCH), t=READY */
export interface IReadyData {
    version: number;
    session_id: string;
    user: {
        id: string;
        username: string;
        bot: boolean;
    };
    shard: [number, number];
}

/* 消息作者 */
export interface IMessageAuthor {
    id: string;
    member_openid?: string;
    union_openid?: string;
    username?: string;
    bot?: boolean;
    member_role?: string;
}

/* 富媒体附件 */
export interface IAttachment {
    content_type: string; // image/png、image/jpeg、image/gif、video/mp4、voice、file
    url: string;
    filename?: string;
    size?: number;
    width?: number;
    height?: number;
    voice_wav_url?: string; // 语音转换后的 WAV 文件
    asr_refer_text?: string; // 语音识别结果
}

/* content 中 @ 的对象 */
export interface IMention {
    id?: string;
    member_openid?: string;
    username?: string;
    scope?: string; // single: @ 成员, all: @ 全体成员
    is_you?: boolean;
    bot?: boolean;
}

/* 嵌套的消息元素, 如引用消息中被引用的消息 */
export interface IMessageElement {
    msg_idx?: string;
    message_type?: number;
    content?: string;
    attachments?: IAttachment[];
}

/* op=0, t=GROUP_AT_MESSAGE_CREATE 或 GROUP_MESSAGE_CREATE */
export interface IGroupMessage {
    id: string; // 消息 ID
    content: string;
    timestamp: string;
    group_openid: string;
    message_type?: number;
    author: IMessageAuthor;
    attachments?: IAttachment[];
    mentions?: IMention[];
    message_scene?: {
        source?: string;
        ext?: string[]; // 形如 msg_idx=..., ref_msg_idx=..., auth_token=...
    };
    msg_elements?: IMessageElement[];
}

/* POST https://bots.qq.com/app/getAppAccessToken */
export interface IAccessToken {
    access_token?: string;
    expires_in?: number | string; // 有效时间 (s), 文档的字段表写的是 number, 示例是 string
    code?: number; // 业务错误码, 失败时 HTTP 状态码仍为 200
    message?: string;
}

/**
 * RPC call-qq-api 的返回值: OpenAPI 的响应
 * @typeParam T - JSON 响应体的类型
 */
export interface IApiResponse<T = unknown> {
    status: number; // HTTP 状态码
    headers: Record<string, string>; // 响应头
    body: T; // JSON 响应体; 没有响应体时为 null, 不是 JSON 时为原始文本
}

/* GET /gateway/bot */
export interface IGatewayBot {
    url: string; // WebSocket 接入点
    shards: number; // 建议的分片数
    session_start_limit: {
        total: number; // 每 24 小时可创建会话数
        remaining: number; // 剩余可创建会话数
        reset_after: number; // 重置计数的剩余时间 (ms)
        max_concurrency: number; // 每 5 秒可创建会话数
    };
}
