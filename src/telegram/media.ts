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
import { isLocalPath, messageKey, messageMedia } from "./message";

import type * as kernel from "siyuan/kernel";

import type { IFile, IMessage } from "@/types/telegram";

import type { TelegramApi } from "./api";
import type { IMedia, IMediaAssets } from "./message";
import type { ITelegramBot } from "./poller";

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 下载路径的扩展名 (如 .jpg); 语音的 .oga 改为更通用的 .ogg */
function extension(path: string): string {
    const ext = /\.[0-9a-z]+$/i.exec(path)?.[0]?.toLowerCase() ?? "";
    return ext === ".oga" ? ".ogg" : ext;
}

/* 资源文件名: 优先使用文件的原名, 否则为媒体类型加上下载路径的扩展名, 如 image.jpg、voice.ogg */
function assetName(media: IMedia, path: string): string {
    return media.name?.trim() || `${media.kind}${extension(path)}`;
}

/**
 * Telegram 消息中的媒体: 用 getFile 取得下载路径, 经内核转发下载, 再保存为思源资源文件;
 * 动画贴纸还保存它的缩略图, 用于显示。
 * 官方 Bot API 服务器只允许下载 20 MB 以内的文件, 更大的文件 getFile 会返回错误, 媒体保持占位文本。
 * Downloads the media of Telegram messages through getFile and saves them as
 * SiYuan assets; the official Bot API server only serves files up to 20 MB.
 */
export class TelegramMedia {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: TelegramApi;

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - Bot API 客户端
     */
    constructor(siyuan: kernel.ISiyuan, api: TelegramApi) {
        this.siyuan = siyuan;
        this.api = api;
    }

    /**
     * 保存消息中的媒体, 失败时只记录日志
     * @param bot - 接收该消息的机器人
     * @param message - 消息
     * @param block - 消息的超级块 ID, 资源文件保存到该块所在笔记本的资源文件目录
     * @returns 保存的资源文件路径; 没有媒体或者保存失败的一项为 undefined
     */
    public async save(bot: ITelegramBot, message: IMessage, block: string): Promise<IMediaAssets> {
        const media = messageMedia(message);
        if (!media) {
            return {};
        }
        const label = `the ${media.kind} of the message ${messageKey(message)}`;
        const assets: IMediaAssets = {
            file: await this.saveFile(bot, media.file, (path) => assetName(media, path), label, block),
        };
        if (media.thumbnail) {
            const name = (path: string): string => `${media.kind}-thumbnail${extension(path)}`;
            assets.thumbnail = await this.saveFile(bot, media.thumbnail, name, `the thumbnail of ${label}`, block);
        }
        return assets;
    }

    /**
     * 下载一个文件并保存为资源文件, 失败时只记录日志
     * @param bot - 接收该消息的机器人
     * @param source - 要下载的文件
     * @param name - 按下载路径得出资源文件名
     * @param label - 日志中对该文件的描述
     * @param block - 消息的超级块 ID
     * @returns 资源文件路径; 保存失败时为 undefined
     */
    private async saveFile(bot: ITelegramBot, source: IFile, name: (path: string) => string, label: string, block: string): Promise<string | undefined> {
        try {
            const size = source.file_size;
            if (size && size > MEDIA_MAX_BYTES) {
                void this.siyuan.logger.warn(`[telegram] [media] ${label} has ${size} bytes, more than ${MEDIA_MAX_BYTES}, keep it as a placeholder`);
                return undefined;
            }

            const file = await this.api.getFile(bot.options, source.file_id);
            if (!file.file_path) {
                throw new Error("getFile returned no file_path");
            }
            if (isLocalPath(file.file_path)) {
                throw new Error(`the Bot API server runs in --local mode and returned the local path ${file.file_path}, which cannot be downloaded`);
            }

            const data = await this.api.download(bot.options, file.file_path);
            if (data.byteLength > MEDIA_MAX_BYTES) {
                throw new Error(`downloaded ${data.byteLength} bytes, more than ${MEDIA_MAX_BYTES}`);
            }
            const asset = await uploadAsset(this.siyuan, name(file.file_path), data, block);
            void this.siyuan.logger.debug(`[telegram] [media] saved ${label} (${data.byteLength} bytes) as ${asset}`);
            return asset;
        }
        catch (error) {
            void this.siyuan.logger.warn(`[telegram] [media] save ${label} failed, keep it as a placeholder:`, errorMessage(error));
            return undefined;
        }
    }
}
