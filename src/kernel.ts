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

import { mergeConfig } from "@/configs/default";
import CONSTANTS from "@/constants";
import { QQCommands } from "@/qq/commands";
import { eventLogPath } from "@/qq/event-log";
import { QQBotGateway } from "@/qq/gateway";
import { activeBindings, QQInbox } from "@/qq/inbox";
import { QQNotices } from "@/qq/notices";
import { QQOpenApi, resolveApiRequest, resolveCredentials } from "@/qq/openapi";
import { QQPanels } from "@/qq/panels";
import { QQUsers } from "@/qq/users";
import { InboxWriter } from "@/utils/inbox";
import { WeixinApi } from "@/weixin/api";
import { WeixinInbox } from "@/weixin/inbox";
import { WeixinLogin } from "@/weixin/login";
import { WeixinMedia } from "@/weixin/media";
import { messageId } from "@/weixin/message";
import { WeixinPoller } from "@/weixin/poller";

import type * as kernel from "siyuan/kernel";

import type { TNotice } from "@/qq/notices";
import type { IConfig } from "@/types/config";
import type { IApiResponse, IPayload, IQQConnectionState } from "@/types/qq";
import type { IBotUsers } from "@/types/users";
import type {
    IWeixinAccount,
    IWeixinAccountState,
    IWeixinLoginState,
    IWeixinMessage,
} from "@/types/weixin";
import type { IConfirmedLogin } from "@/weixin/login";

const CONFIG_RELOAD_DELAY = 1_000; // 配置文件变化后重新读取的延迟 (ms), 合并一次写入产生的多个文件事件
const OFFLINE_NOTICE_TIMEOUT = 5_000; // 卸载时等待下线通知的最长时间 (ms): 内核会等待 onunload 结束, 退出思源时也是如此
const WEIXIN_MESSAGE_LOG_DIRECTORY = "logs/weixin/messages"; // 微信消息日志目录, 相对插件数据目录

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 校验 weixin.json 的内容 */
function resolveWeixinAccount(data: unknown): IWeixinAccount {
    const account = data as null | Partial<IWeixinAccount>;
    const required = ["botId", "token", "baseUrl", "device", "loginTime"] as const;
    const missing = required.filter((key) => typeof account?.[key] !== "string" || !account[key]);
    if (!account || missing.length > 0) {
        throw new Error(`missing ${missing.join(", ")}`);
    }
    return {
        botId: account.botId!,
        token: account.token!,
        baseUrl: account.baseUrl!,
        userId: typeof account.userId === "string" ? account.userId : "",
        device: account.device!,
        deviceName: typeof account.deviceName === "string" ? account.deviceName : "",
        loginTime: account.loginTime!,
    };
}

/**
 * 按键名排序的 JSON, 用作比较的键。
 * 前端经 RPC 传来的配置在 goja 中是 Go map, 键的遍历顺序是随机的, 直接 JSON.stringify 的结果每次都可能不同
 */
function sortedJson(value: unknown): string {
    return JSON.stringify(value, (_key, item: unknown) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return item;
        }
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(item).sort()) {
            sorted[key] = (item as Record<string, unknown>)[key];
        }
        return sorted;
    });
}

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
 * 把绑定群聊中没有提及机器人的消息写入收集箱文档, 上线与下线时向开启了通知的绑定群聊发送通知,
 * 响应单聊中以及群主提及机器人发送的 /openid 等指令, 并按配置同步指令面板,
 * 把群与单聊用户的事件汇总到 users.json (已知的群与单聊用户及其状态)。
 * 关闭上线开关时不连接网关; 指定了运行设备时, 只有该设备连接网关、发送通知并同步指令面板。
 * 微信 ClawBot 扫码登录后 (RPC weixin-login-*), 打开上线开关时在扫码登录的设备上以长轮询接收消息并写入收集箱, 登录信息保存在 weixin.json 中;
 * 内核的 siyuan.crypto 支持 AES-ECB 时, 消息中的媒体解密后保存为资源文件, 否则显示为占位文本。
 * 前端可以通过 RPC call-qq-api 以机器人身份调用 QQ 开放平台的服务端接口, 通过 RPC get-users 获取已知的群与单聊用户,
 * 通过 RPC qq-get-state 获取本设备上 QQ 机器人的连接状态。
 * kernel.js 以普通脚本 (非 ES module) 执行: 本文件不能 export, 也不能从 external 模块 (如 siyuan) 导入运行时值。
 * Kernel plugin, built to dist/kernel.js. Runs in the goja runtime of the
 * SiYuan kernel (no DOM) and uses the global `siyuan` object. Connects to the
 * QQ bot WebSocket gateway with the plugin config and writes every pushed
 * event to the kernel log, and to logs/events/ when the event log is on. Writes
 * the messages of bound groups that do not mention the bot into inbox documents
 * and notifies the groups whose bindings turn on notices when the bot goes
 * online and offline, answers commands such as /openid sent in C2C chats or by
 * group owners who mention the bot, syncs the command panels with the config,
 * and keeps the known groups and C2C users with their status in users.json
 * from the events. With the online switch off, it does not connect to the
 * gateway; when a device is set, only that device connects to the gateway,
 * sends the notices and syncs the command panels. The call-qq-api RPC method
 * calls the QQ bot OpenAPI as the bot, get-users returns the known groups and
 * C2C users, and qq-get-state returns the connection state of the QQ bot on
 * this device. After a WeChat ClawBot QR code login (weixin-login-* RPC
 * methods) and with its online switch on, the device that logged in long-polls
 * its messages into the inbox; the login is kept in weixin.json. When
 * siyuan.crypto of the kernel supports AES-ECB, the media of the messages are
 * decrypted and saved as assets, otherwise they are written as placeholders.
 * kernel.js is evaluated as a plain script, not an ES module: do not export
 * from this file or import runtime values from external modules (e.g. siyuan).
 */
