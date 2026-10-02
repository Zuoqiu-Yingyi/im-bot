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
}

/* 微信机器人 (ClawBot); 登录信息不在配置中, 由内核插件保存在 weixin.json 中 */
export interface IWeixinBotConfig {
    eventLog: boolean; // 事件日志: 是否把收到的消息保存到 logs/weixin/messages/
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
    intents: Record<TIntent, boolean>; // QQ_BOT_INTENTS: 各类事件是否订阅
    eventLog: boolean; // 事件日志: 是否把网关推送的事件保存到 logs/events/
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
    group: string; // group_openid
    doc: string; // 收集箱文档 ID
    enabled: boolean; // 是否启用该绑定
    reply: boolean; // 写入后是否向该消息回复其超级块的块超链接
    notify: boolean; // 内核插件开始运行与卸载时是否向该群发送上线与下线通知
}
