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
 * 其中 `"` 是因为链接后紧跟 `"` 时 lute 不会将其解析为链接;
 * 换行转为 `<br>`: 空行不会拆分段落, 行首的 `#`、`>` 等也不会被解析为块。
 */
export function escapeText(text: string): string {
    return text
        .replace(/[\\`*_{}[\]()#+\-.!|~=^$<>:&"]/g, "\\$&")
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

/**
 * 链接目标。
 * 不用尖括号形式: 尖括号形式的链接后紧跟空白时 lute 不会将其解析为链接。
 * 空白、`<`、`>` 与括号转为百分号编码: 不配对的括号会改变链接目标的范围, 反斜杠转义的括号会把反斜杠留在网址中。
 */
function destination(url: string): string {
    return url
        .replace(/[\s<>]/g, (char) => encodeURIComponent(char))
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29");
}

/* 行内图片; lute 会在替代文本中第一个反斜杠转义处截断, 所以替代文本不转义, 只去掉方括号、反斜杠与换行 */
export function image(url: string, title = ""): string {
    return `![${title.replace(/[[\]\\\r\n]/g, "")}](${destination(url)})`;
}

/* 超链接, 链接文本为已经转换的行内内容 */
export function richLink(content: string, url: string): string {
    return `[${content}](${destination(url)})`;
}

/* 超链接, 链接文本按原样显示 */
export function link(text: string, url: string): string {
    return richLink(escapeText(text), url);
}

const URL_TRAILING_PUNCTUATION = /[.,;:!?'*]+$/;
const URL_IN_TEXT = /https?:\/\/[\w\-.~:/?#[\]@!&'()*+,;=%$]+/g; // 文本中的网址

function count(text: string, char: string): number {
    return text.split(char).length - 1;
}

/* 网址末尾的标点与多出的右括号属于正文, 如 `(见 https://example.com/a)` 中的 `)` */
export function trimUrl(href: string): string {
    let url = href.replace(URL_TRAILING_PUNCTUATION, "");
    while (url.endsWith(")") && count(url, ")") > count(url, "(")) {
        url = url.slice(0, -1).replace(URL_TRAILING_PUNCTUATION, "");
    }
    return url;
}

/**
 * 纯文本按原样显示, 其中的网址转为超链接
 * @param text - 纯文本
 * @param render - 文本 (包括链接文本) 的转换方式, 默认按原样显示
 */
export function textWithLinks(text: string, render: (value: string) => string = escapeText): string {
    let result = "";
    let last = 0;
    for (const match of text.matchAll(URL_IN_TEXT)) {
        const url = trimUrl(match[0]);
        result += render(text.slice(last, match.index)) + richLink(render(url), url);
        last = match.index + url.length;
    }
    return result + render(text.slice(last));
}

const UNDERLINE_UNSAFE = /[*_~`#[\]$^]|==|\(\(|:[\w+-]+:/; // 在 <u> 中可能组成标记的字符

/**
 * 带下划线的纯文本, 按原样显示。
 * lute 会把 `<u>` 中的内容去掉转义后重新解析, 并丢弃其中的标记 (包括转义过的 `*x*`、`#t#`、`[l](u)` 等),
 * 所以下划线只能放在其他标记的最内层; 文本中有可能组成标记的字符时不加下划线, 以免丢失文字。
 * `&`、`<`、`>` 与反斜杠改用 HTML 实体: `\<` 等转义会被转义两次, 结尾的反斜杠会转义 `</u>` 的 `<`
 */
export function underline(text: string): string {
    if (UNDERLINE_UNSAFE.test(text)) {
        return escapeText(text);
    }
    const content = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\\/g, "&#92;");
    return `<u>${content}</u>`;
}

/* 行内代码: 定界符比代码中最长的连续反引号多一个; 代码以反引号开头或结尾, 或者首尾都是空格时两侧各加一个空格, 解析时会去掉 */
export function inlineCode(code: string): string {
    const longest = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
    const fence = "`".repeat(longest + 1);
    const padding = /^`|`$/.test(code) || (code.startsWith(" ") && code.endsWith(" ") && code.trim() !== "")
        ? " "
        : "";
    return `${fence}${padding}${code}${padding}${fence}`;
}

/**
 * 代码块: 围栏比代码中最长的连续反引号多一个。
 * 代码中只有 `}}}` 的一行会结束外层的超级块, 在 `}}}` 前插入零宽连接符 (U+200D)
 * @param code - 代码, 末尾的换行会被去掉
 * @param language - 代码的语言, 只保留字母、数字与 `#+.-_`
 */
export function codeBlock(code: string, language = ""): string {
    const longest = Math.max(2, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
    const fence = "`".repeat(longest + 1);
    const lines = code
        .replace(/\r\n?/g, "\n")
        .replace(/\n+$/, "")
        .split("\n")
        .map((line) => line.replace(/^\s*(?=\}\}\}\s*$)/, (indent) => `${indent}\u200D`));
    return [`${fence}${language.replace(/[^\w#+.-]/g, "")}`, ...lines, fence].join("\n");
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
 * 键盘 (kbd) 行内元素。
 * lute 按原样显示其中的内容: 反斜杠转义不生效 (遇到 `\<` 还会截断), 只需把 `&`、`<`、`>` 转为实体。
 */
export function kbd(text: string): string {
    const content = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<kbd>${content}</kbd>`;
}

/**
 * 行级备注 (inline-memo): 显示 text, 点击后弹出备注 content; text 按原样显示, 其中的 HTML 语法不生效。
 * `data-inline-memo-content` 属性值中的 `"` 必须转义, 否则整个标签都不会被解析为行级备注;
 * 其中的 `&`、`<`、`>` 会被解码还原, 所以也要转义。content 为空时整个标签会被丢弃, 因此不支持空备注
 */
export function inlineMemo(text: string, content: string): string {
    const escape = (value: string): string => value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<span data-type="inline-memo" data-inline-memo-content="${escape(content).replace(/"/g, "&quot;")}">${escape(text)}</span>`;
}

/**
 * 块引用, 锚文本为动态锚文本 (以单引号包裹): 被引用的块改变后, 思源按该块的内容更新锚文本。
 * 锚文本中的 `&`、`<`、`>`、`'` 与反斜杠改用 HTML 实体: lute 会去掉其中的 HTML 标签,
 * `'` 会提前结束锚文本, 结尾的反斜杠会让结束锚文本的 `'` 被当作转义字符
 * @param id - 被引用的块 ID
 * @param anchor - 锚文本, 不能为空: 没有锚文本时思源会把块 ID 作为锚文本
 */
export function blockRef(id: string, anchor: string): string {
    const text = anchor
        .replace(/\s+/g, " ")
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#39;")
        .replace(/\\/g, "&#92;");
    return `((${id} '${text}'))`;
}
