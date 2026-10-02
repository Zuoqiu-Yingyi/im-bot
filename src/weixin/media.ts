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
import { proxyFetchBinary } from "@/utils/proxy";

import { CDN_BASE_URL, MEDIA_MAX_BYTES, MessageItemType } from "./constants";
import { messageId } from "./message";

import type * as kernel from "siyuan/kernel";

import type { ICDNMedia, IMessageItem, IWeixinMessage } from "@/types/weixin";

/**
 * 用到的 siyuan.crypto.subtle 方法。较新的内核才提供 siyuan.crypto (siyuan-note/siyuan#20042),
 * AES-ECB 与 MD5 是内核在 Web Crypto 之外提供的扩展; 已发布的 siyuan 类型声明中还没有 siyuan.crypto
 */
interface ISubtleCrypto {
    importKey: (format: "raw", keyData: ArrayBuffer | ArrayBufferView, algorithm: { name: string }, extractable: boolean, keyUsages: string[]) => Promise<unknown>;
    decrypt: (algorithm: { name: string }, key: unknown, data: ArrayBuffer | ArrayBufferView) => Promise<ArrayBuffer>;
    digest: (algorithm: string, data: ArrayBuffer | ArrayBufferView) => Promise<ArrayBuffer>;
}

type TMediaKind = "file" | "image" | "video" | "voice";

/* 媒体消息项的类型 */
const MEDIA_KINDS: Partial<Record<number, TMediaKind>> = {
    [MessageItemType.IMAGE]: "image",
    [MessageItemType.VOICE]: "voice",
    [MessageItemType.FILE]: "file",
    [MessageItemType.VIDEO]: "video",
};

/* 媒体在 CDN 上的位置与解密所需的信息 */
interface IMediaSource {
    kind: TMediaKind;
    media: ICDNMedia;
    key?: Uint8Array; // AES-128 密钥, 没有密钥的图片按明文下载
    name: string; // 资源文件名, 图片、语音与视频按文件头补上扩展名
    size?: number; // 消息声明的大小 (字节), 用于下载前检查
    md5?: string; // 消息声明的明文 MD5
}

/* 文件头: [扩展名, 偏移, 内容], 内容按 latin1 比较 */
type TSignature = [string, number, string];

const SIGNATURES: Record<Exclude<TMediaKind, "file">, TSignature[]> = {
    image: [
        [".jpg", 0, "\xFF\xD8\xFF"],
        [".png", 0, "\x89PNG"],
        [".gif", 0, "GIF8"],
        [".webp", 8, "WEBP"],
        [".bmp", 0, "BM"],
    ],
    voice: [
        [".silk", 0, "#!SILK"],
        [".silk", 1, "#!SILK"], // 微信的 SILK 文件以 \x02 开头
        [".amr", 0, "#!AMR"],
        [".mp3", 0, "ID3"],
        [".ogg", 0, "OggS"],
        [".wav", 8, "WAVE"],
    ],
    video: [
        [".mp4", 4, "ftyp"],
    ],
};

/* 没有识别出文件头时使用的扩展名: 微信的图片是 JPEG, 语音是 SILK, 视频是 MP4 */
const DEFAULT_EXTENSIONS: Record<Exclude<TMediaKind, "file">, string> = {
    image: ".jpg",
    voice: ".silk",
    video: ".mp4",
};

const AES_KEY_HEX = /^[0-9a-f]{32}$/i;

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function hex(data: ArrayBuffer): string {
    // eslint-disable-next-line node/prefer-global/buffer
    return Buffer.from(data).toString("hex");
}

/**
 * 16 字节的 AES-128 密钥, 与官方客户端的 parseAesKey 相同:
 * image_item.aeskey 是 hex 字符串; media.aes_key 是 base64, 解出 16 字节原始密钥或 32 个字符的 hex 字符串
 * @throws 密钥的格式不正确
 */
function parseKey(keyHex: string | undefined, keyBase64: string | undefined): Uint8Array | undefined {
    if (keyHex) {
        if (!AES_KEY_HEX.test(keyHex)) {
            throw new Error(`aeskey is not a 32-character hex string`);
        }
        // eslint-disable-next-line node/prefer-global/buffer
        return new Uint8Array(Buffer.from(keyHex, "hex"));
    }
    if (!keyBase64) {
        return undefined;
    }
    // eslint-disable-next-line node/prefer-global/buffer
    const decoded = Buffer.from(keyBase64, "base64");
    if (decoded.length === 16) {
        return new Uint8Array(decoded);
    }
    const text = decoded.toString("utf8"); // goja 的 Buffer 只支持 hex、utf8、base64 与 base64Url
    if (AES_KEY_HEX.test(text)) {
        // eslint-disable-next-line node/prefer-global/buffer
        return new Uint8Array(Buffer.from(text, "hex"));
    }
    throw new Error(`aes_key decodes to ${decoded.length} bytes, neither a 16-byte key nor a 32-character hex string`);
}

