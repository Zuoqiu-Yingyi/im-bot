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

/**
 * 飞书开放平台与长连接的常量。
 * 长连接的协议没有公开文档, 取自官方 SDK 的实现 (larksuite/node-sdk 的 ws-client 与 oapi-sdk-go 的 ws), 并经实测验证
 */

export const DEFAULT_API_BASE_URL = "https://open.feishu.cn"; // 飞书开放平台; Lark 为 https://open.larksuite.com
export const ENDPOINT_PATH = "/callback/ws/endpoint"; // 换取长连接地址的接口

/* 帧的 method */
export const FrameMethod = {
    CONTROL: 0, // 控制帧: ping 与 pong
    DATA: 1, // 数据帧: 事件与卡片回调
} as const;

/* 帧头 type 的取值 */
export const FrameType = {
    EVENT: "event",
    CARD: "card",
    PING: "ping",
    PONG: "pong",
} as const;

/* 帧头的键 */
export const FrameHeader = {
    TYPE: "type",
    MESSAGE_ID: "message_id", // 一次推送的 ID, 分片共用; 每次重推都不同, 不能用来去重
    SUM: "sum", // 分片数, 未分片时为 1
    SEQ: "seq", // 分片序号, 从 0 开始
    TRACE_ID: "trace_id", // 等于事件的 event_id
    BIZ_RT: "biz_rt", // 回包中的处理耗时 (ms)
} as const;

/**
 * 换取长连接地址时不能自动恢复的错误码: App Secret 为空、App ID 或 App Secret 无效。
 * 不存在的 App ID 返回的是 1000040343 (internal error), 与服务端的临时错误相同, 只能重试
 */
export const ENDPOINT_FATAL_CODES = new Map([
    [1000040344, "the App ID or App Secret is empty"],
    [1000040345, "the App ID or App Secret is invalid"],
]);

/* 获取 tenant_access_token 时不能自动恢复的错误码: 10003 参数无效, 10014 App ID 不存在或 App Secret 无效 */
export const TOKEN_FATAL_CODES = new Set([10003, 10014]);

/* 调用服务端 API 时, 表示 tenant_access_token 无效或过期的错误码, 遇到时重新获取后重试一次 */
export const INVALID_TOKEN_CODES = new Set([99991661, 99991663, 99991664, 99991668]);

export const TOKEN_REFRESH_MARGIN = 5 * 60_000; // tenant_access_token 在过期前多久重新获取 (ms)

export const DEFAULT_PING_INTERVAL = 120_000; // 服务端没有下发 PingInterval 时的心跳间隔 (ms), 与 SDK 的默认值相同
export const PONG_GRACE_PERIOD = 5_000; // 2 个心跳间隔加上这段时间 (ms) 内没有收到任何帧时, 认为连接已断开
export const WATCHDOG_INTERVAL = 5_000; // 检查连接是否已断开的间隔 (ms)
export const DIAL_TIMEOUT = "10s"; // /ws/network/proxy 的 t 参数; 内核的 WebSocket 客户端还有 5 秒的握手超时

export const RECONNECT_BASE_DELAY = 1_000; // 重新连接的初始等待时间 (ms), 之后按指数增加
export const RECONNECT_MAX_DELAY = 60_000; // 重新连接的最长等待时间 (ms)

export const FRAGMENT_TTL = 10_000; // 分片的保留时间 (ms), 与 SDK 相同
export const RECENT_EVENTS = 1024; // 在内存中记住的最近事件数, 用于丢弃重推的事件

export const REORDER_DELAY = 1_000; // 收集箱等待后续消息的时间 (ms): 同一秒内连发的消息到达的顺序可能与发送顺序不同
export const REORDER_MAX_DELAY = 3_000; // 收集箱最长等待时间 (ms), 从第一条消息到达开始计算

export const MEDIA_MAX_BYTES = 100 * 1024 * 1024; // 保存的媒体文件的最大字节数; 飞书不提供超过 100 MB 的资源文件

export const MEMBER_PAGES = 10; // 获取群成员名称时最多请求的页数, 每页 100 人
export const MEMBER_REFRESH_INTERVAL = 60_000; // 查不到成员名称时, 两次重新获取群成员列表的最短间隔 (ms)

/* 插件响应的指令 */
export const COMMANDS = {
    CHATID: "chatid", // 查询会话 ID
} as const;
