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

import type { IPayload } from "@/types/qq";

/* 事件日志目录, 相对插件数据目录 data/storage/petal/im-bot/ */
const EVENT_LOG_DIRECTORY = "logs/events";

/* 事件类型与事件 ID 来自网关, 只保留字母、数字、`_` 与 `-`, 其余字符替换为 `_`, 使文件不会写到日志目录之外 */
function sanitizeSegment(segment: string): string {
    return segment.replace(/[^\w-]/g, "_");
}

/**
 * 计算事件日志文件的路径
 * @param payload - 网关推送的事件 (op=0)
 * @returns `logs/events/<事件类型>/<事件 ID>.json`, 事件 ID 去掉了 `<事件类型>:` 前缀;
 * 没有事件类型或事件 ID 的事件 (READY、RESUMED) 返回 undefined
 */
export function eventLogPath(payload: IPayload): string | undefined {
    const type = payload.t;
    const prefix = `${type}:`;
    const id = payload.id?.startsWith(prefix)
        ? payload.id.slice(prefix.length)
        : payload.id;
    if (!type || !id) {
        return undefined;
    }
    return `${EVENT_LOG_DIRECTORY}/${sanitizeSegment(type)}/${sanitizeSegment(id)}.json`;
}