class ImBotKernelPlugin {
    private readonly siyuan: kernel.ISiyuan = siyuan;
    private readonly writer: InboxWriter;
    private readonly openapi: QQOpenApi;
    private readonly qq: QQBotGateway;
    private readonly inbox: QQInbox;
    private readonly commands: QQCommands;
    private readonly panels: QQPanels;
    private readonly notices: QQNotices;
    private readonly users: QQUsers;
    private readonly weixinApi: WeixinApi;
    private readonly weixinLogin: WeixinLogin;
    private readonly weixinPoller: WeixinPoller;
    private readonly weixinMedia: WeixinMedia;
    private readonly weixinInbox: WeixinInbox;

    private config: IConfig = mergeConfig();
    private weixinAccount?: IWeixinAccount; // weixin.json 中的微信登录信息
    private weixinRunning?: boolean; // 上次应用登录信息与配置时本机是否接收微信消息
    /**
     * 已失效的登录 (bot_token) 与发现失效的时间。只保存在内存中: 写入随数据同步的 weixin.json 可能与其他设备上的新登录冲突。
     * 插件重新启动后会用失效的登录再请求一次, 收到 -14 后再次停止
     */
    private weixinExpired?: { token: string; time: string };
    private weixinReloadTimer?: ReturnType<typeof setTimeout>;
    private device = ""; // 本机设备 ID
    private deviceName = ""; // 本机设备名称, 用于通知
    private running?: boolean; // 上次应用配置时本机是否运行 QQ 机器人
    private panelsSynced?: string; // 最近一次同步指令面板时的凭证与面板配置
    private reloadTimer?: ReturnType<typeof setTimeout>;

