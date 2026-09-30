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

import { mergeIgnoreArray } from "@workspace/utils/misc/merge";

import { DEFAULT_CONFIG } from "@/configs/default";
import CONSTANTS from "@/constants";
import { eventLogPath } from "@/qq/event-log";
import { QQBotGateway } from "@/qq/gateway";
import { QQInbox } from "@/qq/inbox";

import type * as kernel from "siyuan/kernel";

import type { IConfig } from "@/types/config";
import type { IPayload } from "@/types/qq";

const CONFIG_RELOAD_DELAY = 1_000; // 配置文件变化后重新读取的延迟 (ms), 合并一次写入产生的多个文件事件

/**
 * 内核插件, 构建为 dist/kernel.js。
 * 运行在思源内核的 goja 运行时中 (没有 DOM), 只能通过全局对象 siyuan 调用内核能力。
 * 按插件配置接入 QQ 机器人 WebSocket 网关, 把网关推送的全部事件打印到内核日志, 开启事件日志时同时保存到 logs/events/,
 * 并把绑定群聊的消息写入收集箱文档。指定了运行设备时, 只有该设备连接网关。
 * kernel.js 以普通脚本 (非 ES module) 执行: 本文件不能 export, 也不能从 external 模块 (如 siyuan) 导入运行时值。
 * Kernel plugin, built to dist/kernel.js. Runs in the goja runtime of the
 * SiYuan kernel (no DOM) and uses the global `siyuan` object. Connects to the
 * QQ bot WebSocket gateway with the plugin config and writes every pushed
 * event to the kernel log, and to logs/events/ when the event log is on. Writes
 * the messages of bound groups into inbox documents. When a device is set,
 * only that device connects to the gateway.
 * kernel.js is evaluated as a plain script, not an ES module: do not export
 * from this file or import runtime values from external modules (e.g. siyuan).
 */
class ImBotKernelPlugin {
    private readonly siyuan: kernel.ISiyuan = siyuan;
    private readonly qq: QQBotGateway;
    private readonly inbox: QQInbox;

    private config: IConfig = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG);
    private device = ""; // 本机设备 ID
    private running?: boolean; // 上次应用配置时本机是否运行 QQ 机器人
    private reloadTimer?: ReturnType<typeof setTimeout>;

    constructor() {
        this.qq = new QQBotGateway(this.siyuan, this.onQQDispatch.bind(this));
        this.inbox = new QQInbox(this.siyuan, () => this.config.qq.inbox);
        this.siyuan.event.handler = this.onEvent.bind(this);

        // 绑定生命周期钩子, 内核会等待钩子返回的 Promise 后再进入下一阶段。
        // Wire lifecycle hooks; the kernel awaits returned Promises before advancing.
        this.siyuan.plugin.lifecycle.onload = this.onload.bind(this);
        this.siyuan.plugin.lifecycle.onrunning = this.onrunning.bind(this);
        this.siyuan.plugin.lifecycle.onunload = this.onunload.bind(this);
    }

    /* 加载 */
    private async onload(): Promise<void> {
        await this.loadConfig();
        this.device = await this.loadDevice();

        /* 绑定 RPC 方法 */
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config and reconnect the QQ bot if its config changed.");

        /* 其他设备修改的配置随数据同步到本机时, 前端不会调用 RPC, 需要监听配置文件 */
        await this.siyuan.storage.watcher.add(".");
    }

    /* 运行中: 连接在后台建立, 不阻塞生命周期 */
    private async onrunning(): Promise<void> {
        await this.applyConfig();
    }

    /* 卸载 */
    private async onunload(): Promise<void> {
        /* 解绑 RPC 方法 */
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG);

        clearTimeout(this.reloadTimer);
        await this.qq.stop();

        // 存储目录被删除后监听会自动失效, 此时 remove 会失败, 所以放在断开连接之后
        await this.siyuan.storage.watcher.remove(".");
    }

    /* 按运行设备启动或停止 QQ 机器人 */
    private async applyConfig(): Promise<void> {
        const device = this.config.qq.device;
        const running = !device || device === this.device;
        if (running !== this.running) {
            void this.siyuan.logger.info(running
                ? `[qq] run the QQ bot on this device ${this.device}`
                : `[qq] the QQ bot runs on device ${device} only, not on this device ${this.device}`);
            this.running = running;
        }

        if (running) {
            await this.qq.update(this.config.qq);
        }
        else {
            await this.qq.stop();
        }
    }

    /* 配置文件变化后 (包括数据同步) 重新读取并应用 */
    private onEvent(event: kernel.TEventMessage): void {
        if (event.type !== "fs-notify" || event.detail?.path !== CONSTANTS.GLOBAL_CONFIG_NAME) {
            return;
        }
        clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(async () => {
            await this.loadConfig();
            await this.applyConfig();
        }, CONFIG_RELOAD_DELAY);
    }

    /* 本机设备 ID, 与前端的 siyuan.config.system.id 相同 */
    private async loadDevice(): Promise<string> {
        try {
            const response = await this.siyuan.client.fetch("/api/system/getConf", { method: "POST", body: "{}" });
            const result = await response.json() as { data?: { conf?: { system?: { id?: string } } } };
            return result.data?.conf?.system?.id ?? "";
        }
        catch (error) {
            void this.siyuan.logger.warn("get the device ID failed:", String(error));
            return "";
        }
    }

    /* 读取前端插件保存的配置 */
    private async loadConfig(): Promise<void> {
        try {
            const data = await this.siyuan.storage.get(CONSTANTS.GLOBAL_CONFIG_NAME);
            this.config = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG, await data.json());
        }
        catch (error) {
            // 前端插件首次加载前还没有配置文件, 此时使用默认配置; 重新读取失败时保留当前配置
            void this.siyuan.logger.info(`load ${CONSTANTS.GLOBAL_CONFIG_NAME} failed, keep the current config:`, String(error));
        }
    }

    /**
     * RPC: update-config
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG]?.(config)`
     */
    private async rpcUpdateConfig(config: IConfig): Promise<void> {
        this.config = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG, config);
        await this.applyConfig();
    }

    /* 打印 QQ 网关推送的事件, 开启事件日志时同时保存到文件, 绑定了收集箱的群聊消息写入收集箱 */
    private onQQDispatch(payload: IPayload): void {
        void this.siyuan.logger.info("[qq] event", payload.t, payload);
        if (this.config.qq.eventLog) {
            void this.writeEventLog(payload);
        }
        this.inbox.handle(payload);
    }

    /**
     * 把事件以不带缩进的 JSON 写入 `logs/events/<事件类型>/<事件 ID>.json`。
     * 使用 siyuan.storage.put 而不是 /api/file/putFile: putFile 写入 data/storage/petal/im-bot/ 时,
     * 内核会通知所有前端该插件的数据已变更, 未覆盖 onDataChanged 的前端插件会因此重新加载。
     */
    private async writeEventLog(payload: IPayload): Promise<void> {
        const path = eventLogPath(payload);
        if (!path) {
            void this.siyuan.logger.debug("[qq] the event has no event ID, skip the event log:", payload.t);
            return;
        }
        try {
            await this.siyuan.storage.put(path, JSON.stringify(payload));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[qq] write event log ${path} failed:`, String(error));
        }
    }
}

void new ImBotKernelPlugin();
