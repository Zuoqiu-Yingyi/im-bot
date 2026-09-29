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
import { QQBotGateway } from "@/qq/gateway";

import type * as kernel from "siyuan/kernel";

import type { IConfig } from "@/types/config";
import type { IPayload } from "@/types/qq";

/**
 * 内核插件, 构建为 dist/kernel.js。
 * 运行在思源内核的 goja 运行时中 (没有 DOM), 只能通过全局对象 siyuan 调用内核能力。
 * 按插件配置接入 QQ 机器人 WebSocket 网关, 并把网关推送的全部事件打印到内核日志。
 * kernel.js 以普通脚本 (非 ES module) 执行: 本文件不能 export, 也不能从 external 模块 (如 siyuan) 导入运行时值。
 * Kernel plugin, built to dist/kernel.js. Runs in the goja runtime of the
 * SiYuan kernel (no DOM) and uses the global `siyuan` object. Connects to the
 * QQ bot WebSocket gateway with the plugin config and writes every pushed
 * event to the kernel log.
 * kernel.js is evaluated as a plain script, not an ES module: do not export
 * from this file or import runtime values from external modules (e.g. siyuan).
 */
class ImBotKernelPlugin {
    private readonly siyuan: kernel.ISiyuan = siyuan;
    private readonly qq: QQBotGateway;

    private config: IConfig = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG);

    constructor() {
        this.qq = new QQBotGateway(this.siyuan, this.onQQDispatch.bind(this));

        // 绑定生命周期钩子, 内核会等待钩子返回的 Promise 后再进入下一阶段。
        // Wire lifecycle hooks; the kernel awaits returned Promises before advancing.
        this.siyuan.plugin.lifecycle.onload = this.onload.bind(this);
        this.siyuan.plugin.lifecycle.onrunning = this.onrunning.bind(this);
        this.siyuan.plugin.lifecycle.onunload = this.onunload.bind(this);
    }

    /* 加载 */
    private async onload(): Promise<void> {
        await this.loadConfig();

        /* 绑定 RPC 方法 */
        await this.siyuan.rpc.bind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config and reconnect the QQ bot if its config changed.");
    }

    /* 运行中: 连接在后台建立, 不阻塞生命周期 */
    private async onrunning(): Promise<void> {
        await this.qq.update(this.config.qq);
    }

    /* 卸载 */
    private async onunload(): Promise<void> {
        /* 解绑 RPC 方法 */
        await this.siyuan.rpc.unbind(CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG);

        await this.qq.stop();
    }

    /* 读取前端插件保存的配置 */
    private async loadConfig(): Promise<void> {
        try {
            const data = await this.siyuan.storage.get(CONSTANTS.GLOBAL_CONFIG_NAME);
            this.config = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG, await data.json());
        }
        catch (error) {
            // 前端插件首次加载前还没有配置文件
            void this.siyuan.logger.info(`load ${CONSTANTS.GLOBAL_CONFIG_NAME} failed, use the default config:`, String(error));
        }
    }

    /**
     * RPC: update-config
     * 前端插件调用: `await this.kernel.rpc.call[CONSTANTS.KERNEL_RPC_METHOD.UPDATE_CONFIG]?.(config)`
     */
    private async rpcUpdateConfig(config: IConfig): Promise<void> {
        this.config = mergeIgnoreArray<IConfig>(DEFAULT_CONFIG, config);
        await this.qq.update(this.config.qq);
    }

    /* 打印 QQ 网关推送的事件 */
    private onQQDispatch(payload: IPayload): void {
        void this.siyuan.logger.info("[qq] event", payload.t, payload);
    }
}

void new ImBotKernelPlugin();
