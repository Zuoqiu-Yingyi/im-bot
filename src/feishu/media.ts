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

import { uploadAsset } from "@/utils/asset";

import { MEDIA_MAX_BYTES } from "./constants";
import { messageResources } from "./message";

import type * as kernel from "siyuan/kernel";

import type { FeishuApi } from "./api";
import type { IFeishuBot } from "./gateway";
import type { IFeishuMessage, IResourceRef, TMediaKind } from "./message";

/* Content-Type 对应的扩展名 */
const EXTENSIONS: Record<string, string> = {
    "application/pdf": ".pdf",
    "audio/aac": ".aac",
    "audio/amr": ".amr",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/opus": ".opus",
    "audio/wav": ".wav",
    "image/bmp": ".bmp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
};

/* 不知道扩展名时使用的扩展名: 飞书的语音消息是 Opus 编码 */
const DEFAULT_EXTENSIONS: Record<TMediaKind, string> = {
    file: "",
    image: ".jpg",
    video: ".mp4",
    voice: ".opus",
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 资源文件名: 优先使用文件的原名, 否则为媒体类型加上扩展名, 如 image.jpg、voice.opus */
function assetName(ref: IResourceRef, contentType: string): string {
    const type = contentType.split(";")[0]!.trim().toLowerCase();
    return ref.name?.trim() || `${ref.kind}${EXTENSIONS[type] ?? DEFAULT_EXTENSIONS[ref.kind]}`;
}

/**
 * 飞书消息中的媒体: 用获取消息中的资源文件接口经内核转发下载, 再保存为思源资源文件。
 * 合并转发中的媒体也要用收到的合并转发消息的 ID 下载, 用子消息的 ID 时服务端返回 234003 (File not in msg.);
 * 文件夹与表情包不能下载, 保持占位文本。
 * Downloads the media of Feishu messages through the message resource API and
 * saves them as SiYuan assets.
 */
export class FeishuMedia {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: FeishuApi;

    constructor(siyuan: kernel.ISiyuan, api: FeishuApi) {
        this.siyuan = siyuan;
        this.api = api;
    }

    /**
     * 保存消息中的媒体, 失败时只记录日志
     * @param bot - 收到消息的机器人
     * @param messageId - 收到的消息的 ID, 其中的资源文件 (包括合并转发中的) 都用它下载
     * @param messages - 收到的消息, 以及合并转发中的子消息
     * @param block - 消息的超级块 ID, 资源文件保存到该块所在笔记本的资源文件目录
     * @returns image_key 或 file_key → 资源文件路径, 保存失败的不在其中
     */
    public async save(bot: IFeishuBot, messageId: string, messages: IFeishuMessage[], block: string): Promise<Map<string, string>> {
        const assets = new Map<string, string>();
        for (const message of messages) {
            for (const ref of messageResources(message)) {
                if (assets.has(ref.key)) {
                    continue;
                }
                const asset = await this.saveResource(bot, messageId, ref, block);
                if (asset) {
                    assets.set(ref.key, asset);
                }
            }
        }
        return assets;
    }

    private async saveResource(bot: IFeishuBot, messageId: string, ref: IResourceRef, block: string): Promise<string | undefined> {
        const label = `the ${ref.kind} ${ref.key} of the message ${messageId}`;
        try {
            const resource = await this.api.downloadResource(bot.options, messageId, ref.key, ref.type);
            if (resource.data.byteLength > MEDIA_MAX_BYTES) {
                throw new Error(`downloaded ${resource.data.byteLength} bytes, more than ${MEDIA_MAX_BYTES}`);
            }
            const asset = await uploadAsset(this.siyuan, assetName(ref, resource.contentType), resource.data, block);
            void this.siyuan.logger.debug(`[feishu] [media] saved ${label} (${resource.data.byteLength} bytes) as ${asset}`);
            return asset;
        }
        catch (error) {
            void this.siyuan.logger.warn(`[feishu] [media] save ${label} failed, keep it as a placeholder:`, errorMessage(error));
            return undefined;
        }
    }
}
