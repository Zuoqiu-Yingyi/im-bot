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

import { COMMANDS } from "./constants";
import { commandOf, messageKey } from "./message";

import type * as kernel from "siyuan/kernel";

import type { IMessage, TChatMemberStatus } from "@/types/telegram";

import type { TelegramApi } from "./api";
import type { ITelegramBot } from "./poller";

/* 回复中使用的界面文本, {{1}} 为 ID */
interface IChatIdLabels {
    chat: string;
    user: string;
}

const KNOWN_COMMANDS = new Set<string>(Object.values(COMMANDS));
const ADMIN_STATUSES = new Set<TChatMemberStatus>(["administrator", "creator"]); // 群组中可以使用指令的身份
const RECENT_COMMANDS = 1024; // 在内存中记住的最近回复过的指令消息数

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function fill(template: string, value: string): string {
    return template.replaceAll("{{1}}", () => value);
}

/**
 * 指令: 用会话 ID (群组中还有发送者的用户 ID) 回复 /chatid 与 /start, 用于配置收集箱的绑定。
 * 群组中只响应群主与管理员 (包括以群组身份发言的匿名管理员) 发送的指令, 其他成员发送的只记录日志。
 * 指令都不写入收集箱; 指令带有其他机器人的用户名 (如 `/chatid@other_bot`) 时不是发给本机器人的。
 * Answers /chatid and /start with the chat ID, and in groups with the user ID
 * of the sender too; in groups only the owner and administrators are answered.
 */
export class TelegramCommands {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: TelegramApi;

    private readonly answered = new Set<string>(); // 最近回复过的指令消息的 `会话 ID:消息 ID`

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 发送回复的 Bot API 客户端
     */
    constructor(siyuan: kernel.ISiyuan, api: TelegramApi) {
        this.siyuan = siyuan;
        this.api = api;
    }

    /* 处理收到的消息 (message 与 channel_post) */
    public handle(bot: ITelegramBot, message: IMessage): void {
        const command = commandOf(message, bot.me.username);
        if (command === undefined) {
            return;
        }
        if (!KNOWN_COMMANDS.has(command)) {
            void this.siyuan.logger.info(`[telegram] [commands] ignore the unknown command /${command} in chat ${message.chat.id}`);
            return;
        }

        const key = messageKey(message);
        if (this.answered.has(key)) {
            void this.siyuan.logger.debug(`[telegram] [commands] the message ${key} is already answered, skip it`);
            return;
        }
        this.answered.add(key);
        if (this.answered.size > RECENT_COMMANDS) {
            this.answered.delete(this.answered.values().next().value!);
        }
        void this.answer(bot, message, command);
    }

    private async answer(bot: ITelegramBot, message: IMessage, command: string): Promise<void> {
        const chat = message.chat;
        const from = message.sender_chat?.id ?? message.from?.id;
        try {
            if ((chat.type === "group" || chat.type === "supergroup") && !await this.isAdmin(bot, message)) {
                void this.siyuan.logger.info(`[telegram] [commands] ignore /${command} from ${from} in chat ${chat.id}: only the owner and administrators can send commands in groups`);
                return;
            }
            void this.siyuan.logger.info(`[telegram] [commands] /${command} from ${from} in chat ${chat.id}`);
            await this.api.sendText(bot.options, chat.id, this.chatIdText(message), message.message_id);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[telegram] [commands] answer /${command} in chat ${chat.id} failed:`, errorMessage(error));
        }
    }

    /* 发送者是不是群主或管理员; 以该群组身份发言的是匿名管理员 */
    private async isAdmin(bot: ITelegramBot, message: IMessage): Promise<boolean> {
        if (message.sender_chat) {
            return message.sender_chat.id === message.chat.id;
        }
        if (!message.from) {
            return false;
        }
        const member = await this.api.getChatMember(bot.options, message.chat.id, message.from.id);
        return ADMIN_STATUSES.has(member.status);
    }

    /* 回复的内容: 会话 ID; 发送者是用户且不是该会话本身 (群组中) 时还有用户 ID */
    private chatIdText(message: IMessage): string {
        const labels = this.labels();
        const lines = [fill(labels.chat, String(message.chat.id))];
        const user = message.sender_chat ? undefined : message.from;
        if (user && user.id !== message.chat.id) {
            lines.push(fill(labels.user, String(user.id)));
        }
        return lines.join("\n");
    }

    private labels(): IChatIdLabels {
        const labels = this.siyuan.plugin.i18n?.commands?.chatid as Partial<IChatIdLabels> | undefined;
        return {
            chat: labels?.chat || "Chat ID: {{1}}",
            user: labels?.user || "User ID: {{1}}",
        };
    }
}
