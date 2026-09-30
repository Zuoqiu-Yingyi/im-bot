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
import { QQCommands } from "@/qq/commands";
import { eventLogPath } from "@/qq/event-log";
import { QQBotGateway } from "@/qq/gateway";
import { QQInbox } from "@/qq/inbox";
import { QQNotices } from "@/qq/notices";
import { QQOpenApi, resolveApiRequest, resolveCredentials } from "@/qq/openapi";
import { QQPanels } from "@/qq/panels";

import type * as kernel from "siyuan/kernel";

import type { TNotice } from "@/qq/notices";
import type { IConfig } from "@/types/config";
import type { IApiResponse, IPayload } from "@/types/qq";

const CONFIG_RELOAD_DELAY = 1_000; // 配置文件变化后重新读取的延迟 (ms), 合并一次写入产生的多个文件事件
const OFFLINE_NOTICE_TIMEOUT = 5_000; // 卸载时等待下线通知的最长时间 (ms): 内核会等待 onunload 结束, 退出思源时也是如此

/* 等待 promise 结束 (兑现或拒绝), 最多等待 ms 毫秒 */
function waitAtMost(promise: Promise<unknown>, ms: number): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, ms);
        const done = (): void => {
            clearTimeout(timer);
            resolve();
        };
        promise.then(done, done);
    });
}

/**
 * 内核插件, 构建为 dist/kernel.js。
 * 运行在思源内核的 goja 运行时中 (没有 DOM), 只能通过全局对象 siyuan 调用内核能力。
 * 按插件配置接入 QQ 机器人 WebSocket 网关, 把网关推送的全部事件打印到内核日志, 开启事件日志时同时保存到 logs/events/,
 * 把绑定群聊中没有提及机器人的消息写入收集箱文档, 开始运行与卸载时向这些群发送通知,
 * 响应单聊中以及群主提及机器人发送的 /openid 等指令, 并按配置同步指令面板。
 * 指定了运行设备时, 只有该设备连接网关、发送通知并同步指令面板。
 * 前端可以通过 RPC call-qq-api 以机器人身份调用 QQ 开放平台的服务端接口。
 * kernel.js 以普通脚本 (非 ES module) 执行: 本文件不能 export, 也不能从 external 模块 (如 siyuan) 导入运行时值。
 * Kernel plugin, built to dist/kernel.js. Runs in the goja runtime of the
 * SiYuan kernel (no DOM) and uses the global `siyuan` object. Connects to the
 * QQ bot WebSocket gateway with the plugin config and writes every pushed
 * event to the kernel log, and to logs/events/ when the event log is on. Writes
 * the messages of bound groups that do not mention the bot into inbox documents
 * and notifies these groups when it starts running and when it unloads, answers
 * commands such as /openid sent in C2C chats or by group owners who mention the
 * bot, and syncs the command panels with the config. When a device is set, only
 * that device connects to the gateway, sends the notices and syncs the command
 * panels. The call-qq-api RPC method calls the QQ bot OpenAPI as the bot.
 * kernel.js is evaluated as a plain script, not an ES module: do not export
 * from this file or import runtime values from external modules (e.g. siyuan).
 */
class ImBotKernelPlugin {
    private readonly siyuan: kernel.ISiyuan = siyuan;
    private readonly openapi: QQOpenApi;
    private readonly qq: QQBotGateway;
    private readonly inbox: QQInbox;
    private readonly commands: QQCommands;
    private readonly panels: QQPanels;
    private readonly notices: QQNotices;

