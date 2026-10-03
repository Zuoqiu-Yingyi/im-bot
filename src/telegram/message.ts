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
    audio,
    blockquote,
    blockRef,
    escapeText,
    image,
    link,
    paragraph,
    superBlock,
    textWithLinks,
    video,
} from "@/utils/kramdown";

import type {
    IFile,
    ILocation,
    IMessage,
    IMessageEntity,
    IVenue,
} from "@/types/telegram";

/* 转换时使用的界面文本 */
export interface ITelegramMessageLabels {
    quote: string; // 被回复的消息没有文本时的锚文本
    unavailable: string; // 消息没有可显示的内容
    animation: string; // 以下为各类内容的占位文本
    audio: string;
    contact: string;
    file: string;
    image: string;
    location: string;
    poll: string;
    sticker: string;
    video: string;
    voice: string;
}

export type TMediaKind = "animation" | "audio" | "file" | "image" | "sticker" | "video" | "voice";

/* 消息中的媒体, 每条消息最多一个 */
export interface IMedia {
    kind: TMediaKind;
    file: IFile;
    name?: string; // 文件的原名, 用作资源文件名
    title?: string; // 附在占位文本后的说明: 文件名、音频的标题或贴纸的表情
    isVideo?: boolean; // 视频贴纸 (.webm)
}

export interface IConvertOptions {
    reference?: string; // 被回复的消息所在的块 ID
    asset?: string; // 媒体的资源文件路径, 没有保存时媒体显示为占位文本
    showAuthor: boolean; // 是否记录发送者的名称 (显示在消息块的左上角), 群组与频道中开启
    labels: ITelegramMessageLabels;
}

/* 消息的一部分内容: 段落中的行内内容, 或不能放在段落中的块 (音频块、视频块) */
type TContent = { block: string } | { inline: string };

const ANCHOR_LENGTH = 32;
const LOCAL_PATH = /^(?:\/|[a-z]:[\\/])/i;

/* 消息在收集箱中的标识: message_id 只在同一个会话中唯一, 所以加上会话 ID */
export function messageKey(message: IMessage): string {
    return `${message.chat.id}:${message.message_id}`;
}

/* getFile 返回的是 Bot API 服务器上的本地路径: 以 --local 模式运行的服务器不提供下载 */
export function isLocalPath(path: string): boolean {
    return LOCAL_PATH.test(path);
}

/**
 * 发给本机器人的指令: 文本以 bot_command 实体开头, 指令中没有 `@用户名` 或者是本机器人的用户名
 * @param message - 消息
 * @param username - 本机器人的用户名
 * @returns 小写的指令名; 不是发给本机器人的指令时为 undefined
 */
export function commandOf(message: IMessage, username: string | undefined): string | undefined {
    const text = message.text;
    const entity = message.entities?.find((item) => item.type === "bot_command" && item.offset === 0);
    if (!text || !entity) {
        return undefined;
    }
    const [name = "", target] = text.slice(1, entity.length).split("@");
    if (target && target.toLowerCase() !== username?.toLowerCase()) {
        return undefined;
    }
    return name.toLowerCase();
}

/* 被回复的消息; 话题中的消息都把话题的创建消息作为 reply_to_message, 这不算回复 */
export function repliedMessage(message: IMessage): IMessage | undefined {
    const replied = message.reply_to_message;
    return replied && !replied.forum_topic_created ? replied : undefined;
}

