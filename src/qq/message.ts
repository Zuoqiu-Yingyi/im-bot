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
    kbd,
    link,
    paragraph,
    superBlock,
    trimUrl,
    video,
} from "@/utils/kramdown";

import { parseChatRecord } from "./chat-record";
import { MessageType } from "./constants";

import type { IAttachment, IGroupMessage, IMention, IMessage } from "@/types/qq";

import type { IChatRecordMessage } from "./chat-record";

/* 转换时使用的界面文本 */
export interface IMessageLabels {
    quote: string; // 被引用的消息没有文本时的锚文本
    unavailable: string; // 消息没有可显示的内容
}

export interface IConvertOptions {
    eventId: string; // 事件 ID, 写入 custom-event-id
    reference?: string; // 被引用的消息所在的块 ID, 仅用于引用消息
    labels: IMessageLabels;
}

export interface IConvertedMessage {
    kramdown: string; // 包裹整条消息的超级块
    media: number; // 图片、语音、视频与文件的数量
}

/* 附件的统一表示 */
interface IMedia {
    kind: "file" | "image" | "video" | "voice";
    url: string;
    name?: string;
    asr?: string; // 语音识别结果
}

interface IContext {
    labels: IMessageLabels;
    media: number;
}

/* content 中的标记: @ 全体成员、@ 成员、QQ 表情与网址 */
const TOKEN = /<@all>|<@!?(\w+)>|<faceType=\d+,faceId="[^"]*",ext="([^"]*)">|(https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+)/g;
const CHAT_RECORD_TITLE = /^\[.+的聊天记录\]$/;
const ANCHOR_LENGTH = 32;

/**
 * message_scene.ext 中 `key=value` 形式的值
 * @param message - 单聊或群聊消息
 * @param key - 如 `msg_idx` (本条消息的索引)、`ref_msg_idx` (被引用消息的索引)
 */
export function sceneValue(message: Pick<IMessage, "message_scene">, key: string): string | undefined {
    const prefix = `${key}=`;
    return message.message_scene?.ext?.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

/**
 * 群聊消息是否提及了本机器人。
 * GROUP_AT_MESSAGE_CREATE 就是提及机器人的消息, 其 content 已去掉提及机器人的前缀, mentions 也不含机器人;
 * GROUP_MESSAGE_CREATE 的 mentions 中机器人的一项带 is_you。
 * 提及全体成员的一项同样带 is_you (scope 为 all), 这样的消息即使同时提及了机器人也视为没有提及机器人:
 * GROUP_AT_MESSAGE_CREATE 看不出这样的消息是否另外提及了机器人, 而同一条消息的两种事件必须得到相同的结果
 * @param event - 事件类型, GROUP_AT_MESSAGE_CREATE 或 GROUP_MESSAGE_CREATE
 * @param message - 群聊消息
 */
export function mentionsBot(event: string, message: IGroupMessage): boolean {
    const mentions = message.mentions ?? [];
    if (mentions.some((mention) => mention.scope === "all") || (message.content ?? "").includes("<@all>")) {
        return false;
    }
    return event === "GROUP_AT_MESSAGE_CREATE" || mentions.some((mention) => mention.is_you === true);
}

/* 表情的 ext 为 base64 编码的 JSON, 如 `{"text":"暗中观察"}`; 超级表情 (图片) 的 text 为空 */
function faceText(ext: string): string {
    try {
        // eslint-disable-next-line node/prefer-global/buffer
        const data = JSON.parse(Buffer.from(ext, "base64").toString("utf8")) as { text?: string };
        return data.text
            ? `[${data.text}]`
            : "";
    }
    catch {
        return "";
    }
}

function mentionText(id: string | undefined, mentions: IMention[] | undefined): string {
    const mention = id
        ? mentions?.find((item) => item.id === id || item.member_openid === id)
        : mentions?.find((item) => item.scope === "all");
    return `@${mention?.username || id || "all"}`;
}

/**
 * 替换 content 中的标记
 * @param content - 消息内容
 * @param mentions - content 中提及的对象
 * @param text - 纯文本的输出方式
 * @param url - 网址的输出方式
 * @param mention - 被提及对象 (如 `@昵称`) 的输出方式
 */
function renderContent(
    content: string,
    mentions: IMention[] | undefined,
    text: (value: string) => string,
    url: (value: string) => string,
    mention: (value: string) => string,
): string {
    let result = "";
    let last = 0;
    TOKEN.lastIndex = 0;
    for (let match = TOKEN.exec(content); match; match = TOKEN.exec(content)) {
        const [token, id, ext, href] = match;
        result += text(content.slice(last, match.index));
        last = match.index + token.length;
        if (href) {
            const target = trimUrl(href);
            result += url(target) + text(href.slice(target.length));
        }
        else if (ext !== undefined) {
            result += text(faceText(ext));
        }
        else {
            result += mention(mentionText(id, mentions));
        }
    }
    return result + text(content.slice(last));
}

/* 段落中的行内内容: 文字按原样显示, 网址转为超链接, 被提及对象转为键盘元素 */
function inlineContent(content: string, mentions: IMention[] | undefined): string {
    return renderContent(content, mentions, escapeText, (href) => link(href, href), kbd);
}

/* 块引用的锚文本, 只能是纯文本 */
function anchorText(content: string, mentions: IMention[] | undefined): string {
    const plain = (value: string): string => value;
    const text = renderContent(content, mentions, plain, plain, plain).replace(/\s+/g, " ").trim();
    return text.length > ANCHOR_LENGTH
        ? `${text.slice(0, ANCHOR_LENGTH)}...`
        : text;
}

function toMedia(attachment: IAttachment): IMedia {
    const type = attachment.content_type;
    if (type.startsWith("image/")) {
        return { kind: "image", url: attachment.url, name: attachment.filename };
    }
    if (type.startsWith("video/")) {
        return { kind: "video", url: attachment.url, name: attachment.filename };
    }
    if (type === "voice") {
        // 原始语音 (amr、silk) 浏览器无法播放, 优先使用转换后的 WAV
        return { kind: "voice", url: attachment.voice_wav_url || attachment.url, name: attachment.filename, asr: attachment.asr_refer_text };
    }
    return { kind: "file", url: attachment.url, name: attachment.filename };
}

/**
 * 消息正文: 图片与文字合为一个段落 (网关不提供图片在文字中的位置, 图片放在最前),
 * 语音转为音频块与语音识别结果段落, 视频转为视频块, 其他附件转为文件超链接
 * @param context - 转换上下文, 累计附件数量
 * @param content - 消息内容
 * @param mentions - content 中提及的对象
 * @param media - 附件
 */
function convertBody(
    context: IContext,
    content: string,
    mentions: IMention[] | undefined,
    media: IMedia[],
): string[] {
    context.media += media.length;
    const images = media
        .filter((item) => item.kind === "image")
        .map((item) => image(item.url, item.name));
    const blocks = [paragraph(images.join("") + inlineContent(content, mentions))];
    for (const item of media) {
        switch (item.kind) {
            case "voice":
                blocks.push(audio(item.url));
                if (item.asr) {
                    blocks.push(paragraph(escapeText(item.asr)));
                }
                break;
            case "video":
                blocks.push(video(item.url));
                break;
            case "file":
                blocks.push(paragraph(link(item.name || item.url, item.url)));
                break;
        }
    }
    return blocks.filter(Boolean);
}

/**
 * 引用消息: 正文前是一个引述块, 能找到被引用消息所在的块时其中为指向该块的块引用 (动态锚文本),
 * 否则为被引用的内容
 */
function convertReference(context: IContext, message: IGroupMessage, reference: string | undefined): string[] {
    const refIdx = sceneValue(message, "ref_msg_idx");
    const quoted = message.msg_elements?.find((element) => element.msg_idx === refIdx) ?? message.msg_elements?.[0];
    const media = (message.attachments ?? []).map(toMedia);
    if (reference) {
        const anchor = anchorText(quoted?.content ?? "", message.mentions) || context.labels.quote;
        return [
            blockquote([blockRef(reference, anchor)]),
            ...convertBody(context, message.content.trim(), message.mentions, media),
        ];
    }

    const quote = quoted
        ? convertBody(context, quoted.content ?? "", message.mentions, (quoted.attachments ?? []).map(toMedia))
        : [];
    return [
        blockquote(quote.length > 0 ? quote : [escapeText(context.labels.quote)]),
        ...convertBody(context, message.content.trim(), message.mentions, media),
    ];
}

/* 聊天记录中的一条消息: 超级块, 嵌套的聊天记录与被引用的消息继续嵌套为超级块 */
function convertRecordMessage(context: IContext, record: IChatRecordMessage): string {
    const content = record.related.length > 0 && record.content.length === 1 && CHAT_RECORD_TITLE.test(record.content[0]!)
        ? "" // 转发的聊天记录的内容只是标题
        : record.content.join("\n");
    const media = record.attachments
        .filter((attachment) => attachment.url)
        .map((attachment): IMedia => ({
            kind: attachment.type === "图片"
                ? "image"
                : attachment.type === "视频"
                    ? "video"
                    : "file",
            url: attachment.url!,
            name: attachment.filename,
        }));
    const blocks = [
        ...convertBody(context, content, undefined, media),
        ...record.related.map((item) => convertRecordMessage(context, item)),
    ].filter(Boolean);
    return superBlock(
        blocks.length > 0 ? blocks : [escapeText(context.labels.unavailable)],
        { "custom-author-username": record.sender },
    );
}

/**
 * 把一条群消息转换为超级块, 块属性记录消息的元数据
 * @returns 超级块的 kramdown 与其中附件的数量
 */
export function convertMessage(message: IGroupMessage, options: IConvertOptions): IConvertedMessage {
    const context: IContext = { labels: options.labels, media: 0 };
    let blocks: string[];
    switch (message.message_type) {
        case MessageType.CHAT_RECORD: {
            const record = parseChatRecord(message.content);
            blocks = record
                ? record.map((item) => convertRecordMessage(context, item))
                : convertBody(context, message.content, message.mentions, (message.attachments ?? []).map(toMedia));
            break;
        }
        case MessageType.REFERENCE:
            blocks = convertReference(context, message, options.reference);
            break;
        default:
            blocks = convertBody(context, message.content, message.mentions, (message.attachments ?? []).map(toMedia));
            break;
    }

    const kramdown = superBlock(
        blocks.length > 0 ? blocks : [escapeText(options.labels.unavailable)],
        {
            "custom-event-id": options.eventId,
            "custom-author-id": message.author?.id,
            "custom-author-username": message.author?.username,
            "custom-msg-idx": sceneValue(message, "msg_idx"),
        },
    );
    return { kramdown, media: context.media };
}
