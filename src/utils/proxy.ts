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

/* 经思源内核转发到外网的请求: 内核插件的 siyuan.client 只能访问本机内核 */

import type * as kernel from "siyuan/kernel";

const PROXY_DIAL_TIMEOUT = 10_000; // /api/network/proxy 的 t 参数, 只限制连接目标的时长 (ms); 整个请求受 siyuan.client.fetch 的 1 分钟超时限制

/* 经内核转发的 HTTP 请求 */
export interface IProxyRequest {
    url: string;
    method: string;
    headers?: Record<string, string[]>; // 转发给目标的请求头
    json?: unknown; // JSON 请求体, undefined 表示没有请求体
}

/* 目标的响应 */
export interface IProxyResponse<T = string> {
    status: number;
    headers: Record<string, string>; // 目标的响应头
    body: T;
}

/* 内核把目标的响应头加上该前缀后转发 */
const FORWARDED_HEADER_PREFIX = "siyuan-proxy-";

export function parseJson<T>(text: string): T | undefined {
    try {
        return JSON.parse(text) as T;
    }
    catch {
        return undefined;
    }
}

/* /api/network/proxy 与 /ws/network/proxy 的 u、h 参数: 不带填充的 base64url */
export function encodeBase64Url(text: string): string {
    // eslint-disable-next-line node/prefer-global/buffer
    return Buffer.from(text, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/**
 * 把文本中内核转发地址的 u、h 参数值替换为 `***`。
 * siyuan.client.fetch 与 socket 失败 (如请求超时) 时, 错误信息带有完整的内核地址,
 * 其中 h 是 base64url 编码的请求头 (如 Authorization), u 是目标地址 (可能带有票据)
 */
export function redactProxyParams(text: string): string {
    return text.replace(/([?&][uh]=)[\w-]+/g, "$1***");
}

/* 把请求交给内核转发 */
function forward(siyuan: kernel.ISiyuan, request: IProxyRequest): Promise<kernel.IFetchResponse> {
    const headers = request.headers
        ? `&h=${encodeBase64Url(JSON.stringify(request.headers))}`
        : "";
    return siyuan.client.fetch(`/api/network/proxy?u=${encodeBase64Url(request.url)}&t=${PROXY_DIAL_TIMEOUT}ms${headers}`, request.json === undefined
        ? { method: request.method }
        : {
                method: request.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request.json),
            });
}

/**
 * 取出目标的响应头
 * @param request - 发给目标的请求
 * @param response - 内核的响应
 * @param text - 返回响应体的文本, 用于内核拒绝转发时的错误信息
 * @throws 响应不是 application/octet-stream, 即内核拒绝了转发
 */
function targetHeaders(request: IProxyRequest, response: kernel.IFetchResponse, text: () => string): Record<string, string> {
    const contentType: string | undefined = response.headers["Content-Type"];
    if (!contentType?.startsWith("application/octet-stream")) {
        const body = text();
        const failure = parseJson<{ msg?: string }>(body);
        throw new Error(`proxy ${request.method} ${request.url} failed: ${response.status} ${failure?.msg ?? body}`);
    }

    const forwarded: Record<string, string> = {};
    for (const [name, value] of Object.entries(response.headers)) {
        if (name.toLowerCase().startsWith(FORWARDED_HEADER_PREFIX)) {
            forwarded[name.slice(FORWARDED_HEADER_PREFIX.length)] = value;
        }
    }
    return forwarded;
}

/**
 * 经内核 /api/network/proxy 发出 HTTP 请求。
 * 内核把请求方法、请求体与 Content-Type 转发给 u 参数指定的目标, 其他请求头只能放在 h 参数中;
 * 目标的响应一律以 application/octet-stream 返回, 其他媒体类型是内核自身的拒绝 (参数错误、无法连接目标等)。
 * @param siyuan - 内核插件全局对象
 * @param request - 发给目标的请求
 * @returns 目标的响应, 任何状态码都会返回
 * @throws 内核拒绝转发或请求超时 (siyuan.client.fetch 的超时为 1 分钟)
 */
export async function proxyFetch(siyuan: kernel.ISiyuan, request: IProxyRequest): Promise<IProxyResponse> {
    const response = await forward(siyuan, request);
    const body = await response.text();
    return { status: response.status, headers: targetHeaders(request, response, () => body), body };
}

/**
 * 与 proxyFetch 相同, 但以二进制读取目标的响应体, 用于下载文件
 * @throws 内核拒绝转发或请求超时 (siyuan.client.fetch 的超时为 1 分钟)
 */
export async function proxyFetchBinary(siyuan: kernel.ISiyuan, request: IProxyRequest): Promise<IProxyResponse<ArrayBuffer>> {
    const response = await forward(siyuan, request);
    const body = await response.arrayBuffer();
    // eslint-disable-next-line node/prefer-global/buffer
    return { status: response.status, headers: targetHeaders(request, response, () => Buffer.from(body).toString("utf8")), body };
}