/* 消息中的媒体: 动图同时带有 document, 所以先于文件判断; 动画贴纸 (.tgs) 无法显示, 不算媒体 */
export function messageMedia(message: IMessage): IMedia | undefined {
    if (message.photo?.length) {
        // 同一张图片的多个尺寸, 取像素最多的
        const photo = message.photo.reduce((largest, size) => size.width * size.height > largest.width * largest.height ? size : largest);
        return { kind: "image", file: photo };
    }
    if (message.animation) {
        return { kind: "animation", file: message.animation, name: message.animation.file_name };
    }
    if (message.video) {
        return { kind: "video", file: message.video, name: message.video.file_name };
    }
    if (message.video_note) {
        return { kind: "video", file: message.video_note };
    }
    if (message.voice) {
        return { kind: "voice", file: message.voice };
    }
    if (message.audio) {
        const item = message.audio;
        const title = [item.performer, item.title].filter(Boolean).join(" - ");
        return { kind: "audio", file: item, name: item.file_name, title: title || item.file_name };
    }
    if (message.sticker && !message.sticker.is_animated) {
        return { kind: "sticker", file: message.sticker, title: message.sticker.emoji, isVideo: message.sticker.is_video };
    }
    if (message.document) {
        return { kind: "file", file: message.document, name: message.document.file_name, title: message.document.file_name };
    }
    return undefined;
}

/* 消息是否有可以写入收集箱的内容; 成员变化、置顶等服务消息没有 */
export function hasContent(message: IMessage): boolean {
    return !!(message.text
        || message.caption
        || messageMedia(message)
        || message.sticker
        || message.location
        || message.contact
        || message.poll
        || message.dice);
}

/* 媒体的占位文本 */
function placeholder(media: IMedia, labels: ITelegramMessageLabels): string {
    return [labels[media.kind], media.title].filter(Boolean).join(" ");
}

/* 文本与说明以外的内容的纯文本: 媒体、位置、联系人等显示为占位文本 */
function contentText(message: IMessage, labels: ITelegramMessageLabels): string {
    const media = messageMedia(message);
    if (media) {
        return placeholder(media, labels);
    }
    if (message.sticker) {
        return [labels.sticker, message.sticker.emoji].filter(Boolean).join(" ");
    }
    if (message.venue) {
        return [labels.location, message.venue.title, message.venue.address].filter(Boolean).join(" ");
    }
    if (message.location) {
        return `${labels.location} ${message.location.latitude}, ${message.location.longitude}`;
    }
    if (message.contact) {
        const { first_name, last_name, phone_number } = message.contact;
        return [labels.contact, first_name, last_name, phone_number].filter(Boolean).join(" ");
    }
    if (message.poll) {
        return [
            `${labels.poll} ${message.poll.question}`,
            ...message.poll.options.map((option) => `- ${option.text}`),
        ].join("\n");
    }
    if (message.dice) {
        return `${message.dice.emoji} ${message.dice.value}`;
    }
    return "";
}

/* 整条消息的纯文本, 用作块引用的锚文本 */
export function messageText(message: IMessage, labels: ITelegramMessageLabels): string {
    return [contentText(message, labels), message.text ?? message.caption ?? ""]
        .map((text) => text.trim())
        .filter(Boolean)
        .join(" ");
}

/* 发送者的 ID 与名称: 以群组或频道的身份发言, 以及没有 from 的频道消息, 发送者是该群组或频道 */
function sender(message: IMessage): { id: number; name: string } {
    const user = message.from;
    if (user && !message.sender_chat) {
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
        return { id: user.id, name: name || user.username || String(user.id) };
    }
    const chat = message.sender_chat ?? message.chat;
    const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
    return { id: chat.id, name: message.author_signature || chat.title || name || chat.username || String(chat.id) };
}

/* 文本中的 text_link 实体转为超链接 (它的网址不在文本中), 其余文本中的网址也转为超链接 */
function inlineText(text: string, entities: IMessageEntity[] | undefined): string {
    const links = (entities ?? [])
        .filter((entity) => entity.type === "text_link" && entity.url)
        .sort((a, b) => a.offset - b.offset);
    let result = "";
    let last = 0;
    for (const entity of links) {
        if (entity.offset < last) {
            continue;
        }
        const end = entity.offset + entity.length;
        result += textWithLinks(text.slice(last, entity.offset)) + link(text.slice(entity.offset, end), entity.url!);
        last = end;
    }
    return result + textWithLinks(text.slice(last));
}

/* 位置: 地点的名称与地址, 坐标链接到 OpenStreetMap */
function locationContent(location: ILocation, labels: ITelegramMessageLabels, venue?: IVenue): string {
    const { latitude, longitude } = location;
    const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    const name = venue ? [venue.title, venue.address].filter(Boolean).join(" ") : "";
    return [escapeText(labels.location), escapeText(name), link(`${latitude}, ${longitude}`, url)].filter(Boolean).join(" ");
}

