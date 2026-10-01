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

/**
 * 前端的 kernel.rpc.call 以 JsonRpcError 拒绝: message 为 JSON-RPC 的错误类型, data 为内核插件抛出的错误
 * @returns 错误码与错误类型一行, 内核插件抛出的错误另起一行
 */
export function formatRpcError(error: unknown): string {
    if (!(error instanceof Error)) {
        return String(error);
    }
    const { code, data } = error as Error & { code?: number; data?: unknown };
    const lines = [code === undefined ? String(error) : `${code} ${error.message}`];
    if (data !== undefined) {
        lines.push(typeof data === "string" ? data : JSON.stringify(data, undefined, 4));
    }
    return lines.join("\n");
}
