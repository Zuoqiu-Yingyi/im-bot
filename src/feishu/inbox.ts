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

import { REORDER_DELAY, REORDER_MAX_DELAY } from "./constants";
import {
    commandOf,
    convertMessage,
    flattenForwarded,
    forwardedTree,
    fromApi,
    hasContent,
    messageResources,
    messageText,
} from "./message";

import type * as kernel from "siyuan/kernel";

import type { IFeishuBotConfig, IFeishuInboxBinding, IFeishuInboxConfig } from "@/types/config";
import type { InboxWriter } from "@/utils/inbox";

import type { FeishuApi } from "./api";
import type { IFeishuBot } from "./gateway";
import type { FeishuMedia } from "./media";
import type { FeishuMembers } from "./members";
import type {
    IConvertOptions,
    IFeishuMessage,
    IFeishuMessageLabels,
    IForwardedMessage,
} from "./message";

/* 等待写入的消息 */
interface IPendingMessage {
    bot: IFeishuBot;
    message: IFeishuMessage;
    eventId?: string;
}

const MSG_ID_ATTRIBUTE = "custom-msg-id"; // 消息块中记录 message_id 的属性, 用于去重与引用

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 生效的绑定: 已启用, 且会话与文档都已填写 */
export function activeBindings(config: IFeishuInboxConfig): IFeishuInboxBinding[] {
    return config.bindings.filter((binding) => binding.enabled && binding.chat && binding.doc);
}

/* 按发送时间排序, 时间相同时按 message_id */
function compareMessages(a: IPendingMessage, b: IPendingMessage): number {
    return a.message.createTime - b.message.createTime
        || (a.message.id < b.message.id ? -1 : a.message.id > b.message.id ? 1 : 0);
}

/**
 * 把绑定会话 (单聊与群聊) 的消息写入收集箱文档, 文档的写入由各平台共用的 InboxWriter 完成。
 * 发给本机器人的指令与系统消息不写入。同一秒内连发的消息到达的顺序可能与发送顺序不同,
 * 所以消息先等待 1 秒 (从第一条开始最多 3 秒), 按发送时间排序后再写入。
 * 消息先以占位文本显示媒体并插入 .temp; 绑定开启回复时随即回复其超级块的块超链接,
 * 开启下载资源文件时再把保存为资源文件的媒体替换进超级块, 最后移动到日期文档。
 * 群聊中的消息块记录发送者的名称; 回复的消息引用被回复的消息; 合并转发展开其中的子消息。
 * Writes the messages of bound Feishu chats into inbox documents with the
 * shared InboxWriter, sorted by their send time, except commands and system
 * messages, and replaces the media placeholders with saved assets.
 */
export class FeishuInbox {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: FeishuApi;
    private readonly writer: InboxWriter;
    private readonly media: FeishuMedia;
    private readonly members: FeishuMembers;
    private readonly config: () => IFeishuBotConfig;

    private pending: IPendingMessage[] = [];
    private firstPendingAt = 0;
    private timer?: ReturnType<typeof setTimeout>;

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 开放平台客户端
     * @param writer - 写入收集箱文档, 与其他平台共用
     * @param media - 下载并保存消息中的媒体
     * @param members - 群成员的名称
     * @param config - 返回当前的飞书机器人配置
     */
    constructor(
        siyuan: kernel.ISiyuan,
        api: FeishuApi,
        writer: InboxWriter,
        media: FeishuMedia,
        members: FeishuMembers,
        config: () => IFeishuBotConfig,
    ) {
        this.siyuan = siyuan;
        this.api = api;
        this.writer = writer;
        this.media = media;
        this.members = members;
        this.config = config;
    }

    /**
     * 处理收到的消息, 只写入有生效绑定的会话中的消息
     * @param bot - 收到该消息的机器人
     * @param message - 接收消息事件中的消息
     * @param eventId - 推送该消息的事件的 ID
     */
    public handle(bot: IFeishuBot, message: IFeishuMessage, eventId?: string): void {
        if (commandOf(message, bot.info.open_id) !== undefined || !hasContent(message)) {
            return;
        }
        if (!activeBindings(this.config().inbox).some((binding) => binding.chat === message.chatId)) {
            return;
        }
        if (message.chatType === "group") {
            this.members.remember(message.chatId, message.mentions);
        }

        if (this.pending.length === 0) {
            this.firstPendingAt = Date.now();
        }
        this.pending.push({ bot, message, eventId });
        clearTimeout(this.timer);
        const delay = Math.max(0, Math.min(REORDER_DELAY, this.firstPendingAt + REORDER_MAX_DELAY - Date.now()));
        this.timer = setTimeout(() => this.flush(), delay);
    }

    /* 把等待中的消息按发送时间排序后排入写入队列; 停止运行时也调用, 不再等待后续消息 */
    public flush(): void {
        clearTimeout(this.timer);
        const batch = this.pending.sort(compareMessages);
        this.pending = [];

        const config = this.config().inbox;
        const downloadAssets = config.downloadAssets;
        const bindings = activeBindings(config);
        for (const item of batch) {
            const targets = bindings.filter((binding) => binding.chat === item.message.chatId);
            if (targets.length === 0) {
                continue;
            }
            this.writer.enqueue(async () => {
                for (const binding of targets) {
                    try {
                        await this.write(item, binding, downloadAssets);
                    }
                    catch (error) {
                        void this.siyuan.logger.warn(`[feishu] [inbox] write the message ${item.message.id} to ${binding.doc} failed:`, errorMessage(error));
                    }
                }
            });
        }
    }

