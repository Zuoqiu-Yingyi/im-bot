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

/* 聊天记录中的一条消息 */
export interface IChatRecordMessage {
    sender?: string; // [发送者]
    type?: string; // [消息类型], 如 合并转发消息、引用消息
    content: string[]; // [消息内容] 及其续行
    attachments: IChatRecordAttachment[]; // [附件N]
    related: IChatRecordMessage[]; // [关联消息]: 转发的聊天记录或被引用的消息
}

/* 聊天记录中的附件, 如 `类型:图片 文件名:a.jpg 尺寸:811x922 大小:78.8KB URL:https://...` */
export interface IChatRecordAttachment {
    type?: string;
    filename?: string;
    url?: string;
}

/* 正在解析的消息及其字段行的缩进 */
interface IFrame {
    message: IChatRecordMessage;
    indent: number;
}

const TITLE = /^\[.+\]$/; // 首行标题, 如 [群聊的聊天记录]
const MESSAGE_HEADER = /^=== 消息 \d+ ===$/;
const RELATED_HEADER = /^--- 第\d+条 ---$/;
const FIELD = /^\[(消息内容|发送者|消息类型|关联消息|附件\d+)\] ?(.*)$/;
const RELATED_INDENT = 4; // 关联消息的字段行比 `--- 第N条 ---` 多缩进 4 个空格

function newMessage(): IChatRecordMessage {
    return {
        content: [],
        attachments: [],
        related: [],
    };
}

/* 从栈顶开始查找字段行缩进为 indent 的消息 */
function findFrame(stack: IFrame[], indent: number): number {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.indent === indent) {
            return i;
        }
    }
    return -1;
}

function parseAttachment(value: string): IChatRecordAttachment {
    return {
        type: /(?:^| )类型:(\S+)/.exec(value)?.[1],
        filename: /(?:^| )文件名:(\S+)/.exec(value)?.[1],
        url: /(?:^| )URL:(\S+)/.exec(value)?.[1],
    };
}

/**
 * 解析聊天记录 (message_type 102) 的 content: 网关只提供这段文本, 没有结构化数据。
 * 首行为标题, 每条消息以 `=== 消息 N ===` 开头, 字段行形如 `[发送者] 星辰`;
 * `[关联消息]` 之后是以 `--- 第N条 ---` 开头的嵌套消息, 其字段行多缩进 4 个空格。
 * @returns 顶层消息列表; 格式不符时返回 undefined
 */
export function parseChatRecord(content: string): IChatRecordMessage[] | undefined {
    const lines = content.replace(/\r\n?/g, "\n").split("\n");
    const first = lines.findIndex((line) => line.trim() !== "");
    if (first < 0 || !TITLE.test(lines[first]!.trim())) {
        return undefined;
    }

    const roots: IChatRecordMessage[] = [];
    let stack: IFrame[] = [];
    let continuation: IFrame | undefined; // 可以追加续行的 [消息内容]

    for (const line of lines.slice(first + 1)) {
        const text = line.trim();
        if (!text) {
            continue;
        }
        const indent = line.length - line.trimStart().length;

        if (indent === 0 && MESSAGE_HEADER.test(text)) {
            const message = newMessage();
            roots.push(message);
            stack = [{ message, indent: 0 }];
            continuation = undefined;
            continue;
        }

        if (RELATED_HEADER.test(text)) {
            const parent = findFrame(stack, indent);
            if (parent < 0) {
                return undefined;
            }
            const message = newMessage();
            stack[parent]!.message.related.push(message);
            stack = [...stack.slice(0, parent + 1), { message, indent: indent + RELATED_INDENT }];
            continuation = undefined;
            continue;
        }

        const field = FIELD.exec(text);
        if (field) {
            const index = findFrame(stack, indent);
            if (index < 0) {
                return undefined;
            }
            stack = stack.slice(0, index + 1);
            const frame = stack[index]!;
            const [, name, value = ""] = field;
            continuation = undefined;
            switch (name) {
                case "消息内容":
                    frame.message.content.push(value);
                    continuation = frame;
                    break;
                case "发送者":
                    frame.message.sender = value;
                    break;
                case "消息类型":
                    frame.message.type = value;
                    break;
                case "关联消息":
                    break;
                default:
                    frame.message.attachments.push(parseAttachment(value));
                    break;
            }
            continue;
        }

        /* [消息内容] 的续行 */
        if (!continuation || indent < continuation.indent) {
            return undefined;
        }
        continuation.message.content.push(line.slice(continuation.indent));
    }
    return roots.length > 0
        ? roots
        : undefined;
}
