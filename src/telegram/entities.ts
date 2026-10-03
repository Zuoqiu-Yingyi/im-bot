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
    codeBlock,
    escapeText,
    inlineCode,
    inlineMemo,
    kbd,
    paragraph,
    richLink,
    textWithLinks,
    underline,
} from "@/utils/kramdown";

import type { IMessageEntity } from "@/types/telegram";

/* 转换后的内容: 段落中的行内内容, 或不能放在段落中的块 (引述块、代码块、音频块、视频块) */
export type TContent = { block: string } | { inline: string };

/* 实体覆盖的一段文本 */
interface INode {
    entity?: IMessageEntity; // 根节点 (整段文本) 没有
    start: number;
    end: number;
    last: boolean; // 实体按行拆开后的最后一段: 日期时间只附在这一段后面
    children: INode[];
}

interface IContext {
    underline: boolean; // 在下划线中: 文本放进 <u>, lute 会丢弃 <u> 中嵌套的其他标记
    link: boolean; // 在超链接中: 其中的网址不再转为超链接
}

const BLOCK_TYPES = new Set(["blockquote", "expandable_blockquote", "pre"]); // 在最外层时转为块
const STYLE_TYPES = new Set(["bold", "italic", "spoiler", "strikethrough", "underline"]);
const LINE_BREAK = /[\r\n]/;
const WHITESPACE = /\s/;
const URL_SCHEME = /^[a-z][\w+.-]*:\/\//i;

/* 范围相同的实体中, 块在最外层, 样式在其他实体之外: 代码与提及等实体中的内容按原样显示 */
function rank(entity: IMessageEntity | undefined): number {
    if (!entity || BLOCK_TYPES.has(entity.type)) {
        return 0;
    }
    return STYLE_TYPES.has(entity.type) ? 1 : 2;
}

/**
 * 实体覆盖的文本, 范围无效时为空。
 * 块以外的实体按行拆开: lute 会丢弃粗体、链接等标记中的换行;
 * 样式去掉首尾的空白: 定界符旁边是空白时 lute 不会解析为样式
 */
function pieces(text: string, entity: IMessageEntity): INode[] {
    const start = entity.offset;
    const end = entity.offset + entity.length;
    if (!(start >= 0 && end > start && end <= text.length)) {
        return [];
    }
    if (BLOCK_TYPES.has(entity.type)) {
        return [{ entity, start, end, last: true, children: [] }];
    }

    const result: INode[] = [];
    let from = start;
    for (let index = start; index <= end; index++) {
        if (index < end && !LINE_BREAK.test(text.charAt(index))) {
            continue;
        }
        let pieceStart = from;
        let pieceEnd = index;
        if (STYLE_TYPES.has(entity.type)) {
            while (pieceStart < pieceEnd && WHITESPACE.test(text.charAt(pieceStart))) {
                pieceStart++;
            }
            while (pieceEnd > pieceStart && WHITESPACE.test(text.charAt(pieceEnd - 1))) {
                pieceEnd--;
            }
        }
        if (pieceEnd > pieceStart) {
            result.push({ entity, start: pieceStart, end: pieceEnd, last: false, children: [] });
        }
        from = index + 1;
    }
    const lastPiece = result[result.length - 1];
    if (lastPiece) {
        lastPiece.last = true;
    }
    return result;
}

/* 按范围把实体组织为树: Bot API 约定实体只会互相包含, 部分重叠的实体截到外层实体的末尾 */
function buildTree(text: string, entities: IMessageEntity[]): INode {
    const nodes: INode[] = [];
    for (const entity of entities) {
        nodes.push(...pieces(text, entity));
    }
    nodes.sort((a, b) => a.start - b.start || b.end - a.end || rank(a.entity) - rank(b.entity));

    const root: INode = { start: 0, end: text.length, last: true, children: [] };
    const stack: INode[] = [root];
    for (const node of nodes) {
        while (stack.length > 1 && stack[stack.length - 1]!.end <= node.start) {
            stack.pop();
        }
        const parent = stack[stack.length - 1]!;
        node.end = Math.min(node.end, parent.end);
        if (node.end <= node.start) {
            continue;
        }
        parent.children.push(node);
        stack.push(node);
    }
    return root;
}

