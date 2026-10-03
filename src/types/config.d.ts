// Copyright (C) 2024 Zuoqiu Yingyi
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

import type { TIntent } from "@/qq/constants";
import type { IPanelConfig } from "@/types/qq";

export interface IConfig {
    qq: IQQBotConfig;
    weixin: IWeixinBotConfig;
    telegram: ITelegramBotConfig;
    feishu: IFeishuBotConfig;
}

/* 飞书机器人 (企业自建应用), 以长连接接收事件 */
export interface IFeishuBotConfig {
    appId: string; // 应用的 App ID, 形如 cli_xxx
    appSecret: string; // 应用的 App Secret
    apiBaseUrl: string; // 开放平台的地址, 为空时使用飞书 https://open.feishu.cn; Lark 为 https://open.larksuite.com
    online: boolean; // 是否上线: 关闭时所有设备都不连接 (下线)
    eventLog: boolean; // 事件日志: 是否把收到的事件保存到 feishu/<App ID>/events/
    device: string; // 运行飞书机器人的设备 ID, 为空时每台设备都运行
    inbox: IFeishuInboxConfig; // 思源收集箱
}

export interface IFeishuInboxConfig {
    bindings: IFeishuInboxBinding[]; // 会话与收集箱文档的绑定
    downloadAssets: boolean; // 是否把消息中的媒体保存为资源文件
}

export interface IFeishuInboxBinding {
    chat: string; // 会话 ID (chat_id), 单聊与群聊都以 oc_ 开头
    doc: string; // 收集箱文档 ID
    enabled: boolean; // 是否启用该绑定
    reply: boolean; // 写入后是否向该消息回复其超级块的块超链接
    notify: boolean; // 机器人上线与下线时是否向该会话发送通知
}

/* Telegram 机器人 */
export interface ITelegramBotConfig {
    token: string; // 从 @BotFather 获取的 Token, 形如 <机器人 ID>:<密钥>
    botId: string; // Token 对应的机器人 ID, 由内核插件在 getMe 成功后写入, 前端不修改
    apiBaseUrl: string; // Bot API 服务器的地址, 为空时使用官方服务器 https://api.telegram.org
    online: boolean; // 是否上线: 关闭时所有设备都不接收消息 (下线)
    eventLog: boolean; // 事件日志: 是否把收到的更新保存到 telegram/<机器人 ID>/events/
    device: string; // 运行 Telegram 机器人的设备 ID, 为空时每台设备都运行
    inbox: ITelegramInboxConfig; // 思源收集箱
}

export interface ITelegramInboxConfig {
    bindings: ITelegramInboxBinding[]; // 会话与收集箱文档的绑定
    downloadAssets: boolean; // 是否把消息中的媒体保存为资源文件
}

export interface ITelegramInboxBinding {
    chat: string; // 会话 ID (chat_id), 私聊为用户 ID, 超级群与频道以 -100 开头
    doc: string; // 收集箱文档 ID
    enabled: boolean; // 是否启用该绑定
    reply: boolean; // 写入后是否向该消息回复其超级块的块超链接
    notify: boolean; // 机器人上线与下线时是否向该会话发送通知
}

/* 微信机器人 (ClawBot); 登录信息不在配置中, 由内核插件保存在 weixin/<机器人 ID>/auth.json 中 */
export interface IWeixinBotConfig {
    botId: string; // 当前登录的机器人 ID (ilink_bot_id), 没有登录时为空; 由内核插件在扫码登录与退出登录时写入, 前端不修改
    online: boolean; // 是否上线: 关闭时所有设备都不接收消息 (下线)
    eventLog: boolean; // 事件日志: 是否把收到的消息保存到 weixin/<机器人 ID>/events/
    inbox: IWeixinInboxConfig; // 思源收集箱
}

export interface IWeixinInboxConfig {
    doc: string; // 收集箱文档 ID
    enabled: boolean; // 是否写入收集箱
    reply: boolean; // 写入后是否向该消息回复其超级块的块超链接
    downloadAssets: boolean; // 是否把消息中的媒体解密后保存为资源文件, 内核没有 siyuan.crypto 或不支持 AES-ECB 时始终显示为占位文本
}

export interface IQQBotConfig {
    appid: string; // QQ_BOT_APPID
    secret: string; // QQ_BOT_SECRET
    online: boolean; // 是否上线: 关闭时所有设备都不连接网关 (下线)
    intents: Record<TIntent, boolean>; // QQ_BOT_INTENTS: 各类事件是否订阅
    eventLog: boolean; // 事件日志: 是否把网关推送的事件保存到 qq/<AppID>/events/
    device: string; // 运行 QQ 机器人的设备 ID, 为空时每台设备都运行
    inbox: IQQInboxConfig; // 思源收集箱
    panels: IQQPanelsConfig; // 指令面板
}

/* 指令面板, 内核插件按 panel.remark 查找 QQ 开放平台上对应的面板 */
export interface IQQPanelsConfig {
    c2c: IPanelConfig; // 单聊
    group: IPanelConfig; // 群聊
}

export interface IQQInboxConfig {
    bindings: IQQInboxBinding[]; // 群聊与收集箱文档的绑定
    downloadAssets: boolean; // 是否把消息中的资源文件下载到本地
}

export interface IQQInboxBinding {
    chat: string; // group_openid
    doc: string; // 收集箱文档 ID
    enabled: boolean; // 是否启用该绑定
    reply: boolean; // 写入后是否向该消息回复其超级块的块超链接
    notify: boolean; // 内核插件开始运行与卸载时是否向该群发送上线与下线通知
}
