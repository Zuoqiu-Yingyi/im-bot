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

/* 各机器人已知的群与单聊用户, 键为机器人的 AppID (OpenID 只在同一个机器人内有效) */
export type TUsers = Record<string, IBotUsers>;

/**
 * 一个机器人已知的群与单聊用户, 即 `qq/<AppID>/chats.json` 的内容。
 * 时间都是 ISO 8601 格式的 UTC 时间, 如 `2026-10-01T08:00:00.000Z`, 取自事件中的时间。
 */
export interface IBotUsers {
    groups: Record<string, IGroupRecord>; // group_openid → 群
    users: Record<string, IUserRecord>; // user_openid → 单聊用户
}

/**
 * 机器人与群或用户的关系, 取机器人被添加、被移出与最近一条消息中最晚的一项:
 * added 为机器人在群中 (或用户已添加机器人), removed 为机器人已被移出群 (或已被用户删除)
 */
export type TRelation = "added" | "removed";

/* 一次事件 */
export interface ITimeRecord {
    time: string; // 事件的时间
}

/* 群中的一次操作 */
export interface IGroupOperation extends ITimeRecord {
    operator?: string; // 操作人的群成员 OpenID (op_member_openid)
}

/* 主动消息的开关 */
export interface IProactiveSetting extends ITimeRecord {
    allowed: boolean; // 是否允许机器人发送主动消息
    operator?: string; // 仅群: 操作人的群成员 OpenID
}

/* 群主, 取自群主发送的消息 */
export interface IGroupOwner extends ITimeRecord {
    openid: string; // 群主的群成员 OpenID (member_openid)
    username?: string; // 群主的昵称
}

/* 用户添加机器人 */
export interface IFriendAdded extends ITimeRecord {
    scene?: number; // 添加机器人的场景, 取值见 FRIEND_ADD 事件的文档
    sceneParam?: string; // 分享链接中的回调数据 (scene_param)
}

/* 用户发送的单聊消息 */
export interface IUserMessage extends ITimeRecord {
    username?: string; // 用户的昵称, QQ 可能不提供
}

export interface IGroupRecord {
    status: TRelation;
    name?: string; // 群名称: QQ 的事件中没有群名称, 取自最近一次成功的查询群信息 (GET /v2/groups/{group_openid}/info)
    firstSeen: string; // 记录到的最早一个事件的时间
    added?: IGroupOperation; // 最近一次机器人被添加到群 (GROUP_ADD_ROBOT)
    removed?: IGroupOperation; // 最近一次机器人被移出群 (GROUP_DEL_ROBOT)
    proactive?: IProactiveSetting; // 最近一次群管理员开启或关闭主动消息 (GROUP_MSG_RECEIVE、GROUP_MSG_REJECT)
    lastMessage?: ITimeRecord; // 最近一条群消息 (GROUP_AT_MESSAGE_CREATE、GROUP_MESSAGE_CREATE)
    owner?: IGroupOwner; // 最近一条群主发送的消息中的群主
}

export interface IUserRecord {
    status: TRelation;
    firstSeen: string; // 记录到的最早一个事件的时间
    unionOpenid?: string; // 跨应用的统一 OpenID (union_openid)
    added?: IFriendAdded; // 最近一次用户添加机器人 (FRIEND_ADD)
    removed?: ITimeRecord; // 最近一次用户删除机器人 (FRIEND_DEL)
    proactive?: IProactiveSetting; // 最近一次用户开启或关闭主动消息 (C2C_MSG_RECEIVE、C2C_MSG_REJECT)
    lastMessage?: IUserMessage; // 最近一条单聊消息 (C2C_MESSAGE_CREATE)
}
