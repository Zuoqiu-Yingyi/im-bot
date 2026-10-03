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
    codeBlock,
    escapeText,
    image,
    kbd,
    link,
    paragraph,
    richLink,
    superBlock,
    textWithLinks,
    underline,
    video,
} from "@/utils/kramdown";

import type {
    IApiMessage,
    IMessageReceiveEvent,
    IPostElement,
} from "@/types/feishu";

import type { TResourceType } from "./api";

/* 转换时使用的界面文本 */
export interface IFeishuMessageLabels {
    quote: string; // 被回复的消息没有文本时的锚文本
    unavailable: string; // 消息没有可显示的内容
    all: string; // @ 所有人中的「所有人」
    calendar: string; // 以下为各类内容的占位文本
    card: string;
    chat: string;
    chatRecord: string;
    contact: string;
    file: string;
    folder: string;
    image: string;
    location: string;
    poll: string;
    sticker: string;
    task: string;
    video: string;
    videoCall: string;
    voice: string;
}

/* 消息中的 @ */
export interface IFeishuMention {
    key: string; // 文本中的占位符, 如 @_user_1
    id: string; // 被 @ 的用户的 open_id; 服务端 API 返回的消息中, 被 @ 的机器人为 app_id
    name: string;
}

/* 接收消息事件与服务端 API 返回的消息的共同结构 */
export interface IFeishuMessage {
    id: string; // message_id, 形如 om_xxx, 全局唯一
    chatId: string;
    chatType?: string; // p2p 或 group; 服务端 API 返回的消息没有
    type: string; // message_type, 如 text、post、image
    content: string; // JSON 字符串
    mentions: IFeishuMention[];
    senderId: string; // 发送者的 open_id; 机器人为 app_id
    senderType: string; // user、bot 或 app
    createTime: number; // 毫秒时间戳
    parentId?: string; // 回复的消息
    upperId?: string; // 合并转发的子消息所属的合并转发消息
}

/* 合并转发中的一条子消息及其子消息 */
export interface IForwardedMessage {
    message: IFeishuMessage;
    children: IForwardedMessage[];
}

export type TMediaKind = "file" | "image" | "video" | "voice";

/* 消息中可以下载的资源文件 */
export interface IResourceRef {
    key: string; // image_key 或 file_key
    type: TResourceType;
    kind: TMediaKind;
    name?: string; // 文件名
}

export interface IConvertOptions {
    eventId?: string; // 推送该消息的事件 ID, 写入 custom-event-id
    reference?: string; // 被回复的消息所在的块 ID
    quoted?: string; // 被回复的消息的纯文本
    author?: string; // 发送者的名称, 显示在消息块的左上角, 只在群聊中使用
    names?: Map<string, string>; // open_id → 名称, 用于合并转发中的发送者
    forwarded?: IForwardedMessage[]; // 合并转发消息中的子消息
    assets?: Map<string, string>; // image_key 或 file_key → 资源文件路径
    labels: IFeishuMessageLabels;
}

/* 转换后的内容: 段落中的行内内容, 或不能放在段落中的块 (代码块、分割线、音频块、视频块与合并转发的子消息) */
type TContent = { block: string } | { inline: string };

/* 转换时的上下文 */
interface IContext {
    message: IFeishuMessage;
    options: IConvertOptions;
}

type TJson = Record<string, unknown>;

const ANCHOR_LENGTH = 32;
const MENTION = /@_user_\d+|@_all/g; // 文本中 @ 的占位符
const LINE_BREAK = /\r\n?|\n/;
const COMMAND = /^\/([a-z]\w*)(?=\s|$)/i;
const LEADING_MENTIONS = /^(?:\s*@_(?:user_\d+|all))+\s*/;
const MARKED_STYLES = new Set(["bold", "italic", "lineThrough"]); // 以定界符表示的样式, 紧挨着时要隔开

