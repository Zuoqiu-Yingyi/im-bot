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

/*
 * 各机器人的数据文件, 路径都相对插件数据目录 data/storage/petal/im-bot/ (config.json 所在的目录)。
 * 每个机器人一个目录, 以配置中的机器人 ID 命名: QQ 为 qq.appid, 微信为 weixin.botId, Telegram 为 telegram.botId, 飞书为 feishu.appId
 * - qq/<AppID>/events/<事件类型>/<事件 ID>.json: 网关推送的事件
 * - qq/<AppID>/chats.json: 已知的群与单聊用户
 * - weixin/<机器人 ID>/events/<消息 ID>.json: 收到的消息
 * - weixin/<机器人 ID>/auth.json: 扫码登录的登录信息
 * - weixin/<机器人 ID>/cursor.json: 接收消息的游标
 * - telegram/<机器人 ID>/events/<update_id>.json: 收到的更新
 * - feishu/<App ID>/events/<事件类型>/<事件 ID>.json: 收到的事件
 */

/* 路径中的一段: 只保留字母、数字与 `_.@-`, 其余字符替换为 `_`; 为空或只由 `.` 组成时也替换, 使文件不会写到所属的目录之外 */
function segment(value: number | string): string {
    const name = String(value).replace(/[^\w.@-]/g, "_");
    return /^\.*$/.test(name) ? "_".repeat(Math.max(name.length, 1)) : name;
}

export function qqChatsPath(appid: string): string {
    return `qq/${segment(appid)}/chats.json`;
}

export function qqEventPath(appid: string, type: string, id: string): string {
    return `qq/${segment(appid)}/events/${segment(type)}/${segment(id)}.json`;
}

export function weixinDirectory(botId: string): string {
    return `weixin/${segment(botId)}`;
}

export function weixinAuthPath(botId: string): string {
    return `${weixinDirectory(botId)}/auth.json`;
}

export function weixinCursorPath(botId: string): string {
    return `${weixinDirectory(botId)}/cursor.json`;
}

export function weixinEventPath(botId: string, messageId: string): string {
    return `${weixinDirectory(botId)}/events/${segment(messageId)}.json`;
}

/* update_id 只在同一个机器人中唯一 */
export function telegramEventPath(botId: number | string, updateId: number): string {
    return `telegram/${segment(botId)}/events/${segment(updateId)}.json`;
}

export function feishuEventPath(appId: string, type: string, id: string): string {
    return `feishu/${segment(appId)}/events/${segment(type)}/${segment(id)}.json`;
}
