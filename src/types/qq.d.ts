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
    user_openid?: string; // 单聊中的用户 OpenID
    member_openid?: string; // 群聊中的成员 OpenID
    union_openid?: string;
    username?: string;
    bot?: boolean;
    member_role?: string; // 群内角色: member 为普通成员, admin 为管理员, owner 为群主
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
    is_you?: boolean; // 是否 @ 了本机器人, @ 全体成员的一项也为 true
    bot?: boolean;
}

/* 嵌套的消息元素, 如引用消息中被引用的消息 */
export interface IMessageElement {
    msg_idx?: string;
    message_type?: number;
    content?: string;
    attachments?: IAttachment[];
}

/* op=0, t=C2C_MESSAGE_CREATE 的单聊消息, 也是群聊消息共有的字段 */
export interface IMessage {
    id: string; // 消息 ID, 被动回复时作为 msg_id
    content: string;
    timestamp: string;
    message_type?: number;
    author: IMessageAuthor;
    attachments?: IAttachment[];
    message_scene?: {
        source?: string;
        ext?: string[]; // 形如 msg_idx=..., ref_msg_idx=..., auth_token=...
    };
    msg_elements?: IMessageElement[];
}

/* op=0, t=GROUP_AT_MESSAGE_CREATE 或 GROUP_MESSAGE_CREATE */
export interface IGroupMessage extends IMessage {
    group_openid: string;
    mentions?: IMention[];
}

/**
 * op=0, t=GROUP_ADD_ROBOT、GROUP_DEL_ROBOT、GROUP_MSG_RECEIVE 或 GROUP_MSG_REJECT:
 * 机器人被添加到群或移出群, 群管理员开启或关闭机器人的主动消息
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_add_robot.html
 */
export interface IGroupOperationEvent {
    group_openid: string;
    op_member_openid?: string; // 操作人的群成员 OpenID
    timestamp: number; // Unix 秒
}

/**
 * op=0, t=FRIEND_ADD、FRIEND_DEL、C2C_MSG_RECEIVE 或 C2C_MSG_REJECT:
 * 用户添加或删除机器人, 在机器人资料卡开启或关闭主动消息
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html
 */
export interface IFriendEvent {
    openid: string; // 用户 OpenID, 即单聊中的 user_openid
    timestamp: number; // Unix 秒
    scene?: number; // 仅 FRIEND_ADD: 添加机器人的场景, 如 1001 为网络搜索, 2003 为开发者生成的分享链接
    scene_param?: string; // 仅 FRIEND_ADD: 开发者在分享链接中设置的回调数据 (callback_data)
    author?: {
        union_openid?: string; // 仅 FRIEND_ADD
    };
}

/**
 * `GET /v2/groups/{group_openid}/info`, 仅白名单机器人可用, 否则返回 11253
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_info.get.html
 */
export interface IGroupInfo {
    group_openid?: string;
    group_name?: string; // 群名称
    group_finger_memo?: string; // 群简介
    group_class_text?: string; // 群分类
    group_tags?: string[]; // 群标签
    group_member_num?: number; // 群成员人数
}

/* OpenAPI 调用失败时的响应体, 应按错误码而不是 message 判断错误 */
export interface IApiError {
    err_code?: number;
    code?: number; // 部分接口的错误码在 code 中
    message?: string;
    trace_id?: string;
}

/* POST https://api.bot.qq.com/app/getAppAccessToken */
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

/**
 * 指令面板的元素, 字段均可省略
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels.post.html
 */
export interface IPanelItem {
    type?: "command" | "link"; // 指令或链接跳转
    name?: string; // 元素名称, 最多 14 个字符; type=command 时用户点击后该内容会填入聊天输入框
    desc?: string; // 元素描述, 最多 30 个字符
    only_admin?: boolean; // 是否仅管理员可操作
    link?: string; // 跳转链接, 仅 type=link 时有效
}

/* 指令面板的内容 */
export interface IPanel {
    items?: IPanelItem[]; // 最多 20 个元素
    remark?: string; // 备注, 不对用户展示, 最多 255 个字符
    version?: number; // 版本号
}

/* POST /v2/panels 的请求体, 也是插件配置中的指令面板 */
export interface IPanelConfig {
    scope: "c2c" | "channel" | "dm" | "group"; // 生效场景
    target_type?: "all" | "specific"; // 作用范围: 全部用户或群, 或者指定的用户或群
    user_openids?: string[]; // 仅 scope=c2c 且 target_type=specific 时有效
    group_openids?: string[]; // 仅 scope=group 且 target_type=specific 时有效
    panel: IPanel;
}

/* GET /v2/panels 返回的一个面板 */
export interface IPanelRecord {
    panel_id: string;
    scope: string;
    target_type?: string;
    panel?: IPanel;
    created_at?: string;
    updated_at?: string;
    version?: number;
}

/* GET /v2/panels */
export interface IPanelList {
    records?: IPanelRecord[]; // 按设置时间倒序排列
    next_cursor?: string; // 下一页的游标, 空串表示已到最后一页
    is_end?: boolean; // 是否已到最后一页
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