function isObject(value: unknown): value is TJson {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringOf(value: unknown): string {
    return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function elementsOf(value: unknown): IPostElement[] {
    return Array.isArray(value) ? value.filter(isObject) as unknown as IPostElement[] : [];
}

/* 消息内容的 JSON 对象; 不是 JSON 对象时为空对象 */
export function parseContent(message: IFeishuMessage): TJson {
    try {
        const content: unknown = JSON.parse(message.content);
        return isObject(content) ? content : {};
    }
    catch {
        return {};
    }
}

/* 接收消息事件中的消息 */
export function fromEvent(event: IMessageReceiveEvent): IFeishuMessage {
    const message = event.message;
    const sender = event.sender.sender_id;
    return {
        id: message.message_id,
        chatId: message.chat_id,
        chatType: message.chat_type,
        type: message.message_type,
        content: message.content,
        mentions: (message.mentions ?? []).map((mention) => ({
            key: mention.key,
            id: mention.id.open_id || mention.id.union_id || mention.id.user_id || "",
            name: mention.name,
        })),
        senderId: sender.open_id || sender.union_id || sender.user_id || "",
        senderType: event.sender.sender_type,
        createTime: Number(message.create_time),
        parentId: message.parent_id || undefined,
    };
}

/* 服务端 API 返回的消息 */
export function fromApi(message: IApiMessage): IFeishuMessage {
    return {
        id: message.message_id,
        chatId: message.chat_id,
        type: message.msg_type,
        content: message.body?.content ?? "",
        mentions: (message.mentions ?? []).map((mention) => ({ key: mention.key, id: mention.id, name: mention.name })),
        senderId: message.sender.id,
        senderType: message.sender.sender_type,
        createTime: Number(message.create_time),
        parentId: message.parent_id || undefined,
        upperId: message.upper_message_id || undefined,
    };
}

/**
 * 把获取合并转发消息时返回的子消息组织为树: 每条子消息的 upper_message_id 是它所属的合并转发消息
 * @param root - 合并转发消息的 ID
 * @param messages - 获取该消息时返回的全部消息, 其中包括它自己
 */
export function forwardedTree(root: string, messages: IFeishuMessage[]): IForwardedMessage[] {
    const children = (upper: string, depth: number): IForwardedMessage[] => {
        if (depth > 16) {
            return [];
        }
        return messages
            .filter((message) => message.upperId === upper && message.id !== upper)
            .map((message) => ({ message, children: children(message.id, depth + 1) }));
    };
    return children(root, 0);
}

/* 合并转发中的全部子消息, 包括嵌套的 */
export function flattenForwarded(items: IForwardedMessage[]): IFeishuMessage[] {
    return items.flatMap((item) => [item.message, ...flattenForwarded(item.children)]);
}

/**
 * 发给本机器人的指令: 文本消息去掉开头的提及后以 `/指令名` 开头; 群聊中还要提及本机器人
 * @param message - 接收消息事件中的消息
 * @param bot - 本机器人的 open_id
 * @returns 小写的指令名; 不是发给本机器人的指令时为 undefined
 */
export function commandOf(message: IFeishuMessage, bot: string): string | undefined {
    if (message.type !== "text") {
        return undefined;
    }
    if (message.chatType !== "p2p" && !message.mentions.some((mention) => mention.id === bot)) {
        return undefined;
    }
    const text = stringOf(parseContent(message).text).replace(LEADING_MENTIONS, "");
    return COMMAND.exec(text)?.[1]?.toLowerCase();
}

/* 消息是否写入收集箱: 系统消息 (如拉人进群的提示) 不写入 */
export function hasContent(message: IFeishuMessage): boolean {
    return message.type !== "system";
}

/* 富文本的标题与段落: 接收到的富文本没有按语言分组; 发送时的格式按语言分组, 取第一种语言 */
function postOf(content: TJson): { title: string; lines: IPostElement[][] } {
    const post = Array.isArray(content.content)
        ? content
        : Object.values(content).find((value): value is TJson => isObject(value) && Array.isArray(value.content));
    const lines = Array.isArray(post?.content) ? post.content.map(elementsOf) : [];
    return { title: stringOf(post?.title), lines };
}

/* 消息中可以下载的资源文件: 图片、文件、音频与视频, 以及富文本中的图片与视频; 文件夹与表情包不能下载 */
export function messageResources(message: IFeishuMessage): IResourceRef[] {
    const content = parseContent(message);
    const ref = (key: unknown, type: TResourceType, kind: TMediaKind, name?: unknown): IResourceRef[] => {
        const value = stringOf(key);
        return value ? [{ key: value, type, kind, name: stringOf(name) || undefined }] : [];
    };
    switch (message.type) {
        case "image":
            return ref(content.image_key, "image", "image");
        case "file":
            return ref(content.file_key, "file", "file", content.file_name);
        case "audio":
            return ref(content.file_key, "file", "voice");
        case "media":
            return ref(content.file_key, "file", "video", content.file_name);
        case "post":
            return postOf(content).lines.flat().flatMap((element) => {
                switch (element.tag) {
                    case "img":
                        return ref(element.image_key, "image", "image");
                    case "media":
                        return ref(element.file_key, "file", "video");
                    default:
                        return [];
                }
            });
        default:
            return [];
    }
}

/* 本地时区的 YYYY-MM-DD HH:mm; 时间无效时为空字符串 */
function formatTime(value: unknown): string {
    const time = Number(value);
    const date = new Date(time);
    if (!time || Number.isNaN(date.getTime())) {
        return "";
    }
    const pad = (n: number): string => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* 资源文件的文件名 */
function assetFileName(asset: string): string {
    return asset.replace(/^.*\//, "");
}

/* @ 的显示名称: 优先取 mentions 中的名称, 其次是元素中的名称 */
function mentionName(context: IContext, key: string, fallback = ""): string {
    const mention = context.message.mentions.find((item) => item.key === key);
    if (mention?.name) {
        return mention.name;
    }
    if (key === "@_all") {
        return context.options.labels.all;
    }
    return fallback || key.replace(/^@/, "");
}

/* 富文本或卡片中一个元素的纯文本 */
function elementText(context: IContext, element: IPostElement): string {
    const labels = context.options.labels;
    switch (element.tag) {
        case "at":
            return `@${mentionName(context, stringOf(element.user_id), stringOf(element.user_name))}`;
        case "img":
            return labels.image;
        case "media":
            return labels.video;
        case "emotion":
            return `[${stringOf(element.emoji_type)}]`;
        case "hr":
            return "";
        default:
            return [stringOf(element.text), ...elementsOf(element.elements).map((item) => elementText(context, item))].join("");
    }
}

/* 系统消息: 按模板填入其中的变量, 如 `{from_user} invited {to_chatters} to this chat.` */
function systemText(content: TJson): string {
    return stringOf(content.template).replace(/\{(\w+)\}/g, (_match, key: string) => {
        const value = content[key];
        if (Array.isArray(value)) {
            return value.map(stringOf).join(", ");
        }
        return isObject(value) ? stringOf(value.text) : stringOf(value);
    });
}

/* 整条消息的纯文本, 用于块引用的锚文本、被回复的内容与没有专门格式的消息 */
function plainOf(context: IContext): string {
    const { message, options: { labels } } = context;
    const content = parseContent(message);
    const join = (...parts: string[]): string => parts.map((part) => part.trim()).filter(Boolean).join(" ");
    switch (message.type) {
        case "text":
            return stringOf(content.text).replace(MENTION, (key) => `@${mentionName(context, key)}`);
        case "post": {
            const { title, lines } = postOf(content);
            return join(title, ...lines.map((line) => line.map((element) => elementText(context, element)).join("")));
        }
        case "image":
            return labels.image;
        case "file":
            return join(labels.file, stringOf(content.file_name));
        case "folder":
            return join(labels.folder, stringOf(content.file_name));
        case "audio":
            return labels.voice;
        case "media":
            return join(labels.video, stringOf(content.file_name));
        case "sticker":
            return labels.sticker;
        case "interactive":
            return join(labels.card, stringOf(content.title));
        case "share_chat":
            return join(labels.chat, stringOf(content.chat_id));
        case "share_user":
            return join(labels.contact, stringOf(content.user_id));
        case "location":
            return join(labels.location, stringOf(content.name));
        case "todo": {
            const summary = isObject(content.summary) ? plainOf({ ...context, message: { ...message, type: "post", content: JSON.stringify(content.summary) } }) : "";
            return join(labels.task, summary, formatTime(content.due_time));
        }
        case "vote":
            return [
                join(labels.poll, stringOf(content.topic)),
                ...(Array.isArray(content.options) ? content.options.map((option) => `- ${stringOf(option)}`) : []),
            ].join("\n");
        case "hongbao":
            return stringOf(content.text);
        case "share_calendar_event":
        case "calendar":
        case "general_calendar": {
            const start = formatTime(content.start_time);
            const end = formatTime(content.end_time);
            return join(labels.calendar, stringOf(content.summary), start && end ? `${start} – ${end}` : start);
        }
        case "video_chat":
            return join(labels.videoCall, stringOf(content.topic), formatTime(content.start_time));
        case "system":
            return systemText(content);
        case "merge_forward":
            return labels.chatRecord;
        default:
            return `[${message.type}]`;
    }
}

/**
 * 带样式的文本, 按原样显示: 粗体、斜体、删除线与下划线转为思源的样式。
 * 按行拆开并把首尾的空白放到定界符外: lute 会丢弃样式中的换行, 定界符旁边是空白时也不会解析为样式;
 * 下划线放在最内层: lute 会丢弃 <u> 中嵌套的标记
 * @param text - 文本, 可以有换行
 * @param style - 元素的 style: bold、italic、underline、lineThrough
 * @param linkify - 是否把其中的网址转为超链接, 在超链接中时为 false
 */
function styled(text: string, style: string[] | undefined, linkify: boolean): string {
    const styles = new Set(style ?? []);
    return text.split(LINE_BREAK).map((line) => {
        const core = line.trim();
        if (!core) {
            return line;
        }
        const head = /^\s*/.exec(line)![0];
        const tail = line.slice(head.length + core.length);
        let inner = styles.has("underline")
            ? underline(core)
            : linkify ? textWithLinks(core) : escapeText(core);
        if (styles.has("lineThrough")) {
            inner = `~~${inner}~~`;
        }
        if (styles.has("italic")) {
            inner = `*${inner}*`;
        }
        if (styles.has("bold")) {
            inner = `**${inner}**`;
        }
        return `${head}${inner}${tail}`;
    }).join("<br>");
}

/**
 * 富文本中一个段落的内容: 文本与超链接带样式, 提及转为显示名称的键盘元素, 图片已保存为资源文件时显示为图片,
 * 视频转为视频块, 表情显示为 [表情名], 分割线与代码块转为块; 块把前后的行内内容分为不同的段落
 */
function elementContents(context: IContext, elements: IPostElement[]): TContent[] {
    const { assets, labels } = context.options;
    const contents: TContent[] = [];
    let inline = "";
    let marked = false; // 上一段行内内容以样式的定界符结尾
    const pushInline = (text: string, isMarked = false): void => {
        if (!text) {
            return;
        }
        // 紧挨着的两段样式之间插入零宽空格, 否则相同的定界符会连在一起, 如 `**a****b**`
        inline += (marked && isMarked ? "\u200B" : "") + text;
        marked = isMarked;
    };
    const pushBlock = (block: string): void => {
        contents.push({ inline }, { block });
        inline = "";
        marked = false;
    };
    for (const element of elements) {
        const isMarked = (element.style ?? []).some((style) => MARKED_STYLES.has(style));
        switch (element.tag) {
            case "text":
                pushInline(styled(stringOf(element.text), element.style, true), isMarked);
                break;
            case "a": {
                const href = stringOf(element.href);
                const text = stringOf(element.text) || href;
                if (href) {
                    pushInline(richLink(styled(text, element.style, false), href));
                }
                else {
                    pushInline(styled(text, element.style, true), isMarked);
                }
                break;
            }
            case "at":
                pushInline(kbd(`@${mentionName(context, stringOf(element.user_id), stringOf(element.user_name))}`));
                break;
            case "img": {
                const asset = assets?.get(stringOf(element.image_key));
                pushInline(asset ? image(asset, labels.image) : escapeText(labels.image));
                break;
            }
            case "media": {
                const asset = assets?.get(stringOf(element.file_key));
                if (asset) {
                    pushBlock(video(asset));
                }
                else {
                    pushInline(escapeText(labels.video));
                }
                break;
            }
            case "emotion":
                pushInline(escapeText(`[${stringOf(element.emoji_type)}]`));
                break;
            case "hr":
                pushBlock("---");
                break;
            case "code_block": {
                const code = stringOf(element.text);
                if (code.trim()) {
                    pushBlock(codeBlock(code, stringOf(element.language).toLowerCase()));
                }
                break;
            }
            default:
                // md (只出现在 content_v2 中) 与卡片中的元素等: 显示其中的文本
                pushInline(escapeText(elementText(context, element)));
                break;
        }
    }
    contents.push({ inline });
    return contents.filter((content) => ("block" in content ? content.block : paragraph(content.inline)));
}

/* 文本消息: @ 的占位符转为键盘元素 @名称, 其余文本按原样显示, 其中的网址转为超链接 */
function textInline(context: IContext, text: string): string {
    let result = "";
    let last = 0;
    for (const match of text.matchAll(MENTION)) {
        result += textWithLinks(text.slice(last, match.index)) + kbd(`@${mentionName(context, match[0])}`);
        last = match.index + match[0].length;
    }
    return result + textWithLinks(text.slice(last));
}

/* 位置: 名称, 坐标链接到 OpenStreetMap */
function locationInline(content: TJson, labels: IFeishuMessageLabels): string {
    const latitude = stringOf(content.latitude).trim();
    const longitude = stringOf(content.longitude).trim();
    const parts = [escapeText(labels.location), escapeText(stringOf(content.name))];
    if (/^-?\d+(?:\.\d+)?$/.test(latitude) && /^-?\d+(?:\.\d+)?$/.test(longitude)) {
        parts.push(link(`${latitude}, ${longitude}`, `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`));
    }
    return parts.filter(Boolean).join(" ");
}

/**
 * 消息内容转为的块。图片、文件、音频与视频已保存为资源文件时分别转为图片、以文件名命名的超链接、音频块与视频块,
 * 否则显示为占位文本; 富文本转为带样式的段落; 合并转发中的每条子消息转为一个超级块, 嵌套的合并转发继续展开;
 * 卡片显示标题与其中的文本; 其余类型显示为占位文本与其中的主要信息
 */
function contentBlocks(context: IContext): string[] {
    const { message, options } = context;
    const { assets, labels } = options;
    const content = parseContent(message);
    const asset = (key: unknown): string | undefined => assets?.get(stringOf(key));
    let contents: TContent[];
    switch (message.type) {
        case "text":
            contents = [{ inline: textInline(context, stringOf(content.text)) }];
            break;
        case "post": {
            const { title, lines } = postOf(content);
            contents = title.trim() ? [{ inline: `**${escapeText(title.trim())}**` }] : [];
            for (const line of lines) {
                contents.push(...elementContents(context, line));
            }
            break;
        }
        case "image": {
            const path = asset(content.image_key);
            contents = [{ inline: path ? image(path, labels.image) : escapeText(plainOf(context)) }];
            break;
        }
        case "file": {
            const path = asset(content.file_key);
            contents = [{ inline: path ? `${escapeText(labels.file)} ${link(stringOf(content.file_name).trim() || assetFileName(path), path)}` : escapeText(plainOf(context)) }];
            break;
        }
        case "audio": {
            const path = asset(content.file_key);
            contents = [path ? { block: audio(path) } : { inline: escapeText(plainOf(context)) }];
            break;
        }
        case "media": {
            const path = asset(content.file_key);
            contents = [path ? { block: video(path) } : { inline: escapeText(plainOf(context)) }];
            break;
        }
        case "interactive":
            contents = [
                { inline: escapeText(plainOf(context)) },
                ...(Array.isArray(content.elements) ? content.elements : [])
                    .map((line) => elementsOf(line).map((element) => elementText(context, element)).join(""))
                    .map((text) => ({ inline: escapeText(text) })),
            ];
            break;
        case "location":
            contents = [{ inline: locationInline(content, labels) }];
            break;
        case "merge_forward": {
            const forwarded = options.forwarded ?? [];
            contents = forwarded.length > 0
                // eslint-disable-next-line ts/no-use-before-define
                ? forwarded.map((item) => ({ block: forwardedBlock(context, item) }))
                : [{ inline: escapeText(plainOf(context)) }];
            break;
        }
        default:
            contents = [{ inline: escapeText(plainOf(context)) }];
            break;
    }
    return contents
        .filter((item) => ("block" in item ? item.block : paragraph(item.inline)))
        .map((item) => ("block" in item ? item.block : paragraph(item.inline)));
}

/* 合并转发中的一条子消息: 超级块, 左上角显示发送者的名称 (知道时) */
function forwardedBlock(context: IContext, item: IForwardedMessage): string {
    const options: IConvertOptions = {
        ...context.options,
        eventId: undefined,
        reference: undefined,
        quoted: undefined,
        author: undefined,
        forwarded: item.children,
    };
    const blocks = contentBlocks({ message: item.message, options });
    return superBlock(blocks.length > 0 ? blocks : [escapeText(options.labels.unavailable)], {
        "custom-author-id": item.message.senderId,
        "custom-author-username": options.names?.get(item.message.senderId),
    });
}

/* 块引用的锚文本, 只能是纯文本 */
function anchorText(text: string): string {
    const plain = text.replace(/\s+/g, " ").trim();
    return plain.length > ANCHOR_LENGTH
        ? `${plain.slice(0, ANCHOR_LENGTH)}...`
        : plain;
}

/* 整条消息的纯文本, 用作块引用的锚文本与被回复的内容 */
export function messageText(message: IFeishuMessage, labels: IFeishuMessageLabels): string {
    return plainOf({ message, options: { labels } });
}

/**
 * 把一条消息转换为超级块, 块属性记录消息的元数据。
 * 回复的消息: 正文前是一个引述块, 能找到被回复消息所在的块时其中为指向该块的块引用 (动态锚文本), 否则为被回复的内容
 */
export function convertMessage(message: IFeishuMessage, options: IConvertOptions): string {
    const { labels, quoted = "", reference } = options;
    const blocks: string[] = [];
    if (message.parentId) {
        blocks.push(blockquote([
            reference
                ? blockRef(reference, anchorText(quoted) || labels.quote)
                : escapeText(quoted.trim() || labels.quote),
        ]));
    }
    blocks.push(...contentBlocks({ message, options }));
    return superBlock(blocks.length > 0 ? blocks : [escapeText(labels.unavailable)], {
        "custom-event-id": options.eventId,
        "custom-author-id": message.senderId,
        "custom-author-username": options.author,
        "custom-msg-id": message.id,
    });
}
