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

/* 生成思源 kramdown 的工具函数, 结果用于 /api/block/appendBlock 的 markdown 数据 */

export type TAttributes = Record<string, string | undefined>;

/**
 * 转义纯文本, 使其按原样显示在一个段落中。
 * 转义所有有语法含义的 ASCII 标点 (包括思源扩展的标签、表情、块引用等语法),
 * 换行转为 `<br>`: 空行不会拆分段落, 行首的 `#`、`>` 等也不会被解析为块。
 */
export function escapeText(text: string): string {
    return text
        .replace(/[\\`*_{}[\]()#+\-.!|~=^$<>:&]/g, "\\$&")
        .replace(/\r\n?|\n/g, "<br>");
}

/* 转义块属性值, 与 lute 的 html.EscapeAttrVal 一致 */
export function escapeAttributeValue(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/\r\n?|\n/g, "_esc_newline_")
        .replace(/\{/g, "&#123;")
        .replace(/\}/g, "&#125;");
}

/* 块属性 IAL, 省略值为空的属性 */
export function ial(attributes: TAttributes): string {
    const pairs = Object.entries(attributes)
        .filter((entry): entry is [string, string] => !!entry[1])
        .map(([name, value]) => `${name}="${escapeAttributeValue(value)}"`);
    return pairs.length > 0
        ? `{: ${pairs.join(" ")}}`
        : "";
}

/**
 * 纵向排列的超级块
 * @param children - 子块的 kramdown, 空字符串会被忽略
 * @returns 没有子块时返回空字符串: 思源会丢弃空的超级块
 */
export function superBlock(children: string[], attributes: TAttributes = {}): string {
    const blocks = children.filter(Boolean);
    if (blocks.length === 0) {
        return "";
    }
    return [
        "{{{row",
        blocks.join("\n\n"),
        "}}}",
        ial(attributes),
    ].filter(Boolean).join("\n");
}

/* 段落块, 去掉首尾的空白与换行; 内容为空时返回空字符串 */
export function paragraph(inline: string): string {
    return inline.replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, "");
}

/* 引述块 */
export function blockquote(children: string[]): string {
    return children
        .filter(Boolean)
        .join("\n\n")
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
}

/* 尖括号形式的链接目标, 可以包含括号 */
function destination(url: string): string {
    return `<${url.replace(/[<>\s]/g, (char) => encodeURIComponent(char))}>`;
}

/* 行内图片; lute 会在替代文本中第一个反斜杠转义处截断, 所以替代文本不转义, 只去掉方括号、反斜杠与换行 */
export function image(url: string, title = ""): string {
    return `![${title.replace(/[[\]\\\r\n]/g, "")}](${destination(url)})`;
}

/* 超链接 */
export function link(text: string, url: string): string {
    return `[${escapeText(text)}](${destination(url)})`;
}

/* 音频块 */
export function audio(url: string): string {
    return `<audio controls="controls" src="${url.replace(/"/g, "%22")}"></audio>`;
}

/* 视频块 */
export function video(url: string): string {
    return `<video controls="controls" src="${url.replace(/"/g, "%22")}"></video>`;
}

/**
 * 块引用, 锚文本为静态文本
 * @param id - 被引用的块 ID
 * @param anchor - 锚文本, 不能为空: 没有锚文本时思源会把块 ID 作为锚文本
 */
export function blockRef(id: string, anchor: string): string {
    return `((${id} "${anchor.replace(/"/g, "'").replace(/\s+/g, " ").trim()}"))`;
}
