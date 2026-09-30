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

import { GROUP_MESSAGE_EVENTS, MessageType } from "./constants";
import { convertMessage, sceneValue } from "./message";

import type * as kernel from "siyuan/kernel";

import type { IQQInboxBinding, IQQInboxConfig } from "@/types/config";
import type { IGroupMessage, IPayload } from "@/types/qq";

import type { IMessageLabels } from "./message";

/* 文档的位置, path 为 .sy 文件在笔记本中的路径, hpath 为文档标题组成的路径 */
interface IDoc {
    box: string;
    path: string;
    hpath: string;
}

/* /api/block/getChildBlocks 的一项, 空段落没有 markdown 字段 */
interface IChildBlock {
    id: string;
    type: string;
    markdown?: string;
}

const TEMP_DOC_TITLE = ".temp"; // 暂存消息的文档
const BLOCK_ID = /^\d{14}-[0-9a-z]{7}$/;
const RECENT_MESSAGES = 1024; // 在内存中记住的最近消息数, 数据库索引新块约有 3 秒延迟
const SYNC_POLL_INTERVAL = 2_000; // 等待文档同步标记消失的轮询间隔 (ms)
const SYNC_WAIT_TIMEOUT = 30 * 60_000; // 等待文档同步标记消失的最长时间 (ms)

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 本地时区的 YYYY-MM-DD */
function formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

/* 消息的发送日期, 时间戳无效时使用当前日期 */
function messageDate(timestamp: string): string {
    const time = new Date(timestamp);
    return formatDate(Number.isNaN(time.getTime()) ? new Date() : time);
}

