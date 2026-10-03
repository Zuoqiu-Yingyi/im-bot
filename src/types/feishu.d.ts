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
 * 飞书开放平台的数据结构, 只列出插件用到的字段。
 * REF: https://open.feishu.cn/document/server-docs/im-v1/message/events/receive
 */

/* 服务端 API 的响应; 机器人信息等少数接口把结果放在 data 以外的字段中 */
export interface IResponse<T> {
    code: number; // 0 表示成功
    msg?: string;
    data?: T;
}

/* 获取 tenant_access_token 的响应 */
export interface ITenantTokenResponse {
    code: number;
    msg?: string;
    tenant_access_token?: string;
    expire?: number; // 剩余有效期 (秒)
}

/* 长连接的参数, 由换取连接地址的接口与 pong 下发, 时间单位都是秒 */
export interface IClientConfig {
    PingInterval?: number;
    ReconnectCount?: number;
    ReconnectInterval?: number;
    ReconnectNonce?: number;
}

/* 换取长连接地址 (/callback/ws/endpoint) 的响应 */
export interface IEndpointResponse {
    code: number;
    msg?: string;
    data?: {
        URL?: string; // wss 地址, 带一次性的票据
        ClientConfig?: IClientConfig;
    };
}

/* 机器人信息 (/open-apis/bot/v3/info 的 bot 字段) */
export interface IBotInfo {
    app_name: string;
    open_id: string; // 机器人的 open_id, 用于判断消息是否 @ 了机器人
    activate_status?: number;
}

/* 事件的公共头 (schema 2.0) */
export interface IEventHeader {
    event_id: string;
    event_type: string; // 如 im.message.receive_v1
    create_time: string; // 毫秒时间戳
    app_id: string;
    tenant_key?: string;
}

/* 长连接推送的事件: schema 2.0 的事件有 header 与 event; 1.0 的事件 (如用户和机器人的会话首次被创建) 只有 event.type */
export interface IEvent<T = unknown> {
    schema?: string;
    header?: IEventHeader;
    uuid?: string; // 1.0 事件的 ID
    event?: T & { type?: string };
}

export interface IUserId {
    open_id?: string;
    union_id?: string;
    user_id?: null | string;
}

/* 事件中的 @: key 为文本中的占位符, 如 @_user_1 */
export interface IEventMention {
    key: string;
    id: IUserId;
    name: string;
    mentioned_type?: string; // bot 或 user
    tenant_key?: string;
}

/* 接收消息事件中的消息 */
export interface IEventMessage {
    message_id: string;
    root_id?: string;
    parent_id?: string; // 回复的消息
    thread_id?: string; // 话题
    create_time: string; // 毫秒时间戳
    update_time?: string;
    chat_id: string;
    chat_type: string; // p2p 或 group
    message_type: string;
    content: string; // JSON 字符串, 结构见消息内容的文档
    mentions?: IEventMention[];
}

/* 接收消息事件 im.message.receive_v1 */
export interface IMessageReceiveEvent {
    sender: {
        sender_id: IUserId;
        sender_type: string; // user 或 bot
        tenant_key?: string;
    };
    message: IEventMessage;
}

/* 机器人进群、被移出群的事件 */
export interface IChatMemberBotEvent {
    chat_id: string;
    name?: string;
    operator_id?: IUserId;
}

/* 服务端 API 返回的消息 (获取指定消息的内容、合并转发的子消息) */
export interface IApiMessage {
    message_id: string;
    root_id?: string;
    parent_id?: string;
    thread_id?: string;
    upper_message_id?: string; // 合并转发的子消息: 所属的合并转发消息
    msg_type: string;
    create_time: string;
    chat_id: string;
    deleted?: boolean;
    sender: {
        id: string;
        id_type: string; // open_id; 机器人为 app_id
        sender_type: string; // user、app 等
    };
    body?: {
        content: string;
    };
    mentions?: {
        key: string;
        id: string;
        id_type: string;
        name: string;
    }[];
}

/* 群信息中插件用到的字段 */
export interface IChatInfo {
    name?: string;
    chat_mode?: string; // group、topic、p2p
    owner_id?: string;
    owner_id_type?: string;
    user_manager_id_list?: string[];
}

/* 群成员列表的一页 */
export interface IChatMembers {
    items?: {
        member_id: string;
        member_id_type: string;
        name: string;
    }[];
    has_more?: boolean;
    page_token?: string;
}

/* 富文本 (post) 与卡片中的元素 */
export interface IPostElement {
    tag: string; // text、a、at、img、media、emotion、hr、code_block、md 等
    text?: string;
    href?: string;
    style?: string[]; // bold、italic、underline、lineThrough
    user_id?: string; // at: 占位符, 如 @_user_1; @ 所有人为 @_all
    user_name?: string;
    image_key?: string;
    file_key?: string;
    emoji_type?: string;
    language?: string;
    elements?: IPostElement[]; // 卡片中的备注等容器
}

/**
 * 本设备上飞书机器人的连接状态
 */
export type TFeishuConnectionStatus
    = | "connected" // 已连接长连接
        | "connecting" // 正在获取机器人信息、换取连接地址或建立连接
        | "failed" // 遇到不能自动恢复的错误 (App ID 或 App Secret 无效等), 已停止连接
        | "offline" // 上线开关已关闭
        | "other-device" // 只在其他设备上运行
        | "reconnecting" // 连接断开或失败, 等待重新连接
        | "stopped" // 没有运行
        | "unconfigured"; // 没有填写 App ID 或 App Secret

/* RPC feishu-get-state 的返回值 */
export interface IFeishuConnectionState {
    status: TFeishuConnectionStatus;
    since?: string; // 进入该状态的时间 (ISO 8601)
    username?: string; // connected: 机器人的名称
    error?: string; // reconnecting 与 failed: 失败的原因
    retryAt?: string; // reconnecting: 下次连接的时间 (ISO 8601)
    device?: string; // other-device: 运行飞书机器人的设备 ID
}