/**
 * 消息项中媒体的来源; 不是媒体或者缺少下载信息时为 undefined。
 * 与官方客户端相同: 图片优先使用 image_item.aeskey, 没有密钥时按明文下载; 语音、文件与视频没有 aes_key 时不下载
 * @throws 密钥的格式不正确
 */
function mediaSource(item: IMessageItem): IMediaSource | undefined {
    switch (item.type) {
        case MessageItemType.IMAGE: {
            const image = item.image_item;
            return image?.media
                ? {
                        kind: "image",
                        media: image.media,
                        key: parseKey(image.aeskey, image.media.aes_key),
                        name: "image",
                        size: image.hd_size || image.mid_size,
                    }
                : undefined;
        }
        case MessageItemType.VOICE: {
            const media = item.voice_item?.media;
            return media?.aes_key
                ? { kind: "voice", media, key: parseKey(undefined, media.aes_key), name: "voice" }
                : undefined;
        }
        case MessageItemType.FILE: {
            const file = item.file_item;
            return file?.media?.aes_key
                ? {
                        kind: "file",
                        media: file.media,
                        key: parseKey(undefined, file.media.aes_key),
                        name: file.file_name?.trim() || "file",
                        size: Number(file.len) || undefined,
                        md5: file.md5,
                    }
                : undefined;
        }
        case MessageItemType.VIDEO: {
            const video = item.video_item;
            return video?.media?.aes_key
                ? {
                        kind: "video",
                        media: video.media,
                        key: parseKey(undefined, video.media.aes_key),
                        name: "video",
                        size: video.video_size,
                        md5: video.video_md5,
                    }
                : undefined;
        }
        default:
            return undefined;
    }
}

/* 下载地址: 优先使用 full_url (只接受 https), 没有时用 encrypt_query_param 拼接 (与官方客户端相同) */
function downloadUrl(media: ICDNMedia): string | undefined {
    if (media.full_url?.startsWith("https://")) {
        return media.full_url;
    }
    return media.encrypt_query_param
        ? `${CDN_BASE_URL}/download?encrypted_query_param=${encodeURIComponent(media.encrypt_query_param)}`
        : undefined;
}

/* 按文件头确定扩展名 */
function extension(kind: Exclude<TMediaKind, "file">, data: ArrayBuffer): string {
    const head = new Uint8Array(data, 0, Math.min(data.byteLength, 16));
    const matches = ([, offset, magic]: TSignature): boolean => magic
        .split("")
        .every((char, index) => head[offset + index] === char.charCodeAt(0));
    return SIGNATURES[kind].find(matches)?.[0] ?? DEFAULT_EXTENSIONS[kind];
}

/**
 * 微信消息中的媒体: 从 CDN 下载, 用 siyuan.crypto 的 AES-128-ECB 解密, 再保存为思源资源文件。
 * 内核没有 siyuan.crypto 或不支持 AES-ECB 时不下载, 媒体保持占位文本。
 * Downloads the media of WeChat messages from the CDN, decrypts them with the
 * AES-128-ECB of siyuan.crypto and saves them as SiYuan assets. Without
 * siyuan.crypto or its AES-ECB the media stay placeholders.
 */
export class WeixinMedia {
    private readonly siyuan: kernel.ISiyuan;

    private support?: Promise<ISubtleCrypto | undefined>; // 内核是否支持 AES-ECB, 只检查一次

    /**
     * @param siyuan - 内核插件全局对象
     */
    constructor(siyuan: kernel.ISiyuan) {
        this.siyuan = siyuan;
    }

