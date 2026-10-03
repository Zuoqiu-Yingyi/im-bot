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

import type * as kernel from "siyuan/kernel";

import type { TNotice } from "@/qq/notices";

import type { FeishuApi, IFeishuOptions } from "./api";

/* 通知文本, {{1}} 为设备名称 */
const DEFAULT_TEXTS: Record<TNotice, string> = {
    offline: "Inbox offline: messages of this chat are not recorded for now (device: {{1}})",
    online: "Inbox online: messages of this chat are recorded in SiYuan (device: {{1}})",
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * 收集箱通知: 向开启了通知的收集箱绑定所在的会话发送机器人的上线与下线通知, 失败时只记录日志。
 * Sends the online and offline notices of the bot to the chats whose inbox
 * bindings turn on notices; a failed notice is only logged.
 */
export class FeishuNotices {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: FeishuApi;

    constructor(siyuan: kernel.ISiyuan, api: FeishuApi) {
        this.siyuan = siyuan;
        this.api = api;
    }

    /**
     * 向每个会话发送一条通知, 同时发送, 全部结束 (成功或失败) 后兑现
     * @param options - 凭证与开放平台地址
     * @param chats - 会话 ID, 重复的只发送一次
     * @param notice - 通知类型
     * @param device - 通知中的设备名称
     */
    public async send(options: IFeishuOptions, chats: string[], notice: TNotice, device: string): Promise<void> {
        const text = this.text(notice).replaceAll("{{1}}", () => device);
        await Promise.all([...new Set(chats)].map((chat) => this.sendTo(options, chat, notice, text)));
    }

    private async sendTo(options: IFeishuOptions, chat: string, notice: TNotice, text: string): Promise<void> {
        try {
            await this.api.sendText(options, chat, text);
            void this.siyuan.logger.info(`[feishu] [notices] sent the ${notice} notice to chat ${chat}`);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] [notices] send the ${notice} notice to chat ${chat} failed:`, errorMessage(error));
        }
    }

    private text(notice: TNotice): string {
        const texts = this.siyuan.plugin.i18n?.notices?.feishu as Partial<Record<TNotice, string>> | undefined;
        return texts?.[notice] || DEFAULT_TEXTS[notice];
    }
}
