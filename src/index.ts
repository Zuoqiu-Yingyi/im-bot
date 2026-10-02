// Copyright (C) 2024 Zuoqiu Yingyi
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

import * as sdk from "@siyuan-community/siyuan-sdk";
import siyuan from "siyuan";
import { mount, unmount } from "svelte";

import { FLAG_MOBILE } from "@workspace/utils/env/front-end";
import { Logger } from "@workspace/utils/logger";
import { mergeIgnoreArray } from "@workspace/utils/misc/merge";

import icon_qq from "./assets/symbols/icon-qq.symbol?raw";
import icon_wechat from "./assets/symbols/icon-wechat.symbol?raw";
import { DEFAULT_CONFIG } from "./configs/default";
import CONSTANTS from "./constants";

import ApiDebugger from "./components/ApiDebugger.svelte";
import Messenger from "./components/Messenger.svelte";
import Settings from "./components/Settings.svelte";

import type { ISiyuanGlobal } from "@workspace/types/siyuan";

import type { IConfig } from "./types/config";
import type { IApiResponse } from "./types/qq";
import type { IBotUsers } from "./types/users";
import type { IWeixinAccountState, IWeixinLoginState } from "./types/weixin";
import type { I18N } from "./utils/i18n";

import type { IApiDebuggerTabData } from "./components/ApiDebugger.svelte";
import type { IMessengerTabData } from "./components/Messenger.svelte";

import "./styles/siyuan.less";

declare const _globalThis: ISiyuanGlobal;

/* QQ 机器人接口调试页签 */
export interface IApiDebuggerTab extends siyuan.Custom {
    data: IApiDebuggerTabData;
    component?: ReturnType<typeof mount>;
}

/* 向已知的群与单聊用户发送消息的页签 */
export interface IMessengerTab extends siyuan.Custom {
    data: IMessengerTabData;
    component?: ReturnType<typeof mount>;
}

export default class ImBotPlugin extends siyuan.Plugin {
    public static readonly GLOBAL_CONFIG_NAME = CONSTANTS.GLOBAL_CONFIG_NAME;
    public static readonly API_DEBUGGER_TAB_TYPE = "-api-debugger";
    public static readonly MESSENGER_TAB_TYPE = "-messenger";

    // @ts-expect-error ignore original type
    declare public readonly i18n: I18N;

    public readonly siyuan = siyuan;
    public readonly logger: InstanceType<typeof Logger>;
    public readonly client: InstanceType<typeof sdk.Client>;

    protected readonly SETTINGS_DIALOG_ID: string;
    protected readonly API_DEBUGGER_TAB_ID: string;
    protected readonly MESSENGER_TAB_ID: string;

    protected config: IConfig = mergeIgnoreArray(DEFAULT_CONFIG);

    constructor(options: any) {
        super(options);

        this.logger = new Logger(this.name);
        this.client = new sdk.Client(undefined, "fetch");

        this.SETTINGS_DIALOG_ID = `${this.name}-settings-dialog`;
        this.API_DEBUGGER_TAB_ID = `${this.name}${ImBotPlugin.API_DEBUGGER_TAB_TYPE}`;
        this.MESSENGER_TAB_ID = `${this.name}${ImBotPlugin.MESSENGER_TAB_TYPE}`;

        // eslint-disable-next-line ts/no-this-alias
        const plugin = this;
        this.addTab({
            type: ImBotPlugin.API_DEBUGGER_TAB_TYPE,
            init(this: IApiDebuggerTab) {
                this.component = mount(ApiDebugger, {
                    target: this.element,
                    props: {
                        plugin,
                        tab: this,
                    },
                });
            },
            destroy(this: IApiDebuggerTab) {
                if (this.component) {
                    void unmount(this.component);
                    delete this.component;
                }
            },
        });
        this.addTab({
            type: ImBotPlugin.MESSENGER_TAB_TYPE,
            init(this: IMessengerTab) {
                this.component = mount(Messenger, {
                    target: this.element,
                    props: {
                        plugin,
                        tab: this,
                    },
                });
            },
            destroy(this: IMessengerTab) {
                if (this.component) {
                    void unmount(this.component);
                    delete this.component;
                }
            },
        });
    }

