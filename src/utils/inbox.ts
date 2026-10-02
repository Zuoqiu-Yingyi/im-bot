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

import type * as kernel from "siyuan/kernel";

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

/* 插件写入的消息超级块带有其中至少一个属性: QQ 消息带 custom-event-id, 微信消息带 custom-msg-id */
const MESSAGE_MARKERS = [
    "custom-event-id",
    "custom-msg-id",
];

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

/**
 * 消息的发送日期 (本地时区的 YYYY-MM-DD), 时间无效或缺失时使用当前日期
 * @param time - ISO 8601 时间字符串, 或毫秒时间戳
 */
export function messageDate(time: number | string | undefined): string {
    const date = new Date(time ?? Number.NaN);
    return formatDate(Number.isNaN(date.getTime()) ? new Date() : date);
}

/* 块 ID 以本地时间 YYYYMMDDHHmmss 开头 */
function blockDate(id: string): string {
    return `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
}

/**
 * 写入思源收集箱文档, QQ 与微信共用一个实例: 同一篇收集箱文档可以同时接收两个平台的消息。
 * 每条消息先插入收集箱文档下的 .temp 文档, 需要时调用 netAssets2LocalAssets 下载资源文件,
 * 再移动到 YYYY/MM/YYYY-MM-DD 文档的末尾。
 * 所有写入排在同一个队列中逐条执行, 保证顺序, 也不会重复创建日期文档。
 * Writes messages into SiYuan inbox documents for every platform: each message
 * is inserted into the .temp document, its assets are downloaded, and then it
 * is moved to the end of the YYYY/MM/YYYY-MM-DD document. Writes run one by one
 * in a single queue.
 */
export class InboxWriter {
    private readonly siyuan: kernel.ISiyuan;
    private readonly downloadAssetsEnabled: () => boolean;

    private queue: Promise<void> = Promise.resolve();
    private readonly messages = new Map<string, string>(); // `${收集箱文档 ID} ${属性名} ${属性值}` → 消息块 ID
    private readonly children = new Map<string, string>(); // `${父文档 ID} ${标题}` → 子文档 ID
    private readonly recovered = new Set<string>(); // 本次运行已清理过 .temp 的收集箱文档

    /**
     * @param siyuan - 内核插件全局对象
     * @param downloadAssets - 返回是否下载资源文件, 用于移出上次留在 .temp 中的消息
     */
    constructor(siyuan: kernel.ISiyuan, downloadAssets: () => boolean) {
        this.siyuan = siyuan;
        this.downloadAssetsEnabled = downloadAssets;
    }

    /* 把写入任务排入队列; 任务应自行处理并记录错误, 这里只兜底, 保证队列不会中断 */
    public enqueue(task: () => Promise<void>): void {
        this.queue = this.queue.then(task).catch((error: unknown) => {
            void this.siyuan.logger.warn("[inbox] an inbox task failed:", errorMessage(error));
        });
    }

    /**
     * 写入前的准备: 等待 .temp 的同步标记消失 (上次运行未等到结束的下载与数据同步都可能正在写回 .temp),
     * 并在本次运行首次写入该收集箱时, 移出上次留在 .temp 中的消息
     * @param inbox - 收集箱文档 ID
     * @throws 文档 ID 无效, 或者 .temp 长时间处于同步中
     */
    public async prepare(inbox: string): Promise<void> {
        if (!BLOCK_ID.test(inbox)) {
            throw new Error(`invalid document ID ${inbox}`);
        }
        await this.waitForSync(await this.childDoc(inbox, TEMP_DOC_TITLE));
        await this.recover(inbox);
    }

    /**
     * 查找收集箱中属性 name 的值为 value 的消息块: 先查最近写入的消息, 再查数据库
     * @param inbox - 收集箱文档 ID, 已经过 prepare 校验
     * @param name - 属性名, 如 custom-msg-idx
     * @param value - 属性值
     */
    public async findMessage(inbox: string, name: string, value: string): Promise<string | undefined> {
        const recent = this.messages.get(`${inbox} ${name} ${value}`);
        if (recent) {
            return recent;
        }
        const quote = (text: string): string => text.replace(/'/g, "''");
        const rows = await this.request<{ block_id: string }[]>("/api/query/sql", {
            stmt: `SELECT block_id FROM attributes WHERE name = '${quote(name)}' AND value = '${quote(value)}' AND path LIKE '%/${inbox}/%' LIMIT 1`,
        });
        return rows[0]?.block_id;
    }

    /* 块的纯文本 (数据库中的 content); 数据库还没有索引该块时为空字符串 */
    public async blockText(block: string): Promise<string> {
        const rows = await this.request<{ content: string }[]>("/api/query/sql", {
            stmt: `SELECT content FROM blocks WHERE id = '${block.replace(/'/g, "''")}' LIMIT 1`,
        });
        return rows[0]?.content?.trim() ?? "";
    }

    /* 记住刚写入的消息块, 供 findMessage 在数据库索引之前查到 */
    public remember(inbox: string, name: string, value: string, block: string): void {
        this.messages.set(`${inbox} ${name} ${value}`, block);
        if (this.messages.size > RECENT_MESSAGES) {
            this.messages.delete(this.messages.keys().next().value!);
        }
    }

    /* 把消息块追加到 .temp 文档; 缓存的 .temp 文档可能已被删除, 失败时重新查找一次 */
    public async appendToTemp(inbox: string, kramdown: string): Promise<{ block: string; temp: string }> {
        const temp = await this.childDoc(inbox, TEMP_DOC_TITLE);
        try {
            return { block: await this.append(temp, kramdown), temp };
        }
        catch (error) {
            void this.siyuan.logger.debug(`[inbox] append to ${temp} failed, retry after refreshing the documents:`, errorMessage(error));
            this.children.clear();
            const refreshed = await this.childDoc(inbox, TEMP_DOC_TITLE);
            return { block: await this.append(refreshed, kramdown), temp: refreshed };
        }
    }

    /**
     * 下载 .temp 文档中的网络资源文件。
     * 下载超过 1 分钟时请求会超时, 但内核仍在下载, 并会在结束时写回 .temp 文档, 此时等待其结束。
     */
    public async downloadAssets(temp: string): Promise<void> {
        try {
            await this.request("/api/format/netAssets2LocalAssets", { id: temp });
            return;
        }
        catch (error) {
            void this.siyuan.logger.warn(`[inbox] download the assets of ${temp} failed, wait for the kernel to finish:`, errorMessage(error));
        }
        await this.waitForSync(temp);
    }

    /* 用新的 kramdown 替换消息块: 块 ID 不变, 指向它的块引用仍然有效; 属性取自 kramdown 的 IAL, 子块会换成新的块 */
    public async updateBlock(block: string, kramdown: string): Promise<void> {
        await this.request("/api/block/updateBlock", { id: block, dataType: "markdown", data: kramdown });
    }

    /* 把消息块移动到日期文档末尾; 缓存的文档可能已被删除, 失败时重新查找一次 */
    public async moveToDate(inbox: string, block: string, date: string): Promise<void> {
        try {
            await this.moveToEnd(block, await this.dateDoc(inbox, date));
        }
        catch (error) {
            void this.siyuan.logger.debug(`[inbox] move ${block} failed, retry after refreshing the documents:`, errorMessage(error));
            this.children.clear();
            await this.moveToEnd(block, await this.dateDoc(inbox, date));
        }
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
                if (MESSAGE_MARKERS.some((name) => attributes[name])) {
                    leftovers.push(block.id);
                }
            }
            if (leftovers.length === 0) {
                return;
            }

            void this.siyuan.logger.info(`[inbox] move ${leftovers.length} leftover message(s) out of ${temp}`);
            if (this.downloadAssetsEnabled()) {
                await this.downloadAssets(temp);
            }
            for (const block of leftovers) {
                await this.moveToDate(inbox, block, blockDate(block));
            }
        }
        catch (error) {
            void this.siyuan.logger.warn(`[inbox] move the leftover messages of ${inbox} failed:`, errorMessage(error));
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
