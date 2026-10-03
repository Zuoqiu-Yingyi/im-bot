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

import { mergeIgnoreArray } from "@workspace/utils/misc/merge";

import type {
    IConfig,
    IFeishuInboxBinding,
    IQQInboxBinding,
    ITelegramInboxBinding,
} from "@/types/config";

export const DEFAULT_CONFIG: IConfig = {
    qq: {
        appid: "",
        secret: "",
        online: false,
        intents: {
            GUILDS: false,
            GUILD_MEMBERS: false,
            GUILD_MESSAGES: false,
            GUILD_MESSAGE_REACTIONS: false,
            DIRECT_MESSAGE: false,
            GROUP_AND_C2C_EVENT: true,
            INTERACTION: false,
            MESSAGE_AUDIT: false,
            FORUMS_EVENT: false,
            AUDIO_ACTION: false,
            PUBLIC_GUILD_MESSAGES: true,
        },
        eventLog: true,
        device: "",
        inbox: {
            bindings: [],
            downloadAssets: true,
        },
        panels: {
            c2c: {
                scope: "c2c",
                target_type: "all",
                panel: {
                    items: [
                        {
                            type: "command",
                            name: "openid",
                            desc: "查询当前用户的 OpenID",
                        },
                    ],
                    remark: "siyuan-plugin-im-bot-c2c",
                },
            },
            group: {
                scope: "group",
                target_type: "all",
                panel: {
                    items: [
                        {
                            type: "command",
                            name: "openid",
                            desc: "查询当前用户与群组的 OpenID",
                            only_admin: true,
                        },
                    ],
                    remark: "siyuan-plugin-im-bot-group",
                },
            },
        },
    },
    weixin: {
        online: false,
        eventLog: true,
        inbox: {
            doc: "",
            enabled: true,
            reply: false,
            downloadAssets: true,
        },
    },
    telegram: {
        token: "",
        apiBaseUrl: "",
        online: false,
        eventLog: true,
        device: "",
        inbox: {
            bindings: [],
            downloadAssets: true,
        },
    },
    feishu: {
        appId: "",
        appSecret: "",
        apiBaseUrl: "",
        online: false,
        eventLog: true,
        device: "",
        inbox: {
            bindings: [],
            downloadAssets: true,
        },
    },
};

/* 新建的收集箱绑定 */
export const DEFAULT_INBOX_BINDING: IQQInboxBinding = {
    group: "",
    doc: "",
    enabled: true,
    reply: false,
    notify: false,
};

/* 新建的 Telegram 收集箱绑定 */
export const DEFAULT_TELEGRAM_INBOX_BINDING: ITelegramInboxBinding = {
    chat: "",
    doc: "",
    enabled: true,
    reply: false,
    notify: false,
};

/* 新建的飞书收集箱绑定 */
export const DEFAULT_FEISHU_INBOX_BINDING: IFeishuInboxBinding = {
    chat: "",
    doc: "",
    enabled: true,
    reply: false,
    notify: false,
};

/**
 * 在默认配置上合并保存的配置, 数组整体覆盖默认值。
 * 收集箱的绑定逐条按 DEFAULT_INBOX_BINDING 补全: 旧版配置中的绑定没有 enabled、reply 与 notify, 视为启用、不回复、不通知;
 * Telegram 与飞书的绑定同样按各自的默认绑定补全, 手动编辑的配置可能缺少字段
 * @param configs - 保存的配置, 后面的覆盖前面的
 */
export function mergeConfig(...configs: Partial<IConfig>[]): IConfig {
    const config = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG, ...configs);
    config.qq.inbox.bindings = config.qq.inbox.bindings.map((binding) => ({ ...DEFAULT_INBOX_BINDING, ...binding }));
    config.telegram.inbox.bindings = config.telegram.inbox.bindings.map((binding) => ({ ...DEFAULT_TELEGRAM_INBOX_BINDING, ...binding }));
    config.feishu.inbox.bindings = config.feishu.inbox.bindings.map((binding) => ({ ...DEFAULT_FEISHU_INBOX_BINDING, ...binding }));
    return config;
}