    constructor() {
        this.writer = new InboxWriter(this.siyuan, () => this.config.qq.inbox.downloadAssets);
        this.openapi = new QQOpenApi(this.siyuan);
        this.qq = new QQBotGateway(this.siyuan, this.openapi, this.onQQDispatch.bind(this));
        this.inbox = new QQInbox(this.siyuan, this.openapi, this.writer, () => this.config.qq);
        this.commands = new QQCommands(this.siyuan, this.openapi, () => this.config.qq);
        this.panels = new QQPanels(this.siyuan, this.openapi);
        this.notices = new QQNotices(this.siyuan, this.openapi);
        this.users = new QQUsers(this.siyuan, () => this.config.qq);
        this.weixinApi = new WeixinApi(this.siyuan);
        this.weixinLogin = new WeixinLogin(this.siyuan, this.weixinApi, this.onWeixinLogin.bind(this));
        this.weixinPoller = new WeixinPoller(this.siyuan, this.weixinApi, this.onWeixinMessage.bind(this), this.onWeixinExpired.bind(this));
        this.weixinMedia = new WeixinMedia(this.siyuan);
        this.weixinInbox = new WeixinInbox(this.siyuan, this.weixinApi, this.writer, this.weixinMedia, () => this.config.weixin);
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
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config, then connect or disconnect the QQ bot and start or stop receiving WeChat messages as the new config says.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.CALL_QQ_API, this.rpcCallQQApi.bind(this), "Call a QQ bot OpenAPI endpoint as the configured bot. Params: url (a path starting with /), method (GET, POST, PUT, PATCH or DELETE), body (optional, sent as JSON). Returns the response { status, headers, body }.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.GET_USERS, this.rpcGetUsers.bind(this), "Get the known groups and C2C users of the configured bot from users.json, including the changes not written yet. Returns { groups, users }, keyed by group_openid and user_openid.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.QQ_GET_STATE, this.rpcQQGetState.bind(this), "Get the connection state of the QQ bot on this device. Returns { status, since?, username?, error?, retryAt?, device? }.");
        await this.loadWeixinAccount();
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT, this.rpcWeixinGetAccount.bind(this), "Get the WeChat bot login without its token, or null when not logged in. Returns { botId, userId, device, deviceName, loginTime, expiredAt?, running }.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START, this.rpcWeixinLoginStart.bind(this), "Start a WeChat QR code login and cancel the current one. Returns the login state { status, url?, wrongCode?, error?, account? }, where url is the link to show as a QR code.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE, this.rpcWeixinLoginState.bind(this), "Get the state of the WeChat QR code login.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY, this.rpcWeixinLoginVerify.bind(this), "Submit the digits shown on the phone when the WeChat login status is need_verifycode. Params: code. Returns the login state.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL, this.rpcWeixinLoginCancel.bind(this), "Cancel the WeChat QR code login. Returns the login state.");
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGOUT, this.rpcWeixinLogout.bind(this), "Log out of WeChat: stop receiving messages and remove the login from weixin.json.");

        /* 其他设备修改的配置随数据同步到本机时, 前端不会调用 RPC, 需要监听配置文件 */
        await this.siyuan.storage.watcher.add(".");
    }

    /* 运行中: 连接与上线通知在后台进行, 不阻塞生命周期 */
    private async onrunning(): Promise<void> {
        await this.applyConfig();
    }

    /* 卸载 */
    private async onunload(): Promise<void> {
        /* 解绑 RPC 方法 */
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.CALL_QQ_API);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.GET_USERS);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.QQ_GET_STATE);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL);
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGOUT);

        clearTimeout(this.reloadTimer);
        clearTimeout(this.weixinReloadTimer);
        this.weixinLogin.cancel();
        // 运行中的 QQ 机器人发送下线通知, 与微信 notifystop 同时发送, 各自最多等待 5 秒
        await Promise.all([
            waitAtMost(this.running ? this.notify("offline") : Promise.resolve(), OFFLINE_NOTICE_TIMEOUT),
            waitAtMost(this.weixinPoller.stop(), OFFLINE_NOTICE_TIMEOUT),
        ]);
        await this.qq.stop();
        // 断开连接后不会再有新的事件, 把还没写入的变化写入 users.json
        await this.users.flush();

        // 存储目录被删除后监听会自动失效, 此时 remove 会失败, 所以放在断开连接之后
        await this.siyuan.storage.watcher.remove(".");
    }

    /* 应用配置: QQ 机器人与微信机器人各自按上线开关等条件开始或停止运行 */
    private async applyConfig(): Promise<void> {
        this.applyWeixin();
        await this.applyQQ();
    }

    /**
     * 按上线开关与运行设备启动或停止 QQ 机器人。
     * 开始运行 (包括内核插件开始运行时) 时发送上线通知, 停止运行时发送下线通知, 通知在后台发送
     */
    private async applyQQ(): Promise<void> {
        const { device, online } = this.config.qq;
        const running = online && (!device || device === this.device);
        const previous = this.running;
        if (running !== previous) {
            void this.siyuan.logger.info(running
                ? `[qq] run the QQ bot on this device ${this.device}`
                : online
                    ? `[qq] the QQ bot runs on device ${device} only, not on this device ${this.device}`
                    : "[qq] the QQ bot is offline");
            this.running = running;
        }

        if (running) {
            await this.qq.update(this.config.qq);
            this.syncPanels();
            if (!previous) {
                void this.notify("online");
            }
        }
        else {
            if (previous) {
                void this.notify("offline");
            }
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
        const key = sortedJson([credentials, panels]);
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

    /* 向开启了通知的生效绑定所在的群发送上线或下线通知; 由调用方确保只在运行 QQ 机器人的设备上发送 */
    private async notify(notice: TNotice): Promise<void> {
        const credentials = resolveCredentials(this.config.qq);
        const groups = activeBindings(this.config.qq.inbox).filter((binding) => binding.notify).map((binding) => binding.group);
        if (!credentials || groups.length === 0) {
            return;
        }
        await this.notices.send(credentials, groups, notice, this.deviceName || this.device);
    }

    /* 配置文件与微信登录信息变化后 (包括数据同步) 重新读取并应用 */
    private onEvent(event: kernel.TEventMessage): void {
        if (event.type !== "fs-notify") {
            return;
        }
        switch (event.detail?.path) {
            case CONSTANTS.GLOBAL_CONFIG_NAME:
                clearTimeout(this.reloadTimer);
                this.reloadTimer = setTimeout(async () => {
                    await this.loadConfig();
                    await this.applyConfig();
                }, CONFIG_RELOAD_DELAY);
                break;

            case CONSTANTS.WEIXIN_ACCOUNT_FILE_NAME:
                clearTimeout(this.weixinReloadTimer);
                this.weixinReloadTimer = setTimeout(async () => {
                    await this.loadWeixinAccount();
                    this.applyWeixin();
                }, CONFIG_RELOAD_DELAY);
                break;
        }
    }

    /* 登录失效的时间, 没有失效时为 undefined */
    private weixinExpiredAt(account: IWeixinAccount): string | undefined {
        return this.weixinExpired?.token === account.token ? this.weixinExpired.time : undefined;
    }

    /* 按上线开关与 weixin.json 开始或停止接收微信消息: 只在上线时、在扫码登录的设备上, 且登录没有失效时接收 */
    private applyWeixin(): void {
        const account = this.weixinAccount;
        const online = this.config.weixin.online;
        const expiredAt = account && this.weixinExpiredAt(account);
        const running = online && !!account && !expiredAt && account.device === this.device;
        if (account && running !== this.weixinRunning) {
            void this.siyuan.logger.info(running
                ? `[weixin] receive the messages of bot ${account.botId} on this device ${this.device}`
                : expiredAt
                    ? `[weixin] the login of bot ${account.botId} expired at ${expiredAt}, scan the QR code again`
                    : online
                        ? `[weixin] bot ${account.botId} receives messages on device ${account.device} only, not on this device ${this.device}`
                        : `[weixin] bot ${account.botId} is offline`);
        }
        this.weixinRunning = running;

        if (running) {
            this.weixinPoller.start(account);
        }
        else {
            void this.weixinPoller.stop();
        }
    }

    /* 读取 weixin.json; 没有该文件或内容无效时视为未登录 */
    private async loadWeixinAccount(): Promise<void> {
        let data: kernel.IDataObject;
        try {
            data = await this.siyuan.storage.get(CONSTANTS.WEIXIN_ACCOUNT_FILE_NAME);
        }
        catch {
            // 还没有登录, 或已退出登录
            this.weixinAccount = undefined;
            return;
        }
        try {
            this.weixinAccount = resolveWeixinAccount(await data.json());
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] ${CONSTANTS.WEIXIN_ACCOUNT_FILE_NAME} is invalid, treat it as logged out:`, errorMessage(error));
            this.weixinAccount = undefined;
        }
    }

    private async saveWeixinAccount(account: IWeixinAccount): Promise<void> {
        await this.siyuan.storage.put(CONSTANTS.WEIXIN_ACCOUNT_FILE_NAME, JSON.stringify(account, undefined, 4));
        this.weixinAccount = account;
    }

    /* 返回给前端的登录信息, 不含 bot_token 与接口地址 */
    private weixinAccountState(account: IWeixinAccount): IWeixinAccountState {
        return {
            botId: account.botId,
            userId: account.userId,
            device: account.device,
            deviceName: account.deviceName,
            loginTime: account.loginTime,
            expiredAt: this.weixinExpiredAt(account),
            running: this.weixinPoller.running,
        };
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
            this.config = mergeConfig(await data.json());
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
        this.config = mergeConfig(config);
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

    /**
     * RPC: get-users
     * 插件设置中的机器人已知的群与单聊用户, 包括还没写入 users.json 的变化, 不受运行设备限制。
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.GET_USERS]()`
     * @returns 以 group_openid 与 user_openid 为键的群与单聊用户, 没有记录时都为空
     * @throws 未设置 AppID, 或 users.json 不是 JSON 对象
     */
    private async rpcGetUsers(): Promise<IBotUsers> {
        const appid = this.config.qq.appid.trim();
        if (!appid) {
            throw new Error("QQ_BOT_APPID is not configured");
        }
        return this.users.list(appid);
    }

    /**
     * RPC: qq-get-state
     * 本设备上 QQ 机器人的连接状态: 上线开关关闭或只在其他设备上运行时不连接, 否则为网关的连接状态。
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.QQ_GET_STATE]()`
     */
    private rpcQQGetState(): IQQConnectionState {
        const { device, online } = this.config.qq;
        if (!online) {
            return { status: "offline" };
        }
        if (device && device !== this.device) {
            return { status: "other-device", device };
        }
        return this.qq.state;
    }

    /**
     * RPC: weixin-get-account
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT]()`
     * @returns 微信登录信息 (不含 bot_token), 没有登录时为 null
     */
    private rpcWeixinGetAccount(): IWeixinAccountState | null {
        return this.weixinAccount ? this.weixinAccountState(this.weixinAccount) : null;
    }

    /**
     * RPC: weixin-login-start
     * 开始扫码登录, 并取消进行中的登录; 在哪台设备上扫码登录, 就由哪台设备接收消息。
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START]()`
     * @returns 登录状态, url 为要显示为二维码的链接
     */
    private async rpcWeixinLoginStart(): Promise<IWeixinLoginState> {
        return this.weixinLogin.start();
    }

    /**
     * RPC: weixin-login-state
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE]()`
     */
    private rpcWeixinLoginState(): IWeixinLoginState {
        return this.weixinLogin.current();
    }

    /**
     * RPC: weixin-login-verify
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY]("1234")`
     * @param code - 手机微信上显示的数字
     * @throws 登录没有在等待输入数字, 或输入的不是数字
     */
    private rpcWeixinLoginVerify(code: unknown): IWeixinLoginState {
        return this.weixinLogin.verify(code);
    }

    /**
     * RPC: weixin-login-cancel
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL]()`
     */
    private rpcWeixinLoginCancel(): IWeixinLoginState {
        return this.weixinLogin.cancel();
    }

    /**
     * RPC: weixin-logout
     * 停止接收消息并删除 weixin.json; 删除随数据同步到其他设备后, 正在接收消息的设备也会停止。
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGOUT]()`
     */
    private async rpcWeixinLogout(): Promise<void> {
        this.weixinLogin.cancel();
        const account = this.weixinAccount;
        this.weixinAccount = undefined;
        this.weixinRunning = false;
        await this.weixinPoller.stop();
        await this.siyuan.storage.remove(CONSTANTS.WEIXIN_ACCOUNT_FILE_NAME);
        await this.weixinPoller.removeCursor();
        void this.siyuan.logger.info(`[weixin] logged out${account ? ` of bot ${account.botId}` : ""}`);
    }

    /* 扫码确认: 保存登录信息, 由本设备接收消息 */
    private async onWeixinLogin(login: IConfirmedLogin): Promise<IWeixinAccountState> {
        const account: IWeixinAccount = {
            ...login,
            device: this.device,
            deviceName: this.deviceName,
            loginTime: new Date().toISOString(),
        };
        await this.saveWeixinAccount(account);
        this.applyWeixin();
        return this.weixinAccountState(account);
    }

    /* 登录失效: 记录失效时间, 重新扫码后才再次接收消息 */
    private onWeixinExpired(account: IWeixinAccount): void {
        this.weixinExpired = { token: account.token, time: new Date().toISOString() };
        this.applyWeixin();
    }

    /* 打印收到的微信消息, 开启事件日志时同时保存到文件; 用户发送的消息写入收集箱 */
    private onWeixinMessage(account: IWeixinAccount, message: IWeixinMessage): void {
        void this.siyuan.logger.info("[weixin] message", message);
        if (this.config.weixin.eventLog) {
            void this.writeWeixinMessageLog(message);
        }
        this.weixinInbox.handle(account, message);
    }

    /* 把消息以不带缩进的 JSON 写入 `logs/weixin/messages/<消息 ID>.json`, 理由同 writeEventLog */
    private async writeWeixinMessageLog(message: IWeixinMessage): Promise<void> {
        const id = messageId(message)?.replace(/[^\w-]/g, "_");
        if (!id) {
            void this.siyuan.logger.debug("[weixin] the message has no message ID, skip the message log");
            return;
        }
        const path = `${WEIXIN_MESSAGE_LOG_DIRECTORY}/${id}.json`;
        try {
            await this.siyuan.storage.put(path, JSON.stringify(message));
        }
        catch (error) {
            void this.siyuan.logger.warn(`[weixin] write message log ${path} failed:`, errorMessage(error));
        }
    }

    /* 打印 QQ 网关推送的事件, 开启事件日志时同时保存到文件; 群聊中 @ 机器人的消息作为指令处理, 其余消息写入绑定的收集箱; 群与单聊用户的事件汇总到 users.json */
    private onQQDispatch(payload: IPayload): void {
        void this.siyuan.logger.info("[qq] event", payload.t, payload);
        if (this.config.qq.eventLog) {
            void this.writeEventLog(payload);
        }
        this.inbox.handle(payload);
        this.commands.handle(payload);
        this.users.handle(payload);
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
