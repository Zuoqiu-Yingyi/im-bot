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

import type { IPanel, IPanelConfig, IPanelItem, IPanelList, IPanelRecord } from "@/types/qq";

import type { QQOpenApi, TCredentials } from "./openapi";

const PAGE_SIZE = 50; // GET /v2/panels 每页的最大条数
const MAX_PAGES = 10; // 翻页的上限, 一个机器人最多创建 20 个面板, 通常一页就能取完

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 比较用的面板元素: 省略的 type 视为 command, 其余省略的字段视为空串或 false, 字段顺序固定 */
function normalizeItem(item: IPanelItem): Required<IPanelItem> {
    return {
        type: item.type ?? "command",
        name: item.name ?? "",
        desc: item.desc ?? "",
        only_admin: item.only_admin ?? false,
        link: item.link ?? "",
    };
}

/* 面板的元素与备注是否一致, 这也是 PUT /v2/panels/{panel_id} 能修改的全部内容 */
function samePanel(remote: IPanel | undefined, local: IPanel): boolean {
    const normalize = (panel: IPanel | undefined): string => JSON.stringify({
        items: (panel?.items ?? []).map(normalizeItem),
        remark: panel?.remark ?? "",
    });
    return normalize(remote) === normalize(local);
}

/**
 * 指令面板: 按插件配置同步机器人在 QQ 开放平台上的指令面板。
 * 按 panel.remark 在同一场景的面板中查找, 不存在时创建, 元素或备注与配置不一致时修改。
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/server-inter/menu-panel/
 * Syncs the command panels of the bot with the plugin config: finds the panel
 * with the same panel.remark in the same scope, creates it when missing and
 * updates it when its items or remark differ from the config.
 */
export class QQPanels {
    private readonly siyuan: kernel.ISiyuan;
    private readonly openapi: QQOpenApi;

    private queue: Promise<unknown> = Promise.resolve();

    constructor(siyuan: kernel.ISiyuan, openapi: QQOpenApi) {
        this.siyuan = siyuan;
        this.openapi = openapi;
    }

    /**
     * 同步指令面板。多次调用依次执行, 避免并发查找时重复创建同一个面板
     * @param credentials - 机器人的 AppID 与 AppSecret
     * @param panels - 插件配置中的指令面板
     * @returns 是否全部同步成功, 失败的面板会写入日志
     */
    public sync(credentials: TCredentials, panels: IPanelConfig[]): Promise<boolean> {
        const task = this.queue.then(() => this.syncAll(credentials, panels));
        this.queue = task;
        return task;
    }

    private async syncAll(credentials: TCredentials, panels: IPanelConfig[]): Promise<boolean> {
        let synced = true;
        for (const config of panels) {
            try {
                await this.syncPanel(credentials, config);
            }
            catch (error) {
                synced = false;
                void this.siyuan.logger.warn(`[qq] [panels] sync the ${config?.scope} panel ${JSON.stringify(config?.panel?.remark)} failed:`, errorMessage(error));
            }
        }
        return synced;
    }

    private async syncPanel(credentials: TCredentials, config: IPanelConfig): Promise<void> {
        // 指令面板只能手动编辑 config.json, 面板或 panel 可能为 null
        const remark = config?.panel?.remark;
        if (!remark) {
            throw new Error("panel.remark is empty, so the panel cannot be found after it is created");
        }
        const { scope, panel } = config;

        const record = await this.find(credentials, scope, remark);
        if (!record) {
            const created = await this.call<{ panel_id?: string }>(credentials, "POST", "/v2/panels", config);
            void this.siyuan.logger.info(`[qq] [panels] created the ${scope} panel "${remark}": ${created.panel_id}`);
            return;
        }

        if (config.target_type && record.target_type && config.target_type !== record.target_type) {
            void this.siyuan.logger.warn(`[qq] [panels] the ${scope} panel "${remark}" (${record.panel_id}) has target_type ${record.target_type} instead of ${config.target_type}, which an update cannot change`);
        }
        if (samePanel(record.panel, panel)) {
            void this.siyuan.logger.debug(`[qq] [panels] the ${scope} panel "${remark}" (${record.panel_id}) is up to date`);
            return;
        }
        const updated = await this.call<{ version?: number }>(credentials, "PUT", `/v2/panels/${encodeURIComponent(record.panel_id)}`, { panel });
        void this.siyuan.logger.info(`[qq] [panels] updated the ${scope} panel "${remark}" (${record.panel_id}) to version ${updated.version}`);
    }

    /* 在该场景的面板中查找备注为 remark 的面板, 列表按设置时间倒序排列, 有多个时取最近设置的一个 */
    private async find(credentials: TCredentials, scope: string, remark: string): Promise<IPanelRecord | undefined> {
        let cursor = "";
        for (let page = 0; page < MAX_PAGES; page++) {
            const query = `scope=${encodeURIComponent(scope)}&limit=${PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
            const list = await this.call<IPanelList>(credentials, "GET", `/v2/panels?${query}`);
            const record = list.records?.find((item) => item.panel?.remark === remark);
            if (record) {
                return record;
            }
            if (list.is_end || !list.next_cursor) {
                return undefined;
            }
            cursor = list.next_cursor;
        }
        // 没有取完就创建可能会重复创建
        throw new Error(`the ${scope} panels have more than ${MAX_PAGES} pages`);
    }

    /* 调用 OpenAPI, 状态码不是 2xx 或响应体不是 JSON 对象时抛出错误 */
    private async call<T extends object>(credentials: TCredentials, method: string, url: string, body?: unknown): Promise<T> {
        const response = await this.openapi.request(credentials, { url, method, body });
        if (response.status < 200 || response.status >= 300 || typeof response.body !== "object" || response.body === null) {
            throw new Error(`${method} ${url} failed: ${response.status} ${JSON.stringify(response.body)}`);
        }
        return response.body as T;
    }
}
