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

import { MessageType } from "./constants";
import { convertMessage, messageId, messageText, referenceId } from "./message";

import type * as kernel from "siyuan/kernel";

import type { IWeixinBotConfig, IWeixinInboxConfig } from "@/types/config";
import type { IWeixinAccount, IWeixinMessage } from "@/types/weixin";
import type { InboxWriter } from "@/utils/inbox";

import type { WeixinApi } from "./api";
import type { WeixinMedia } from "./media";
import type { IConvertOptions, IWeixinMessageLabels } from "./message";

const MSG_ID_ATTRIBUTE = "custom-msg-id"; // 消息块中记录消息 ID 的属性, 用于去重与引用
const RECENT_TEXTS = 1024; // 在内存中记住文本的最近消息数, 数据库索引新块约有 3 秒延迟
const ASSET_PATH = /(?:^|\s)assets\/\S*?\d{14}-[0-9a-z]{7}\S*/g; // 资源文件路径, 上传时内核会在文件名末尾加上与块 ID 格式相同的新 ID

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 去掉文本中的资源文件路径: 数据库中块的文本包含图片与超链接的地址 */
function withoutAssetPaths(text: string): string {
    return text.replace(ASSET_PATH, " ").replace(/\s+/g, " ").trim();
}

/**
 * 把微信用户发给机器人的消息写入收集箱文档, 文档的写入由与 QQ 共用的 InboxWriter 完成。
 * 消息先以占位文本显示媒体并插入 .temp; 开启回复时随即回复其超级块的块超链接 (siyuan://blocks/ 加块 ID),
 * 这时 context_token 最新, 回复额度也最充足。开启下载资源文件时, 再把保存为资源文件的媒体替换进超级块,
 * 最后移动到日期文档。
 * Writes the messages that WeChat users send to the bot into the inbox
 * document with the InboxWriter shared with QQ, and replaces the media
 * placeholders with the media saved as assets.
 */
export class WeixinInbox {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: WeixinApi;
    private readonly writer: InboxWriter;
    private readonly media: WeixinMedia;
    private readonly config: () => IWeixinBotConfig;

    private readonly texts = new Map<string, string>(); // 最近写入的消息块 ID → 消息的纯文本, 用作引用它时的锚文本

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 发送回复的微信接口客户端
     * @param writer - 写入收集箱文档, 与 QQ 共用
     * @param media - 下载并保存消息中的媒体
     * @param config - 返回当前的微信机器人配置
     */
    constructor(siyuan: kernel.ISiyuan, api: WeixinApi, writer: InboxWriter, media: WeixinMedia, config: () => IWeixinBotConfig) {
        this.siyuan = siyuan;
        this.api = api;
        this.writer = writer;
        this.media = media;
        this.config = config;
    }

    /* 处理收到的消息, 只写入用户发送的消息, 不写入机器人自己发出的消息 */
    public handle(account: IWeixinAccount, message: IWeixinMessage): void {
        if (message.message_type !== MessageType.USER) {
            return;
        }
        const config = { ...this.config().inbox };
        if (!config.enabled || !config.doc) {
            return;
        }

        this.writer.enqueue(async () => {
            try {
                await this.write(account, config, message);
            }
            catch (error) {
                void this.siyuan.logger.warn(`[weixin] [inbox] write the message ${messageId(message)} to ${config.doc} failed:`, errorMessage(error));
            }
        });
    }

    private async write(account: IWeixinAccount, config: IWeixinInboxConfig, message: IWeixinMessage): Promise<void> {
        const inbox = config.doc;
        await this.writer.prepare(inbox);

        const id = messageId(message);
        if (id && await this.writer.findMessage(inbox, MSG_ID_ATTRIBUTE, id)) {
            // 游标没有保存成功或停止轮询时丢弃的消息会再次收到
            void this.siyuan.logger.debug(`[weixin] [inbox] the message ${id} is already in ${inbox}, skip it`);
            return;
        }

        const labels = this.labels();
        const refId = referenceId(message);
        const reference = refId ? await this.writer.findMessage(inbox, MSG_ID_ATTRIBUTE, refId) : undefined;
        const options: IConvertOptions = {
            reference,
            // 微信只给被引用消息的 ID, 锚文本取自收集箱中的那条消息
            referenceText: reference ? this.texts.get(reference) ?? withoutAssetPaths(await this.writer.blockText(reference)) : undefined,
            labels,
        };
        const { block } = await this.writer.appendToTemp(inbox, convertMessage(message, options));
        if (id) {
            this.writer.remember(inbox, MSG_ID_ATTRIBUTE, id, block);
        }
        this.texts.set(block, messageText(message, labels));
        if (this.texts.size > RECENT_TEXTS) {
            this.texts.delete(this.texts.keys().next().value!);
        }
        if (config.reply) {
            void this.reply(account, message, block);
        }
        if (config.downloadAssets) {
            await this.saveMedia(message, block, options);
        }
        await this.writer.moveToDate(inbox, block, messageDate(message.create_time_ms));
    }

    /* 保存消息中的媒体, 再用资源文件替换超级块中的占位文本; 失败时只记录日志, 保留占位文本 */
    private async saveMedia(message: IWeixinMessage, block: string, options: IConvertOptions): Promise<void> {
        const assets = await this.media.save(message, block);
        if (assets.length === 0) {
            return;
        }
        try {
            await this.writer.updateBlock(block, convertMessage(message, { ...options, assets }));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] [inbox] put the media of the message ${messageId(message)} into the block ${block} failed:`, errorMessage(error));
        }
    }

    /* 回复消息超级块的块超链接, 失败时只记录日志 */
    private async reply(account: IWeixinAccount, message: IWeixinMessage, block: string): Promise<void> {
        const to = message.from_user_id;
        if (!to) {
            return;
        }
        try {
            const id = await this.api.sendText(account, to, `siyuan://blocks/${block}`, message.context_token);
            if (id) {
                void this.siyuan.logger.debug(`[weixin] [inbox] replied to the message ${messageId(message)} with the block ${block}, reply ${id}`);
            }
            else {
                void this.siyuan.logger.warn(`[weixin] [inbox] the reply to the message ${messageId(message)} returned no message ID, it may not be delivered`);
            }
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] [inbox] reply to the message ${messageId(message)} with the block ${block} failed:`, errorMessage(error));
        }
    }

    private labels(): IWeixinMessageLabels {
        const labels = this.siyuan.plugin.i18n?.inbox as Partial<IWeixinMessageLabels> | undefined;
        return {
            quote: labels?.quote || "Quoted message",
            unavailable: labels?.unavailable || "[Message not available]",
            image: labels?.image || "[Image]",
            voice: labels?.voice || "[Voice]",
            file: labels?.file || "[File]",
            video: labels?.video || "[Video]",
        };
    }
}
