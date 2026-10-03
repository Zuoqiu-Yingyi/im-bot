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

import { messageDate } from "@/utils/inbox";

import {
    commandOf,
    convertMessage,
    hasContent,
    messageKey,
    messageMedia,
    repliedMessage,
} from "./message";

import type * as kernel from "siyuan/kernel";

import type { ITelegramBotConfig, ITelegramInboxBinding, ITelegramInboxConfig } from "@/types/config";
import type { IMessage } from "@/types/telegram";
import type { InboxWriter } from "@/utils/inbox";

import type { TelegramApi } from "./api";
import type { TelegramMedia } from "./media";
import type { IConvertOptions, ITelegramMessageLabels } from "./message";
import type { ITelegramBot } from "./poller";

const MSG_ID_ATTRIBUTE = "custom-msg-id"; // 消息块中记录 `会话 ID:消息 ID` 的属性, 用于去重与引用

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 生效的绑定: 已启用, 且会话与文档都已填写 */
export function activeBindings(config: ITelegramInboxConfig): ITelegramInboxBinding[] {
    return config.bindings.filter((binding) => binding.enabled && binding.chat && binding.doc);
}

/**
 * 把绑定会话 (私聊、群组与频道) 的消息写入收集箱文档, 文档的写入由与 QQ、微信共用的 InboxWriter 完成。
 * 发给本机器人的指令与服务消息不写入。消息先以占位文本显示媒体并插入 .temp; 绑定开启回复时随即回复其超级块的块超链接,
 * 开启下载资源文件时再把保存为资源文件的媒体替换进超级块, 最后移动到日期文档。
 * Writes the messages of bound Telegram chats into inbox documents with the
 * InboxWriter shared with QQ and WeChat, except commands for the bot and
 * service messages, and replaces the media placeholders with saved assets.
 */
export class TelegramInbox {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: TelegramApi;
    private readonly writer: InboxWriter;
    private readonly media: TelegramMedia;
    private readonly config: () => ITelegramBotConfig;

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 发送回复的 Bot API 客户端
     * @param writer - 写入收集箱文档, 与 QQ、微信共用
     * @param media - 下载并保存消息中的媒体
     * @param config - 返回当前的 Telegram 机器人配置
     */
    constructor(siyuan: kernel.ISiyuan, api: TelegramApi, writer: InboxWriter, media: TelegramMedia, config: () => ITelegramBotConfig) {
        this.siyuan = siyuan;
        this.api = api;
        this.writer = writer;
        this.media = media;
        this.config = config;
    }

    /**
     * 处理收到的消息 (message 与 channel_post), 只写入有生效绑定的会话中的消息
     * @param bot - 接收该消息的机器人
     * @param message - 消息
     * @param updateId - 推送该消息的更新的 ID
     */
    public handle(bot: ITelegramBot, message: IMessage, updateId: number): void {
        if (commandOf(message, bot.me.username) !== undefined || !hasContent(message)) {
            return;
        }
        const config = this.config().inbox;
        const chat = String(message.chat.id);
        const bindings = activeBindings(config).filter((binding) => binding.chat === chat);
        if (bindings.length === 0) {
            return;
        }

        const downloadAssets = config.downloadAssets;
        this.writer.enqueue(async () => {
            for (const binding of bindings) {
                try {
                    await this.write(bot, binding, message, updateId, downloadAssets);
                }
                catch (error) {
                    void this.siyuan.logger.warn(`[telegram] [inbox] write the message ${messageKey(message)} to ${binding.doc} failed:`, errorMessage(error));
                }
            }
        });
    }

    private async write(bot: ITelegramBot, binding: ITelegramInboxBinding, message: IMessage, updateId: number, downloadAssets: boolean): Promise<void> {
        const inbox = binding.doc;
        await this.writer.prepare(inbox);

        const key = messageKey(message);
        if (await this.writer.findMessage(inbox, MSG_ID_ATTRIBUTE, key)) {
            // 停止接收时丢弃的更新没有被确认, 会再次收到
            void this.siyuan.logger.debug(`[telegram] [inbox] the message ${key} is already in ${inbox}, skip it`);
            return;
        }

        const replied = repliedMessage(message);
        const options: IConvertOptions = {
            updateId,
            reference: replied ? await this.writer.findMessage(inbox, MSG_ID_ATTRIBUTE, messageKey(replied)) : undefined,
            showAuthor: message.chat.type !== "private",
            labels: this.labels(),
        };
        const { block } = await this.writer.appendToTemp(inbox, convertMessage(message, options));
        this.writer.remember(inbox, MSG_ID_ATTRIBUTE, key, block);
        if (binding.reply) {
            void this.reply(bot, message, block);
        }
        if (downloadAssets && messageMedia(message)) {
            await this.saveMedia(bot, message, block, options);
        }
        await this.writer.moveToDate(inbox, block, messageDate(message.date * 1000));
    }

    /* 保存消息中的媒体, 再用资源文件替换超级块中的占位文本; 失败时只记录日志, 保留占位文本 */
    private async saveMedia(bot: ITelegramBot, message: IMessage, block: string, options: IConvertOptions): Promise<void> {
        const assets = await this.media.save(bot, message, block);
        if (!assets.file && !assets.thumbnail) {
            return;
        }
        try {
            await this.writer.updateBlock(block, convertMessage(message, { ...options, assets }));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[telegram] [inbox] put the media of the message ${messageKey(message)} into the block ${block} failed:`, errorMessage(error));
        }
    }

    /* 回复消息超级块的块超链接, 失败时只记录日志 */
    private async reply(bot: ITelegramBot, message: IMessage, block: string): Promise<void> {
        try {
            const sent = await this.api.sendText(bot.options, message.chat.id, `siyuan://blocks/${block}`, message.message_id);
            void this.siyuan.logger.debug(`[telegram] [inbox] replied to the message ${messageKey(message)} with the block ${block}, reply ${sent.message_id}`);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[telegram] [inbox] reply to the message ${messageKey(message)} with the block ${block} failed:`, errorMessage(error));
        }
    }

    private labels(): ITelegramMessageLabels {
        const labels = this.siyuan.plugin.i18n?.inbox as Partial<ITelegramMessageLabels> | undefined;
        return {
            quote: labels?.quote || "Quoted message",
            unavailable: labels?.unavailable || "[Message not available]",
            animation: labels?.animation || "[Animation]",
            audio: labels?.audio || "[Audio]",
            contact: labels?.contact || "[Contact]",
            file: labels?.file || "[File]",
            image: labels?.image || "[Image]",
            location: labels?.location || "[Location]",
            poll: labels?.poll || "[Poll]",
            sticker: labels?.sticker || "[Sticker]",
            video: labels?.video || "[Video]",
            voice: labels?.voice || "[Voice]",
        };
    }
}