/* 块 ID 以本地时间 YYYYMMDDHHmmss 开头 */
function blockDate(id: string): string {
    return `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
}

/**
 * 思源收集箱: 把绑定群聊的消息写入收集箱文档。
 * 每条消息先插入收集箱文档下的 .temp 文档, 需要时调用 netAssets2LocalAssets 下载资源文件,
 * 再移动到 YYYY/MM/YYYY-MM-DD 文档的末尾。消息逐条处理, 保证顺序, 也不会重复创建日期文档。
 * Writes the messages of bound QQ groups into SiYuan documents: each message is
 * inserted into the .temp document, its assets are downloaded, and then it is
 * moved to the end of the YYYY/MM/YYYY-MM-DD document.
 */
export class QQInbox {
    private readonly siyuan: kernel.ISiyuan;
    private readonly config: () => IQQInboxConfig;

    private queue: Promise<void> = Promise.resolve();
    private readonly messages = new Map<string, string>(); // `${收集箱文档 ID} ${msg_idx}` → 消息块 ID
    private readonly children = new Map<string, string>(); // `${父文档 ID} ${标题}` → 子文档 ID
    private readonly recovered = new Set<string>(); // 本次运行已清理过 .temp 的收集箱文档

    /**
     * @param siyuan - 内核插件全局对象
     * @param config - 返回当前的收集箱配置
     */
    constructor(siyuan: kernel.ISiyuan, config: () => IQQInboxConfig) {
        this.siyuan = siyuan;
        this.config = config;
    }

    /* 处理网关推送的事件, 只接收绑定了收集箱的群聊消息 */
    public handle(payload: IPayload): void {
        if (!payload.t || !GROUP_MESSAGE_EVENTS.has(payload.t)) {
            return;
        }
        const message = payload.d as IGroupMessage;
        const bindings = this.config().bindings.filter((binding) => binding.group === message.group_openid);
        if (bindings.length === 0) {
            return;
        }

        this.queue = this.queue.then(async () => {
            for (const binding of bindings) {
                try {
                    await this.write(binding, payload.id ?? "", message);
                }
                catch (error) {
                    void this.siyuan.logger.warn(`[qq] [inbox] write the message ${message.id} of group ${binding.group} to ${binding.doc} failed:`, errorMessage(error));
                }
            }
        });
    }

    private async write(binding: IQQInboxBinding, eventId: string, message: IGroupMessage): Promise<void> {
        const inbox = binding.doc;
        if (!BLOCK_ID.test(inbox)) {
            throw new Error(`invalid document ID ${inbox}`);
        }
        // 上次运行未等到结束的下载与数据同步都可能正在写回 .temp
        await this.waitForSync(await this.childDoc(inbox, TEMP_DOC_TITLE));
        await this.recover(inbox);

        const msgIdx = sceneValue(message, "msg_idx");
        if (msgIdx && await this.findMessage(inbox, msgIdx)) {
            // 同一条消息可能重复推送, 也可能同时推送 GROUP_AT_MESSAGE_CREATE 与 GROUP_MESSAGE_CREATE
            void this.siyuan.logger.debug(`[qq] [inbox] the message ${msgIdx} is already in ${inbox}, skip it`);
            return;
        }

        const refIdx = message.message_type === MessageType.REFERENCE ? sceneValue(message, "ref_msg_idx") : undefined;
        const converted = convertMessage(message, {
            eventId,
            reference: refIdx ? await this.findMessage(inbox, refIdx) : undefined,
            labels: this.labels(),
        });
        const { block, temp } = await this.appendToTemp(inbox, converted.kramdown);
        if (msgIdx) {
            this.remember(inbox, msgIdx, block);
        }

        if (converted.media > 0 && this.config().downloadAssets) {
            await this.downloadAssets(temp);
        }
        await this.moveToDate(inbox, block, messageDate(message.timestamp));
    }

    /* 文档当前的位置, 每次都重新获取, 以便跟随文档的移动与重命名 */
    private async locate(id: string): Promise<IDoc> {
        const { notebook, path } = await this.request<{ notebook: string; path: string }>("/api/filetree/getPathByID", { id });
        if (!path.endsWith(`/${id}.sy`)) {
            throw new Error(`${id} is not a document`);
        }
        const hpath = await this.request<string>("/api/filetree/getHPathByID", { id });
        return { box: notebook, path, hpath };
    }

    /**
     * 标题为 title 的子文档 ID, 不存在时创建。
     * 只缓存 ID, 创建前重新获取父文档的位置: 父文档被移动或重命名后, 用过期的路径创建会在原路径另建一组文档
     */
    private async childDoc(parent: string, title: string): Promise<string> {
        const key = `${parent} ${title}`;
        const cached = this.children.get(key);
        if (cached) {
            return cached;
        }

        const doc = await this.locate(parent);
        const { files } = await this.request<{ files: { id: string; name: string }[] }>("/api/filetree/listDocsByPath", {
            notebook: doc.box,
            path: doc.path,
        });
        const id = files.find((file) => file.name === title)?.id
            ?? await this.request<string>("/api/filetree/createDocWithMd", {
                notebook: doc.box,
                path: `${doc.hpath}/${title}`,
                parentID: parent,
                markdown: "",
            });
        this.children.set(key, id);
        return id;
    }

    /* 把消息块追加到 .temp 文档; 缓存的 .temp 文档可能已被删除, 失败时重新查找一次 */
    private async appendToTemp(inbox: string, kramdown: string): Promise<{ block: string; temp: string }> {
        const temp = await this.childDoc(inbox, TEMP_DOC_TITLE);
        try {
            return { block: await this.append(temp, kramdown), temp };
        }
        catch (error) {
            void this.siyuan.logger.debug(`[qq] [inbox] append to ${temp} failed, retry after refreshing the documents:`, errorMessage(error));
            this.children.clear();
            const refreshed = await this.childDoc(inbox, TEMP_DOC_TITLE);
            return { block: await this.append(refreshed, kramdown), temp: refreshed };
        }
    }

    /* 把消息块移动到日期文档末尾; 缓存的文档可能已被删除, 失败时重新查找一次 */
    private async moveToDate(inbox: string, block: string, date: string): Promise<void> {
        try {
            await this.moveToEnd(block, await this.dateDoc(inbox, date));
        }
        catch (error) {
            void this.siyuan.logger.debug(`[qq] [inbox] move ${block} failed, retry after refreshing the documents:`, errorMessage(error));
            this.children.clear();
            await this.moveToEnd(block, await this.dateDoc(inbox, date));
        }
    }

    /* YYYY/MM/YYYY-MM-DD 文档的 ID */
    private async dateDoc(inbox: string, date: string): Promise<string> {
        const year = await this.childDoc(inbox, date.slice(0, 4));
        const month = await this.childDoc(year, date.slice(5, 7));
        return this.childDoc(month, date);
    }

    private async moveToEnd(block: string, doc: string): Promise<void> {
        const blocks = await this.request<IChildBlock[]>("/api/block/getChildBlocks", { id: doc });
        const last = blocks[blocks.length - 1];
        if (!last) {
            await this.request("/api/block/moveBlock", { id: block, parentID: doc });
            return;
        }

        await this.request("/api/block/moveBlock", { id: block, previousID: last.id });
        if (blocks.length === 1 && last.type === "p" && !last.markdown) {
            // 新建的文档只有一个空段落
            await this.request("/api/block/deleteBlock", { id: last.id });
        }
    }

    /**
     * 下载 .temp 文档中的网络资源文件。
     * 下载超过 1 分钟时请求会超时, 但内核仍在下载, 并会在结束时写回 .temp 文档, 此时等待其结束。
     */
    private async downloadAssets(temp: string): Promise<void> {
        try {
            await this.request("/api/format/netAssets2LocalAssets", { id: temp });
            return;
        }
        catch (error) {
            void this.siyuan.logger.warn(`[qq] [inbox] download the assets of ${temp} failed, wait for the kernel to finish:`, errorMessage(error));
        }
        await this.waitForSync(temp);
    }

    /**
     * 等待文档的同步标记消失。
     * 内核下载资源文件与同步数据时先读出文档, 结束后整篇写回, 期间插入或移出的块会被写回覆盖。
     */
    private async waitForSync(doc: string): Promise<void> {
        const deadline = Date.now() + SYNC_WAIT_TIMEOUT;
        while (await this.isSyncing(doc)) {
            if (Date.now() > deadline) {
                throw new Error(`${doc} is still syncing after ${SYNC_WAIT_TIMEOUT} ms`);
            }
            await sleep(SYNC_POLL_INTERVAL);
        }
    }

    private async isSyncing(doc: string): Promise<boolean> {
        try {
            const data = await this.request<{ isSyncing?: boolean }>("/api/filetree/getDoc", { id: doc });
            return data.isSyncing === true;
        }
        catch {
            // 文档已被删除 (写入时会重新创建), 不会再被写回
            return false;
        }
    }

    /**
     * 本次运行首次写入收集箱时, 把上次未处理完 (如下载时退出) 而留在 .temp 中的消息移动到日期文档。
     * 这些消息的日期取自块 ID, 即插入 .temp 的时间。失败时只记录日志, 不影响当前消息的写入。
     */
    private async recover(inbox: string): Promise<void> {
        if (this.recovered.has(inbox)) {
            return;
        }
        this.recovered.add(inbox);

        try {
            const temp = await this.childDoc(inbox, TEMP_DOC_TITLE);
            const leftovers: string[] = [];
            for (const block of await this.request<IChildBlock[]>("/api/block/getChildBlocks", { id: temp })) {
                if (block.type !== "s") {
                    continue;
                }
                const attributes = await this.request<Record<string, string>>("/api/attr/getBlockAttrs", { id: block.id });
                if (attributes["custom-event-id"]) {
                    leftovers.push(block.id);
                }
            }
            if (leftovers.length === 0) {
                return;
            }

            void this.siyuan.logger.info(`[qq] [inbox] move ${leftovers.length} leftover message(s) out of ${temp}`);
            if (this.config().downloadAssets) {
                await this.downloadAssets(temp);
            }
            for (const block of leftovers) {
                await this.moveToDate(inbox, block, blockDate(block));
            }
        }
        catch (error) {
            void this.siyuan.logger.warn(`[qq] [inbox] move the leftover messages of ${inbox} failed:`, errorMessage(error));
        }
    }

    /* 追加消息块, 返回其 ID */
    private async append(parent: string, kramdown: string): Promise<string> {
        const transactions = await this.request<{ doOperations: { id: string }[] }[]>("/api/block/appendBlock", {
            parentID: parent,
            dataType: "markdown",
            data: kramdown,
        });
        const id = transactions[0]?.doOperations[0]?.id;
        if (!id) {
            throw new Error("appendBlock returned no block");
        }
        return id;
    }

    /* 查找收集箱中 custom-msg-idx 为 msgIdx 的消息块: 先查最近写入的消息, 再查数据库 */
    private async findMessage(inbox: string, msgIdx: string): Promise<string | undefined> {
        const recent = this.messages.get(`${inbox} ${msgIdx}`);
        if (recent) {
            return recent;
        }
        const rows = await this.request<{ block_id: string }[]>("/api/query/sql", {
            stmt: `SELECT block_id FROM attributes WHERE name = 'custom-msg-idx' AND value = '${msgIdx.replace(/'/g, "''")}' AND path LIKE '%/${inbox}/%' LIMIT 1`,
        });
        return rows[0]?.block_id;
    }

    private remember(inbox: string, msgIdx: string, block: string): void {
        this.messages.set(`${inbox} ${msgIdx}`, block);
        if (this.messages.size > RECENT_MESSAGES) {
            this.messages.delete(this.messages.keys().next().value!);
        }
    }

    private labels(): IMessageLabels {
        const labels = this.siyuan.plugin.i18n?.inbox as Partial<IMessageLabels> | undefined;
        return {
            quote: labels?.quote || "Quoted message",
            unavailable: labels?.unavailable || "[Message not available]",
        };
    }

    /* 调用内核 API, code 不为 0 时抛出错误 */
    private async request<T = unknown>(path: kernel.TRequestPath, body: unknown): Promise<T> {
        const response = await this.siyuan.client.fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await response.json() as { code: number; msg: string; data: T };
        if (result.code !== 0) {
            throw new Error(`${path} failed: ${result.code} ${result.msg}`);
        }
        return result.data;
    }
}