/**
 * 媒体的内容。已保存为资源文件时: 图片与静态贴纸转为图片, 视频、视频贴纸与动图 (MP4) 转为视频块,
 * 语音与音频转为音频块 (音频后附标题), 文件转为以文件名命名的超链接; 否则显示为占位文本
 */
function mediaContents(media: IMedia, asset: string | undefined, labels: ITelegramMessageLabels): TContent[] {
    if (!asset) {
        return [{ inline: escapeText(placeholder(media, labels)) }];
    }
    switch (media.kind) {
        case "image":
            return [{ inline: image(asset, labels.image) }];
        case "sticker":
            return [media.isVideo ? { block: video(asset) } : { inline: image(asset, media.title || labels.sticker) }];
        case "animation":
            return [/\.gif(?:\?|$)/i.test(asset) ? { inline: image(asset, labels.animation) } : { block: video(asset) }];
        case "video":
            return [{ block: video(asset) }];
        case "voice":
            return [{ block: audio(asset) }];
        case "audio":
            return [{ block: audio(asset) }, { inline: escapeText(media.title ?? "") }];
        case "file":
            return [{ inline: `${escapeText(labels.file)} ${link(media.name?.trim() || asset.replace(/^.*\//, ""), asset)}` }];
    }
}

/* 块引用的锚文本, 只能是纯文本 */
function anchorText(text: string): string {
    const plain = text.replace(/\s+/g, " ").trim();
    return plain.length > ANCHOR_LENGTH
        ? `${plain.slice(0, ANCHOR_LENGTH)}...`
        : plain;
}

/**
 * 把一条消息转换为超级块: 媒体或其他内容在前, 文本或说明在后, 各为一个段落或块; 块属性记录消息的元数据。
 * 文本按原样显示 (不保留粗体等格式), 网址与 text_link 转为超链接。
 * 回复的消息: 能找到被回复消息所在的块时在正文前加上块引用, 否则先用引述块显示被回复的内容;
 * 被回复的内容优先取回复时引用的部分 (quote), 没有时取被回复消息的纯文本
 */
export function convertMessage(message: IMessage, options: IConvertOptions): string {
    const { asset, labels, reference } = options;
    const contents: TContent[] = [];
    const media = messageMedia(message);
    if (media) {
        contents.push(...mediaContents(media, asset, labels));
    }
    else if (message.venue) {
        contents.push({ inline: locationContent(message.venue.location, labels, message.venue) });
    }
    else if (message.location) {
        contents.push({ inline: locationContent(message.location, labels) });
    }
    else {
        contents.push({ inline: escapeText(contentText(message, labels)) });
    }
    const text = message.text ?? message.caption;
    if (text) {
        contents.push({ inline: inlineText(text, message.text === undefined ? message.caption_entities : message.entities) });
    }
    const visible = contents.filter((content) => "block" in content || paragraph(content.inline));

    const blocks: string[] = [];
    const replied = repliedMessage(message);
    if (replied) {
        const quoted = message.quote?.text?.trim() || messageText(replied, labels);
        if (reference) {
            const anchor = anchorText(quoted) || labels.quote;
            const first = visible[0];
            if (first && "inline" in first) {
                first.inline = `${blockRef(reference, anchor)} ${first.inline}`;
            }
            else {
                visible.unshift({ inline: blockRef(reference, anchor) });
            }
        }
        else {
            blocks.push(blockquote([escapeText(quoted || labels.quote)]));
        }
    }
    blocks.push(...visible.map((content) => "block" in content ? content.block : paragraph(content.inline)));

    const author = sender(message);
    return superBlock(
        blocks.length > 0 ? blocks : [escapeText(labels.unavailable)],
        {
            "custom-author-id": String(author.id),
            "custom-author-username": options.showAuthor ? author.name : undefined,
            "custom-msg-id": messageKey(message),
        },
    );
}