    public override async onload(): Promise<void> {
        // this.logger.debug(this);

        /* 注册图标 */
        this.addIcons([
            icon_qq,
            icon_wechat,
        ].join(""));

        /**
         * 注册命令, 在 onload 结束后即刻解析, 因此不能在回调函数中注册。
         * 思源移动端不能打开自定义页签, 因此只在桌面端注册
         */
        if (!FLAG_MOBILE) {
            this.addCommand({
                langKey: "openApiDebugger",
                langText: this.i18n.apiDebugger.open,
                hotkey: "",
                callback: () => this.openApiDebugger(),
            });
            this.addCommand({
                langKey: "openMessenger",
                langText: this.i18n.messenger.open,
                hotkey: "",
                callback: () => this.openMessenger(),
            });
        }

        try {
            const config = await this.loadData(ImBotPlugin.GLOBAL_CONFIG_NAME);
            if (config) {
                this.config = mergeIgnoreArray(DEFAULT_CONFIG, config) as IConfig;
            }
            else {
                this.config = mergeIgnoreArray(DEFAULT_CONFIG);
                this.updateConfig();
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }

    public override onLayoutReady(): void {}

    public override onunload(): void {}

    public override openSetting(): void {
        const dialog = new siyuan.Dialog({
            title: `${this.displayName} <code class="fn__code">${this.name}</code>`,
            content: `<div id="${this.SETTINGS_DIALOG_ID}" class="fn__flex-column" />`,
            width: FLAG_MOBILE ? "92vw" : "720px",
            height: FLAG_MOBILE ? undefined : "640px",
        });
        const target = dialog.element.querySelector(`#${this.SETTINGS_DIALOG_ID}`);
        if (target) {
            mount(Settings, {
                target,
                props: {
                    config: this.config,
                    plugin: this,
                },
            });
        }
    }

    /* 重置插件配置 */
    public async resetConfig(): Promise<void> {
        return this.updateConfig(mergeIgnoreArray(DEFAULT_CONFIG) as IConfig);
    }

    /* 更新插件配置 */
    public async updateConfig(config?: IConfig): Promise<void> {
        if (config && config !== this.config) {
            this.config = config;
        }
        await this.saveData(ImBotPlugin.GLOBAL_CONFIG_NAME, JSON.stringify(this.config, undefined, 4));
        await this.updateKernelConfig();
    }

    /* 打开 QQ 机器人接口调试页签, 已有未编辑过的调试页签时切换到该页签 */
    public openApiDebugger(): void {
        const data: IApiDebuggerTabData = {
            method: "GET",
            url: "",
            body: "",
        };
        void siyuan.openTab({
            app: this.app,
            custom: {
                icon: "iconBug",
                title: this.i18n.apiDebugger.title,
                id: this.API_DEBUGGER_TAB_ID,
                data,
            },
            keepCursor: false,
            removeCurrentTab: false,
        });
    }

    /* 打开向已知的群与单聊用户发送消息的页签, 已有未编辑过的该页签时切换到该页签 */
    public openMessenger(): void {
        const data: IMessengerTabData = {
            target: "",
            type: "text",
            content: "",
            wakeup: false,
        };
        void siyuan.openTab({
            app: this.app,
            custom: {
                icon: "iconSend",
                title: this.i18n.messenger.title,
                id: this.MESSENGER_TAB_ID,
                data,
            },
            keepCursor: false,
            removeCurrentTab: false,
        });
    }

    /**
     * 通过内核插件的 RPC get-users, 获取插件设置中的 QQ 机器人已知的群与单聊用户, 包括还没写入 users.json 的变化
     * @returns 以 group_openid 与 user_openid 为键的群与单聊用户
     * @throws 未设置 AppID、users.json 不是 JSON 对象或内核插件没有运行时以 JSON-RPC 错误拒绝
     */
    public async getUsers(): Promise<IBotUsers> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.GET_USERS]?.();
    }

    /**
     * 通过内核插件的 RPC call-qq-api, 以插件设置中的 QQ 机器人身份调用服务端接口 (OpenAPI)
     * @param url - 请求路径, 以 `/` 开头, 相对 https://api.bot.qq.com
     * @param method - 请求方法: GET、POST、PUT、PATCH 或 DELETE
     * @param body - 请求体, 以 JSON 发送; 省略时不发送请求体
     * @returns 目标的响应, 包括 4xx、5xx 等错误响应
     * @throws 请求未能发出时 (参数无效、未设置 AppID 或 AppSecret、获取凭证失败或内核无法转发请求) 以 JSON-RPC 错误拒绝
     */
    public async callQQApi(url: string, method: string, body?: unknown): Promise<IApiResponse> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.CALL_QQ_API]?.(url, method, body);
    }

    /**
     * 通过内核插件的 RPC weixin-get-account, 获取微信登录信息 (不含 bot_token)
     * @returns 没有登录时为 null
     * @throws 内核插件没有运行时以 JSON-RPC 错误拒绝
     */
    public async getWeixinAccount(): Promise<IWeixinAccountState | null> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT]?.() ?? null;
    }

    /* 通过内核插件的 RPC weixin-login-start, 开始微信扫码登录; 在哪台设备上扫码登录, 就由哪台设备接收消息 */
    public async startWeixinLogin(): Promise<IWeixinLoginState> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START]?.();
    }

    /* 通过内核插件的 RPC weixin-login-state, 获取微信扫码登录的状态 */
    public async getWeixinLoginState(): Promise<IWeixinLoginState> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE]?.();
    }

    /* 通过内核插件的 RPC weixin-login-verify, 提交手机微信上显示的数字 */
    public async verifyWeixinLogin(code: string): Promise<IWeixinLoginState> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY]?.(code);
    }

    /* 通过内核插件的 RPC weixin-login-cancel, 取消微信扫码登录 */
    public async cancelWeixinLogin(): Promise<IWeixinLoginState> {
        return this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL]?.();
    }

    /* 通过内核插件的 RPC weixin-logout, 停止接收微信消息并删除登录信息 */
    public async logoutWeixin(): Promise<void> {
        await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.WEIXIN_LOGOUT]?.();
    }

    /* 同步配置到内核插件, QQ 机器人配置变化时内核插件会重新连接 */
    public async updateKernelConfig(): Promise<void> {
        try {
            await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG]?.(this.config);
        }
        catch (error) {
            this.logger.warn(error);
        }
    }
}