/* 日期时间实体的时间, 为 UTC 时间 (ISO 8601); 没有有效的时间时为空字符串 */
function isoTime(unixTime: number | undefined): string {
    const date = new Date((unixTime ?? Number.NaN) * 1000);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/* url 实体中的网址可能没有协议, 如 `example.com`, 与 Telegram 客户端一样按 http 打开 */
function urlHref(text: string): string {
    return URL_SCHEME.test(text) ? text : `http://${text}`;
}

/* 实体以外的文本: 按原样显示, 其中的网址转为超链接 (已在超链接中时除外); 在下划线中时放进 <u> */
function plain(text: string, context: IContext): string {
    const render = context.underline
        ? (value: string): string => (value ? underline(value) : "")
        : escapeText;
    return context.link ? render(text) : textWithLinks(text, render);
}

/* 节点中的行内内容 */
function renderInline(text: string, node: INode, context: IContext): string {
    // eslint-disable-next-line ts/no-use-before-define
    return renderChildren(text, node, context, false)
        .map((content) => ("inline" in content ? content.inline : ""))
        .join("");
}

/* 最外层的引用转为引述块, 代码块转为代码块; 没有内容时为空字符串 */
function renderBlock(text: string, node: INode, context: IContext): string {
    const entity = node.entity!;
    if (entity.type === "pre") {
        const code = text.slice(node.start, node.end);
        return code.trim() ? codeBlock(code, entity.language) : "";
    }
    const content = paragraph(renderInline(text, node, context));
    return content ? blockquote([content]) : "";
}

/* 一个实体的行内内容 */
function renderEntity(text: string, node: INode, context: IContext): string {
    const entity = node.entity!;
    const raw = text.slice(node.start, node.end);
    const inner = (next: IContext = context): string => renderInline(text, node, next);
    const linked = (url: string | undefined): string => (context.link || !url
        ? inner()
        : richLink(inner({ ...context, link: true }), url));
    switch (entity.type) {
        case "bold":
            return `**${inner()}**`;
        case "italic":
            return `*${inner()}*`;
        case "strikethrough":
            return `~~${inner()}~~`;
        case "spoiler":
            return `==${inner()}==`;
        case "underline":
            return inner({ ...context, underline: true });
        case "code":
        case "pre":
            return inlineCode(raw);
        case "mention":
        case "bot_command":
            return kbd(raw);
        case "text_mention":
            return kbd(`@<${raw}>`);
        case "text_link":
            return linked(entity.url);
        case "url":
            return linked(urlHref(raw));
        case "email":
            return linked(`mailto:${raw}`);
        case "phone_number":
            return linked(`tel:${raw.replace(/[^\d+]/g, "")}`);
        case "date_time": {
            // inline-memo 内不能嵌套其他标记, 取纯文本显示; 时间按行拆开后只附在最后一段
            const time = node.last ? isoTime(entity.unix_time) : "";
            return time ? inlineMemo(raw, time) : escapeText(raw);
        }
        default:
            // hashtag、cashtag、custom_emoji, 以及嵌套在其他实体中的引用: 显示其中的内容
            return inner();
    }
}

/**
 * 节点中的内容: 实体以外的文本与各个子实体。
 * 紧挨着的两个实体之间插入零宽空格, 否则相同的定界符会连在一起, 如 `**a****b**`
 * @param text - 整段文本
 * @param node - 要转换的节点
 * @param context - 外层实体的影响
 * @param top - 是否为整段文本: 是时其中的引用与代码块转为块, 把前后的行内内容分为不同的段落
 */
function renderChildren(text: string, node: INode, context: IContext, top: boolean): TContent[] {
    const contents: TContent[] = [];
    let inline = "";
    let last = node.start;
    let adjacent = false;
    for (const child of node.children) {
        if (child.start > last) {
            inline += plain(text.slice(last, child.start), context);
            adjacent = false;
        }
        if (top && BLOCK_TYPES.has(child.entity!.type)) {
            contents.push({ inline }, { block: renderBlock(text, child, context) });
            inline = "";
            adjacent = false;
        }
        else {
            inline += (adjacent ? "\u200B" : "") + renderEntity(text, child, context);
            adjacent = true;
        }
        last = child.end;
    }
    if (node.end > last) {
        inline += plain(text.slice(last, node.end), context);
    }
    contents.push({ inline });
    return contents.filter((content) => ("block" in content ? content.block : content.inline));
}

/**
 * 把消息的文本与其中的实体转换为思源的内容。
 * 粗体、斜体、下划线、删除线与剧透 (转为高亮) 转为对应的样式, 代码按原样显示;
 * 文字链接、网址、邮箱与电话号码转为超链接; 提及与指令转为键盘元素, 没有用户名的提及 (text_mention) 显示为 `@<名称>`;
 * 日期时间转为行级备注 (inline-memo), 备注内容为 UTC 时间; 最外层的引用转为引述块, 代码块 (pre) 转为代码块。
 * 实体以外的文本按原样显示, 其中的网址转为超链接
 * @param text - 消息的文本或说明
 * @param entities - 文本中的实体, offset 与 length 以 UTF-16 码元计, 与 JavaScript 字符串的下标一致
 */
export function convertText(text: string, entities: IMessageEntity[] | undefined): TContent[] {
    return renderChildren(text, buildTree(text, entities ?? []), { underline: false, link: false }, true);
}