    private async write(item: IPendingMessage, binding: IFeishuInboxBinding, downloadAssets: boolean): Promise<void> {
        const { bot, message } = item;
        const inbox = binding.doc;
        await this.writer.prepare(inbox);

        if (await this.writer.findMessage(inbox, MSG_ID_ATTRIBUTE, message.id)) {
            // 服务端可能以不同的事件重推同一条消息
            void this.siyuan.logger.debug(`[feishu] [inbox] the message ${message.id} is already in ${inbox}, skip it`);
            return;
        }

        const forwarded = message.type === "merge_forward" ? await this.forwarded(bot, message) : [];
        const options: IConvertOptions = {
            eventId: item.eventId,
            forwarded,
            labels: this.labels(),
        };
        if (message.parentId) {
            options.reference = await this.writer.findMessage(inbox, MSG_ID_ATTRIBUTE, message.parentId);
            options.quoted = await this.quoted(bot, message.parentId);
        }
        if (message.chatType === "group") {
            options.author = await this.members.name(bot, message.chatId, message.senderId);
        }
        if (forwarded.length > 0) {
            options.names = await this.names(bot, flattenForwarded(forwarded));
        }

        const { block } = await this.writer.appendToTemp(inbox, convertMessage(message, options));
        this.writer.remember(inbox, MSG_ID_ATTRIBUTE, message.id, block);
        if (binding.reply) {
            void this.reply(bot, message, block);
        }

        const messages = [message, ...flattenForwarded(forwarded)];
        if (downloadAssets && messages.some((item) => messageResources(item).length > 0)) {
            const assets = await this.media.save(bot, message.id, messages, block);
            if (assets.size > 0) {
                try {
                    await this.writer.updateBlock(block, convertMessage(message, { ...options, assets }));
                }
                catch (error) {
                    void this.siyuan.logger.warn(`[feishu] [inbox] put the media of the message ${message.id} into the block ${block} failed:`, errorMessage(error));
                }
            }
        }
        await this.writer.moveToDate(inbox, block, messageDate(message.createTime));
    }

    /* 合并转发中的子消息; 获取失败时只记录日志, 显示为占位文本 */
    private async forwarded(bot: IFeishuBot, message: IFeishuMessage): Promise<IForwardedMessage[]> {
        try {
            const items = await this.api.getMessage(bot.options, message.id);
            return forwardedTree(message.id, items.map(fromApi));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] [inbox] get the forwarded messages of ${message.id} failed:`, errorMessage(error));
            return [];
        }
    }

    /* 被回复的消息的纯文本; 获取失败时为空字符串 */
    private async quoted(bot: IFeishuBot, parentId: string): Promise<string> {
        try {
            const [parent] = await this.api.getMessage(bot.options, parentId);
            return parent ? messageText(fromApi(parent), this.labels()) : "";
        }
        catch (error) {
            void this.siyuan.logger.debug(`[feishu] [inbox] get the replied message ${parentId} failed:`, errorMessage(error));
            return "";
        }
    }

    /* 合并转发中发送者的名称: 在子消息原来所在的群中查找 */
    private async names(bot: IFeishuBot, messages: IFeishuMessage[]): Promise<Map<string, string>> {
        const names = new Map<string, string>();
        for (const message of messages) {
            if (!message.senderId.startsWith("ou_") || names.has(message.senderId)) {
                continue;
            }
            const name = await this.members.name(bot, message.chatId, message.senderId);
            if (name) {
                names.set(message.senderId, name);
            }
        }
        return names;
    }

    /* 回复消息超级块的块超链接, 失败时只记录日志 */
    private async reply(bot: IFeishuBot, message: IFeishuMessage, block: string): Promise<void> {
        try {
            const sent = await this.api.replyText(bot.options, message.id, `siyuan://blocks/${block}`);
            void this.siyuan.logger.debug(`[feishu] [inbox] replied to the message ${message.id} with the block ${block}, reply ${sent}`);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] [inbox] reply to the message ${message.id} with the block ${block} failed:`, errorMessage(error));
        }
    }

    private labels(): IFeishuMessageLabels {
        const labels = this.siyuan.plugin.i18n?.inbox as Partial<IFeishuMessageLabels> | undefined;
        return {
            quote: labels?.quote || "Quoted message",
            unavailable: labels?.unavailable || "[Message not available]",
            all: labels?.all || "all",
            calendar: labels?.calendar || "[Event]",
            card: labels?.card || "[Card]",
            chat: labels?.chat || "[Group card]",
            chatRecord: labels?.chatRecord || "[Chat history]",
            contact: labels?.contact || "[Contact]",
            file: labels?.file || "[File]",
            folder: labels?.folder || "[Folder]",
            image: labels?.image || "[Image]",
            location: labels?.location || "[Location]",
            poll: labels?.poll || "[Poll]",
            sticker: labels?.sticker || "[Sticker]",
            task: labels?.task || "[Task]",
            video: labels?.video || "[Video]",
            videoCall: labels?.videoCall || "[Video call]",
            voice: labels?.voice || "[Voice]",
        };
    }
}
