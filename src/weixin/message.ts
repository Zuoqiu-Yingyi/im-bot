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

import {
    blockquote,
    blockRef,
    escapeText,
    paragraph,
    superBlock,
    textWithLinks,
} from "@/utils/kramdown";

import { MessageItemType } from "./constants";

import type { IMessageItem, IWeixinMessage } from "@/types/weixin";

/* 转换时使用的界面文本 */
export interface IWeixinMessageLabels {
    quote: string; // 被引用的消息没有文本时的锚文本
    unavailable: string; // 消息没有可显示的内容
    image: string; // 图片的占位文本
    voice: string; // 语音的占位文本, 后面接语音转文字
    file: string; // 文件的占位文本, 后面接文件名
    video: string; // 视频的占位文本
}

export interface IConvertOptions {
    reference?: string; // 被引用的消息所在的块 ID
    referenceText?: string; // 被引用的消息所在块的纯文本, 消息没有带上被引用的内容时用作块引用的锚文本
    labels: IWeixinMessageLabels;
}

const ANCHOR_LENGTH = 32;

/* 消息 ID: message_id, 没有时取第一个带 msg_id 的消息项, 与官方客户端相同 */
export function messageId(message: IWeixinMessage): string | undefined {
    return message.message_id?.trim()
        || message.item_list?.map((item) => item.msg_id?.trim()).find(Boolean)
        || undefined;
}

/* 带引用的消息项 */
function referenceItem(message: IWeixinMessage): IMessageItem | undefined {
    return message.item_list?.find((item) => item.ref_msg);
}

/* 被引用消息的 ID: svr_id, 没有时取被引用的消息项的 msg_id, 与官方客户端相同 */
export function referenceId(message: IWeixinMessage): string | undefined {
    const reference = referenceItem(message)?.ref_msg;
    return reference?.svr_id?.trim()
        || reference?.message_item?.msg_id?.trim()
        || undefined;
}

/* 消息项的纯文本; 暂不下载媒体, 图片、语音、文件与视频显示为占位文本 */
function plainText(item: IMessageItem, labels: IWeixinMessageLabels): string {
    switch (item.type) {
        case MessageItemType.TEXT:
            return item.text_item?.text ?? "";
        case MessageItemType.VOICE:
            return [labels.voice, item.voice_item?.text].filter(Boolean).join(" ");
        case MessageItemType.IMAGE:
            return labels.image;
        case MessageItemType.FILE:
            return [labels.file, item.file_item?.file_name].filter(Boolean).join(" ");
        case MessageItemType.VIDEO:
            return labels.video;
        default:
            // 工具调用进度 (11、12) 等只出现在机器人的消息中
            return "";
    }
}

/* 整条消息的纯文本, 各消息项以空格分隔 */
export function messageText(message: IWeixinMessage, labels: IWeixinMessageLabels): string {
    return (message.item_list ?? [])
        .map((item) => plainText(item, labels).trim())
        .filter(Boolean)
        .join(" ");
}

/* 消息项的行内内容: 文本中的网址转为超链接, 其余文字按原样显示 */
function inlineContent(item: IMessageItem, labels: IWeixinMessageLabels): string {
    return item.type === MessageItemType.TEXT
        ? textWithLinks(item.text_item?.text ?? "")
        : escapeText(plainText(item, labels));
}

/**
 * 消息中带的被引用的文本: 摘要与被引用的消息项, 与官方客户端相同。
 * 2026-10 的微信实测只给被引用消息的 ID (message_item 的 type 为 0, 没有文本), 这时为空字符串
 */
function quotedText(message: IWeixinMessage, labels: IWeixinMessageLabels): string {
    const reference = referenceItem(message)?.ref_msg;
    return [
        reference?.title?.trim(),
        reference?.message_item ? plainText(reference.message_item, labels).trim() : "",
    ].filter(Boolean).join(" | ");
}

/* 块引用的锚文本, 只能是纯文本 */
function anchorText(text: string): string {
    const plain = text.replace(/\s+/g, " ").trim();
    return plain.length > ANCHOR_LENGTH
        ? `${plain.slice(0, ANCHOR_LENGTH)}...`
        : plain;
}

/**
 * 把一条微信消息转换为超级块, 每个消息项为一个段落, 块属性记录消息的元数据。
 * 引用消息: 能找到被引用消息所在的块时在正文前加上块引用, 否则先用引述块显示被引用的内容。
 * 块引用的锚文本优先取消息中带的被引用的文本, 没有时取被引用的块的文本
 */
export function convertMessage(message: IWeixinMessage, options: IConvertOptions): string {
    const { labels, reference, referenceText } = options;
    const blocks: string[] = [];
    const contents = (message.item_list ?? [])
        .map((item) => inlineContent(item, labels))
        .filter((content) => paragraph(content));

    if (referenceItem(message)) {
        const quoted = quotedText(message, labels);
        if (reference) {
            const anchor = anchorText(quoted) || anchorText(referenceText ?? "") || labels.quote;
            contents[0] = `${blockRef(reference, anchor)} ${contents[0] ?? ""}`;
        }
        else {
            blocks.push(blockquote([escapeText(quoted || labels.quote)]));
        }
    }
    blocks.push(...contents.map(paragraph));

    return superBlock(
        blocks.length > 0 ? blocks : [escapeText(labels.unavailable)],
        {
            "custom-author-id": message.from_user_id,
            "custom-msg-id": messageId(message),
        },
    );
}
