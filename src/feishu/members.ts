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

import { MEMBER_PAGES, MEMBER_REFRESH_INTERVAL } from "./constants";

import type * as kernel from "siyuan/kernel";

import type { FeishuApi } from "./api";
import type { IFeishuBot } from "./gateway";
import type { IFeishuMention } from "./message";

/* 一个群的成员名称 */
interface IChatNames {
    names: Map<string, string>; // open_id → 名称
    fetchedAt: number; // 上次获取成员列表的时间
    pending?: Promise<void>;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * 群成员的名称: 接收消息事件只有发送者的 open_id, 名称取自群成员列表 (需要获取群成员的权限) 与消息中提及的用户。
 * 查不到时重新获取群成员列表, 同一个群每分钟最多获取一次; 获取失败时只记录日志, 名称留空。
 * Names of chat members: events only carry open_ids, so names come from the
 * member list of the chat and from the mentions of messages.
 */
export class FeishuMembers {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: FeishuApi;

    private readonly chats = new Map<string, IChatNames>(); // chat_id → 成员名称

    constructor(siyuan: kernel.ISiyuan, api: FeishuApi) {
        this.siyuan = siyuan;
        this.api = api;
    }

    /* 记住消息中 @ 到的用户的名称 */
    public remember(chat: string, mentions: IFeishuMention[]): void {
        const names = this.entry(chat).names;
        for (const mention of mentions) {
            if (mention.id.startsWith("ou_") && mention.name) {
                names.set(mention.id, mention.name);
            }
        }
    }

    /**
     * 成员的名称
     * @param bot - 收到消息的机器人
     * @param chat - 群的 chat_id
     * @param user - 成员的 open_id
     * @returns 查不到时为 undefined
     */
    public async name(bot: IFeishuBot, chat: string, user: string): Promise<string | undefined> {
        const entry = this.entry(chat);
        const known = entry.names.get(user);
        if (known || !user) {
            return known;
        }
        if (entry.pending || Date.now() - entry.fetchedAt >= MEMBER_REFRESH_INTERVAL) {
            await this.refresh(bot, chat, entry);
        }
        return entry.names.get(user);
    }

    private entry(chat: string): IChatNames {
        let entry = this.chats.get(chat);
        if (!entry) {
            entry = { names: new Map(), fetchedAt: 0 };
            this.chats.set(chat, entry);
        }
        return entry;
    }

    /* 重新获取群成员列表, 并发的获取共用同一次 */
    private async refresh(bot: IFeishuBot, chat: string, entry: IChatNames): Promise<void> {
        if (!entry.pending) {
            entry.fetchedAt = Date.now();
            entry.pending = this.fetch(bot, chat, entry).finally(() => {
                entry.pending = undefined;
            });
        }
        await entry.pending;
    }

    private async fetch(bot: IFeishuBot, chat: string, entry: IChatNames): Promise<void> {
        try {
            let pageToken: string | undefined;
            for (let page = 0; page < MEMBER_PAGES; page++) {
                const result = await this.api.getChatMembers(bot.options, chat, pageToken);
                for (const item of result.items ?? []) {
                    if (item.member_id && item.name) {
                        entry.names.set(item.member_id, item.name);
                    }
                }
                if (!result.has_more || !result.page_token) {
                    return;
                }
                pageToken = result.page_token;
            }
        }
        catch (error) {
            void this.siyuan.logger.debug(`[feishu] [members] get the members of chat ${chat} failed:`, errorMessage(error));
        }
    }
}