    private config: IConfig = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG);
    private device = ""; // 本机设备 ID
    private deviceName = ""; // 本机设备名称, 用于通知
    private running?: boolean; // 上次应用配置时本机是否运行 QQ 机器人
    private panelsSynced?: string; // 最近一次同步指令面板时的凭证与面板配置
    private reloadTimer?: ReturnType<typeof setTimeout>;

    constructor() {
        this.openapi = new QQOpenApi(this.siyuan);
        this.qq = new QQBotGateway(this.siyuan, this.openapi, this.onQQDispatch.bind(this));
        this.inbox = new QQInbox(this.siyuan, () => this.config.qq.inbox);
        this.commands = new QQCommands(this.siyuan, this.openapi, () => this.config.qq);
        this.panels = new QQPanels(this.siyuan, this.openapi);
        this.notices = new QQNotices(this.siyuan, this.openapi);
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
        const device = await this.loadDevice();
        this.device = device.id;
        this.deviceName = device.name;

        /* 绑定 RPC 方法 */
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config and reconnect the QQ bot if its config changed.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.CALL_QQ_API, this.rpcCallQQApi.bind(this), "Call a QQ bot OpenAPI endpoint as the configured bot. Params: url (a path starting with /), method (GET, POST, PUT, PATCH or DELETE), body (optional, sent as JSON). Returns the response { status, headers, body }.");

        /* 其他设备修改的配置随数据同步到本机时, 前端不会调用 RPC, 需要监听配置文件 */
        await this.siyuan.storage.watcher.add(".");
    }

    /* 运行中: 连接与上线通知在后台进行, 不阻塞生命周期 */
    private async onrunning(): Promise<void> {
        await this.applyConfig();
        void this.notify("online");
    }

    /* 卸载 */
    private async onunload(): Promise<void> {
        /* 解绑 RPC 方法 */
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.CALL_QQ_API);

        clearTimeout(this.reloadTimer);
        await waitAtMost(this.notify("offline"), OFFLINE_NOTICE_TIMEOUT);
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
            this.syncPanels();
        }
        else {
            await this.qq.stop();
        }
    }

    /**
     * 在后台同步指令面板: 内核插件开始运行时, 以及凭证或指令面板的配置变化后。
     * 与网关一样只在运行设备上执行, 避免多台设备同时创建同一个面板; 同步失败时, 下次应用配置时重试
     */
    private syncPanels(): void {
        const credentials = resolveCredentials(this.config.qq);
        if (!credentials) {
            return;
        }
        const panels = this.config.qq.panels;
        const key = JSON.stringify([credentials, panels]);
        if (key === this.panelsSynced) {
            return;
        }
        this.panelsSynced = key;
        void this.panels.sync(credentials, [panels.c2c, panels.group]).then((synced) => {
            if (!synced && this.panelsSynced === key) {
                this.panelsSynced = undefined;
            }
        });
    }

    /* 向绑定了收集箱的群发送上线或下线通知, 只在运行 QQ 机器人的设备上发送 */
    private async notify(notice: TNotice): Promise<void> {
        const credentials = resolveCredentials(this.config.qq);
        const groups = this.config.qq.inbox.bindings.map((binding) => binding.group);
        if (!this.running || !credentials || groups.length === 0) {
            return;
        }
        await this.notices.send(credentials, groups, notice, this.deviceName || this.device);
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

    /* 本机设备的 ID 与名称, ID 与前端的 siyuan.config.system.id 相同 */
    private async loadDevice(): Promise<{ id: string; name: string }> {
        try {
            const response = await this.siyuan.client.fetch("/api/system/getConf", { method: "POST", body: "{}" });
            const result = await response.json() as { data?: { conf?: { system?: { id?: string; name?: string } } } };
            const system = result.data?.conf?.system;
            return { id: system?.id ?? "", name: system?.name ?? "" };
        }
        catch (error) {
            void this.siyuan.logger.warn("get the device ID failed:", String(error));
            return { id: "", name: "" };
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

    /**
     * RPC: call-qq-api
     * 以插件设置中的 QQ 机器人身份调用服务端接口 (OpenAPI), 不受运行设备限制。
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.CALL_QQ_API]?.("/v2/groups/{group_openid}/messages", "POST", { content: "...", msg_type: 0 })`
     * @param url - 请求路径, 以 `/` 开头, 相对 https://api.bot.qq.com
     * @param method - 请求方法: GET、POST、PUT、PATCH 或 DELETE, 不区分大小写
     * @param body - 请求体, 以 JSON 发送; 省略或为 null 时不发送请求体
     * @returns 目标的响应, 包括 4xx、5xx 等错误响应
     * @throws 参数无效、未设置 AppID 或 AppSecret、获取凭证失败、内核无法转发或请求超时
     */
    private async rpcCallQQApi(url: unknown, method: unknown, body?: unknown): Promise<IApiResponse> {
        const request = resolveApiRequest(url, method, body);
        const credentials = resolveCredentials(this.config.qq);
        if (!credentials) {
            throw new Error("QQ_BOT_APPID or QQ_BOT_SECRET is not configured");
        }
        return this.openapi.request(credentials, request);
    }

    /* 打印 QQ 网关推送的事件, 开启事件日志时同时保存到文件; 群聊中 @ 机器人的消息作为指令处理, 其余消息写入绑定的收集箱 */
    private onQQDispatch(payload: IPayload): void {
        void this.siyuan.logger.info("[qq] event", payload.t, payload);
        if (this.config.qq.eventLog) {
            void this.writeEventLog(payload);
        }
        this.inbox.handle(payload);
        this.commands.handle(payload);
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
