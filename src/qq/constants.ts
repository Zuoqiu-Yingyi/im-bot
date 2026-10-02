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

export const ACCESS_TOKEN_URL = "https://api.bot.qq.com/app/getAppAccessToken"; // 获取接口调用凭证
export const API_BASE_URL = "https://api.bot.qq.com"; // OpenAPI 根地址

export const DEFAULT_HEARTBEAT_INTERVAL = 45_000; // HELLO 未给出心跳间隔时使用 (ms)
export const RECONNECT_BASE_DELAY = 1_000; // 重连退避的初始间隔 (ms)
export const RECONNECT_MAX_DELAY = 60_000; // 重连退避的最大间隔 (ms)

/**
 * 凭证距过期不足该时长时重新获取 (ms)。
 * 凭证有效期内重复获取会得到同一个凭证, 距过期 60 秒内获取才会得到新凭证, 旧凭证在这 60 秒内仍然有效。
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/access-token.html
 */
export const ACCESS_TOKEN_REFRESH_WINDOW = 60_000;
export const ACCESS_TOKEN_TOO_MANY_REQUESTS = 100001; // 获取凭证过于频繁, 该接口的业务错误都以 HTTP 200 返回

/* RPC call-qq-api 允许的请求方法 */
export const API_METHODS = new Set<string>([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
]);

/**
 * 网关 opcode
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html
 */
export enum OpCode {
    DISPATCH = 0, // 服务端推送事件
    HEARTBEAT = 1, // 心跳
    IDENTIFY = 2, // 鉴权
    RESUME = 6, // 恢复连接
    RECONNECT = 7, // 服务端通知客户端重连
    INVALID_SESSION = 9, // identify 或 resume 的参数有误
    HELLO = 10, // 连接建立后网关下发的第一条消息
    HEARTBEAT_ACK = 11, // 心跳回包
}

/**
 * 群消息的 message_type, 图片、语音、视频与文件等附件都在 attachments 中
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html
 */
export enum MessageType {
    NORMAL = 0, // 普通消息
    ARK = 3, // 卡片
    CHAT_RECORD = 102, // 聊天记录 (合并转发), 只有 content 中的文本
    REFERENCE = 103, // 引用消息
}

/* 机器人响应的指令, 用户以 `/指令名` 发送; 指令面板中 type=command 的元素名称应与之一致 */
export const COMMANDS = {
    OPENID: "openid", // 查询当前用户 (与群组) 的 OpenID
} as const;

/* 群消息事件: GROUP_AT_MESSAGE_CREATE 为 @ 机器人的消息, GROUP_MESSAGE_CREATE 为群主允许机器人接收的全部消息 */
export const GROUP_MESSAGE_EVENTS = new Set<string>([
    "GROUP_AT_MESSAGE_CREATE",
    "GROUP_MESSAGE_CREATE",
]);

/**
 * 事件订阅 intents, 键的顺序即设置面板中开关的顺序
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html
 */
export const INTENTS = {
    GUILDS: 1 << 0,
    GUILD_MEMBERS: 1 << 1,
    GUILD_MESSAGES: 1 << 9, // 仅私域机器人
    GUILD_MESSAGE_REACTIONS: 1 << 10,
    DIRECT_MESSAGE: 1 << 12,
    GROUP_AND_C2C_EVENT: 1 << 25,
    INTERACTION: 1 << 26,
    MESSAGE_AUDIT: 1 << 27,
    FORUMS_EVENT: 1 << 28, // 仅私域机器人
    AUDIO_ACTION: 1 << 29,
    PUBLIC_GUILD_MESSAGES: 1 << 30,
} as const;

export type TIntent = keyof typeof INTENTS;

/**
 * 既不能 resume 也不能重新 identify 的关闭码, 收到后停止重连
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/error-trace/websocket.html
 */
export const FATAL_CLOSE_CODES = new Map<number, string>([
    [4001, "invalid opcode"],
    [4002, "invalid payload"],
    [4010, "invalid shard"],
    [4011, "too many guilds, sharding required"],
    [4012, "invalid version"],
    [4013, "invalid intent"],
    [4014, "intent not permitted"],
    [4914, "bot is offline, only the sandbox environment is allowed"],
    [4915, "bot is banned"],
]);

/* 不能 resume, 需要丢弃会话重新 identify 的关闭码 (4900~4913 为网关内部错误) */
export const IDENTIFY_CLOSE_CODES = new Set<number>([
    4006,
    4007,
    ...Array.from({ length: 14 }, (_, i) => 4900 + i),
]);