    /**
     * 保存消息中的媒体, 失败的媒体项只记录日志
     * @param message - 微信消息
     * @param block - 消息的超级块 ID, 资源文件保存到该块所在笔记本的资源文件目录
     * @returns 与 item_list 一一对应的资源文件路径, 没有保存的项为 undefined; 没有保存任何媒体时为空数组
     */
    public async save(message: IWeixinMessage, block: string): Promise<(string | undefined)[]> {
        const items = message.item_list ?? [];
        if (!items.some((item) => MEDIA_KINDS[item.type ?? 0])) {
            return [];
        }
        this.support ??= this.probe();
        const subtle = await this.support;
        if (!subtle) {
            return [];
        }

        const assets: (string | undefined)[] = [];
        for (const item of items) {
            assets.push(await this.saveItem(subtle, message, item, block));
        }
        return assets.some(Boolean) ? assets : [];
    }

    /**
     * 内核提供 siyuan.crypto 且支持 AES-ECB 时为 siyuan.crypto.subtle。
     * AES-ECB 不属于 Web Crypto, 提供 siyuan.crypto 的内核不一定支持它, 所以用一个全零密钥试着导入
     */
    private async probe(): Promise<ISubtleCrypto | undefined> {
        const subtle = (this.siyuan as kernel.ISiyuan & { crypto?: { subtle?: ISubtleCrypto } }).crypto?.subtle;
        if (!subtle) {
            void this.siyuan.logger.info("[weixin] [media] siyuan.crypto is not available in this version of SiYuan, keep the media of messages as placeholders");
            return undefined;
        }
        try {
            await subtle.importKey("raw", new Uint8Array(16), { name: "AES-ECB" }, false, ["decrypt"]);
            return subtle;
        }
        catch (error) {
            void this.siyuan.logger.info("[weixin] [media] siyuan.crypto of this version of SiYuan does not support AES-ECB, keep the media of messages as placeholders:", errorMessage(error));
            return undefined;
        }
    }

    private async saveItem(subtle: ISubtleCrypto, message: IWeixinMessage, item: IMessageItem, block: string): Promise<string | undefined> {
        const kind = MEDIA_KINDS[item.type ?? 0];
        if (!kind) {
            return undefined;
        }
        const label = `the ${kind} of the message ${messageId(message)}`;
        try {
            const source = mediaSource(item);
            const url = source && downloadUrl(source.media);
            if (!source || !url) {
                return undefined;
            }
            if (source.size && source.size > MEDIA_MAX_BYTES) {
                void this.siyuan.logger.warn(`[weixin] [media] ${label} has ${source.size} bytes, more than ${MEDIA_MAX_BYTES}, keep it as a placeholder`);
                return undefined;
            }

            const response = await proxyFetchBinary(this.siyuan, { url, method: "GET" });
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`the CDN responded ${response.status}`);
            }
            if (response.body.byteLength > MEDIA_MAX_BYTES) {
                throw new Error(`downloaded ${response.body.byteLength} bytes, more than ${MEDIA_MAX_BYTES}`);
            }
            const data = source.key
                ? await this.decrypt(subtle, source.key, response.body)
                : response.body;
            await this.verify(subtle, data, source.md5, label);

            const name = source.kind === "file"
                ? source.name
                : `${source.name}${extension(source.kind, data)}`;
            const asset = await uploadAsset(this.siyuan, name, data, block);
            void this.siyuan.logger.debug(`[weixin] [media] saved ${label} (${data.byteLength} bytes) as ${asset}`);
            return asset;
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] [media] save ${label} failed, keep it as a placeholder:`, errorMessage(error));
            return undefined;
        }
    }

    /* AES-128-ECB 解密, 内核会校验并去掉 PKCS#7 填充 */
    private async decrypt(subtle: ISubtleCrypto, key: Uint8Array, data: ArrayBuffer): Promise<ArrayBuffer> {
        const cryptoKey = await subtle.importKey("raw", key, { name: "AES-ECB" }, false, ["decrypt"]);
        return subtle.decrypt({ name: "AES-ECB" }, cryptoKey, data);
    }

    /* 校验消息声明的 MD5; 只记录日志, 不丢弃文件: 还没有确认该值总是明文的 MD5 */
    private async verify(subtle: ISubtleCrypto, data: ArrayBuffer, md5: string | undefined, label: string): Promise<void> {
        if (!md5) {
            return;
        }
        let actual: string;
        try {
            actual = hex(await subtle.digest("MD5", data));
        }
        catch (error) {
            void this.siyuan.logger.debug(`[weixin] [media] skip checking the MD5 of ${label}:`, errorMessage(error));
            return;
        }
        if (actual !== md5.trim().toLowerCase()) {
            void this.siyuan.logger.warn(`[weixin] [media] the MD5 of ${label} is ${actual}, but the message says ${md5}`);
        }
    }
}
