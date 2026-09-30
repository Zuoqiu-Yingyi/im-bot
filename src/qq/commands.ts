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

import { COMMANDS, GROUP_MESSAGE_EVENTS } from "./constants";
import { sceneValue } from "./message";
import { resolveCredentials } from "./openapi";

import type * as kernel from "siyuan/kernel";

import type { IQQBotConfig } from "@/types/config";
import type { IGroupMessage, IMessage, IPayload } from "@/types/qq";

import type { QQOpenApi } from "./openapi";

/* 指令所在的会话 */
interface IChat {
    path: string; // 发送消息的接口路径
    user: string; // 发送者的 OpenID: 单聊中为 user_openid, 群聊中为 member_openid
    group?: string; // 群聊的 group_openid, 单聊时为 undefined
}

/* 回复中使用的界面文本, {{1}} 为 OpenID */
interface IOpenIdLabels {
    user: string;
    group: string;
}

const COMMAND = /^\/(\S+)/; // 以 `/指令名` 开头的消息
const MENTION = /<@!?(\w+)>/g;
const RECENT_COMMANDS = 1024; // 在内存中记住的最近处理过的指令消息数

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 去掉 content 中 @ 机器人的标记: GROUP_MESSAGE_CREATE 保留了该标记, GROUP_AT_MESSAGE_CREATE 已去掉前缀 */
function stripBotMentions(message: IGroupMessage): string {
    const bot = new Set<string>();
    for (const mention of message.mentions ?? []) {
        if (mention.is_you) {
            for (const id of [mention.id, mention.member_openid]) {
                if (id) {
                    bot.add(id);
                }
            }
        }
    }
    return (message.content ?? "").replace(MENTION, (token, id: string) => bot.has(id) ? "" : token);
}

/**
 * 指令: 响应用户在单聊或群聊中发送的 `/指令名`, 目前只有 /openid。
 * 群聊消息去掉提及机器人的标记后以 `/指令名` 开头才视为指令, 因此以提及其他人开头的消息不会触发。
 * 同一条消息可能重复推送, 也可能同时推送 GROUP_AT_MESSAGE_CREATE 与 GROUP_MESSAGE_CREATE, 只回复一次。
 * Answers commands (`/name`) sent in C2C or group chats; only /openid for now.
 * A message is answered once, even when it is pushed again or pushed as both
 * GROUP_AT_MESSAGE_CREATE and GROUP_MESSAGE_CREATE.
 */
export class QQCommands {
    private readonly siyuan: kernel.ISiyuan;
    private readonly openapi: QQOpenApi;
    private readonly config: () => IQQBotConfig;

    private readonly handled = new Set<string>(); // 最近处理过的消息的 `id:消息 ID` 与 `idx:msg_idx`

    /**
     * @param siyuan - 内核插件全局对象
     * @param openapi - 发送回复的 OpenAPI 客户端
     * @param config - 返回当前的 QQ 机器人配置
     */
    constructor(siyuan: kernel.ISiyuan, openapi: QQOpenApi, config: () => IQQBotConfig) {
        this.siyuan = siyuan;
        this.openapi = openapi;
        this.config = config;
    }

    /* 处理网关推送的事件, 只接收单聊与群聊消息 */
    public handle(payload: IPayload): void {
        let message: IMessage;
        let text: string;
        let chat: IChat;
        if (payload.t === "C2C_MESSAGE_CREATE") {
            message = payload.d as IMessage;
            const user = message.author?.user_openid || message.author?.id;
            if (!user) {
                return;
            }
            text = message.content ?? "";
            chat = { path: `/v2/users/${encodeURIComponent(user)}/messages`, user };
        }
        else if (payload.t && GROUP_MESSAGE_EVENTS.has(payload.t)) {
            const group = payload.d as IGroupMessage;
            const user = group.author?.member_openid || group.author?.id;
            if (!user || !group.group_openid) {
                return;
            }
            message = group;
            text = stripBotMentions(group);
            chat = {
                path: `/v2/groups/${encodeURIComponent(group.group_openid)}/messages`,
                user,
                group: group.group_openid,
            };
        }
        else {
            return;
        }

        const command = COMMAND.exec(text.trim())?.[1];
        if (command !== COMMANDS.OPENID || !this.claim(message)) {
            return;
        }
        void this.siyuan.logger.info(`[qq] [commands] /${command} from ${chat.user}${chat.group ? ` in group ${chat.group}` : ""}`);
        void this.reply(message, chat, this.openIdText(chat));
    }

    /* 记住消息的 ID 与 msg_idx, 返回该消息是否还没有处理过 */
    private claim(message: IMessage): boolean {
        const msgIdx = sceneValue(message, "msg_idx");
        const keys = [`id:${message.id}`, ...(msgIdx ? [`idx:${msgIdx}`] : [])];
        if (keys.some((key) => this.handled.has(key))) {
            void this.siyuan.logger.debug(`[qq] [commands] the message ${message.id} is already handled, skip it`);
            return false;
        }
        for (const key of keys) {
            this.handled.add(key);
        }
        while (this.handled.size > RECENT_COMMANDS * 2) {
            this.handled.delete(this.handled.values().next().value!);
        }
        return true;
    }

    /* /openid 的回复: 用户的 OpenID, 群聊中还有群组的 OpenID */
    private openIdText(chat: IChat): string {
        const labels = this.openIdLabels();
        const lines = [labels.user.replaceAll("{{1}}", chat.user)];
        if (chat.group) {
            lines.push(labels.group.replaceAll("{{1}}", chat.group));
        }
        return lines.join("\n");
    }

    /* 被动回复: msg_id 为指令消息的 ID, 相同的 msg_id 与 msg_seq 只能发送一次 */
    private async reply(message: IMessage, chat: IChat, content: string): Promise<void> {
        const credentials = resolveCredentials(this.config());
        if (!credentials) {
            return;
        }
        try {
            const response = await this.openapi.request(credentials, {
                url: chat.path,
                method: "POST",
                body: {
                    msg_type: 0,
                    content,
                    msg_id: message.id,
                    msg_seq: 1,
                },
            });
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`${response.status} ${JSON.stringify(response.body)}`);
            }
        }
        catch (error) {
            void this.siyuan.logger.warn(`[qq] [commands] reply to the message ${message.id} failed:`, errorMessage(error));
        }
    }

    private openIdLabels(): IOpenIdLabels {
        const labels = this.siyuan.plugin.i18n?.commands?.openid as Partial<IOpenIdLabels> | undefined;
        return {
            user: labels?.user || "User OpenID: {{1}}",
            group: labels?.group || "Group OpenID: {{1}}",
        };
    }
}
