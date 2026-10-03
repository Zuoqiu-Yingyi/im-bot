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
import { commandOf } from "./message";

import type * as kernel from "siyuan/kernel";

import type { FeishuApi } from "./api";
import type { IFeishuBot } from "./gateway";
import type { IFeishuMessage } from "./message";

/* 回复中使用的界面文本, {{1}} 为 ID */
interface IChatIdLabels {
    chat: string;
    user: string;
}

const KNOWN_COMMANDS = new Set<string>(Object.values(COMMANDS));
const RECENT_COMMANDS = 1024; // 在内存中记住的最近回复过的指令消息数

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function fill(template: string, value: string): string {
    return template.replaceAll("{{1}}", () => value);
}

/**
 * 指令: 用会话 ID 与发送者的 open_id 回复 /chatid, 用于配置收集箱的绑定。
 * 单聊中直接发送; 群聊中要提及机器人, 且只响应群主与群管理员 (需要获取群信息的权限), 其他成员发送的只记录日志。
 * 指令都不写入收集箱。
 * Answers /chatid with the chat ID and the open_id of the sender; in groups
 * the bot must be mentioned and only the owner and managers are answered.
 */
export class FeishuCommands {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: FeishuApi;

    private readonly answered = new Set<string>(); // 最近回复过的指令消息的 message_id

    constructor(siyuan: kernel.ISiyuan, api: FeishuApi) {
        this.siyuan = siyuan;
        this.api = api;
    }

    /* 处理接收消息事件中的消息 */
    public handle(bot: IFeishuBot, message: IFeishuMessage): void {
        const command = commandOf(message, bot.info.open_id);
        if (command === undefined) {
            return;
        }
        if (!KNOWN_COMMANDS.has(command)) {
            void this.siyuan.logger.info(`[feishu] [commands] ignore the unknown command /${command} in chat ${message.chatId}`);
            return;
        }

        if (this.answered.has(message.id)) {
            void this.siyuan.logger.debug(`[feishu] [commands] the message ${message.id} is already answered, skip it`);
            return;
        }
        this.answered.add(message.id);
        if (this.answered.size > RECENT_COMMANDS) {
            this.answered.delete(this.answered.values().next().value!);
        }
        void this.answer(bot, message, command);
    }

    private async answer(bot: IFeishuBot, message: IFeishuMessage, command: string): Promise<void> {
        try {
            if (message.chatType !== "p2p" && !await this.isManager(bot, message)) {
                void this.siyuan.logger.info(`[feishu] [commands] ignore /${command} from ${message.senderId} in chat ${message.chatId}: only the owner and managers can send commands in groups`);
                return;
            }
            void this.siyuan.logger.info(`[feishu] [commands] /${command} from ${message.senderId} in chat ${message.chatId}`);
            const labels = this.labels();
            const text = [fill(labels.chat, message.chatId), fill(labels.user, message.senderId)].join("\n");
            await this.api.replyText(bot.options, message.id, text);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] [commands] answer /${command} in chat ${message.chatId} failed:`, errorMessage(error));
        }
    }

    /* 发送者是不是群主或群管理员 */
    private async isManager(bot: IFeishuBot, message: IFeishuMessage): Promise<boolean> {
        const chat = await this.api.getChat(bot.options, message.chatId);
        return chat.owner_id === message.senderId || (chat.user_manager_id_list ?? []).includes(message.senderId);
    }

    private labels(): IChatIdLabels {
        const commands = this.siyuan.plugin.i18n?.commands as { chatid?: Partial<IChatIdLabels>; openid?: Partial<IChatIdLabels> } | undefined;
        return {
            chat: commands?.chatid?.chat || "Chat ID: {{1}}",
            user: commands?.openid?.user || "User OpenID: {{1}}",
        };
    }
}
