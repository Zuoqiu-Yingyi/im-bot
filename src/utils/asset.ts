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

/* 在内核插件中把文件保存为思源资源文件 */

import type * as kernel from "siyuan/kernel";

/* /api/asset/upload 的结果, 一次只上传一个文件 */
interface IUploadResult {
    errFiles?: null | string[];
    succMap?: Record<string, string>; // 文件名 → 资源文件路径, 如 assets/image-20261002180426-c0v7nqj.jpg
}

/* multipart 中的文件名: 去掉引号、反斜杠、路径分隔符与控制字符; 思源会再过滤括号等符号, 并在扩展名前加上一个新生成的 ID */
function fileName(name: string): string {
    // eslint-disable-next-line no-control-regex
    return name.replace(/[\u0000-\u001F\u007F"\\/]/g, "_").trim() || "file";
}

/**
 * 调用 /api/asset/upload 上传一个文件。
 * siyuan.client.fetch 的请求体只能是字符串或 ArrayBuffer, 所以手动拼接 multipart/form-data。
 * 资源文件目录由 id 所在的文档与笔记本决定: 加密笔记本中的资源文件会被加密, 返回的路径带 ?box= 参数。
 * 内容与文件名都相同的资源文件已经存在时, 内核直接返回已有的路径。
 * @param siyuan - 内核插件全局对象
 * @param name - 文件名, 决定资源文件的名称与扩展名
 * @param data - 文件内容
 * @param id - 要插入资源文件的块 ID
 * @returns 资源文件路径, 如 assets/image-20261002180426-c0v7nqj.jpg
 * @throws 上传失败
 */
export async function uploadAsset(siyuan: kernel.ISiyuan, name: string, data: ArrayBuffer, id: string): Promise<string> {
    const boundary = `----siyuan-plugin-im-bot-${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    // eslint-disable-next-line node/prefer-global/buffer
    const head = Buffer.from([
        `--${boundary}`,
        `Content-Disposition: form-data; name="id"`,
        "",
        id,
        `--${boundary}`,
        `Content-Disposition: form-data; name="file[]"; filename="${fileName(name)}"`,
        "Content-Type: application/octet-stream",
        "",
        "",
    ].join("\r\n"), "utf8");
    // eslint-disable-next-line node/prefer-global/buffer
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, "utf8");

    const body = new Uint8Array(head.length + data.byteLength + tail.length);
    body.set(head, 0);
    body.set(new Uint8Array(data), head.length);
    body.set(tail, head.length + data.byteLength);

    const response = await siyuan.client.fetch("/api/asset/upload", {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body: body.buffer,
    });
    const result = await response.json() as { code: number; msg: string; data: IUploadResult | null };
    const path = result.code === 0 ? Object.values(result.data?.succMap ?? {})[0] : undefined;
    if (!path) {
        throw new Error(`/api/asset/upload failed: ${result.code} ${result.msg || result.data?.errFiles?.join(", ") || "no asset"}`);
    }
    return path;
}
