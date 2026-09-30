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

import type { QQOpenApi, TCredentials } from "./openapi";

/* 通知类型: online 为内核插件开始运行, offline 为内核插件卸载 */
export type TNotice = "offline" | "online";

/* 通知文本, {{1}} 为设备名称 */
const DEFAULT_TEXTS: Record<TNotice, string> = {
    offline: "Inbox offline: messages of this group are not recorded for now (device: {{1}})",
    online: "Inbox online: messages of this group are recorded in SiYuan (device: {{1}})",
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * 收集箱通知: 以主动消息向绑定了收集箱的群发送内核插件的上线与下线通知。
 * 主动消息受 QQ 的频率限制, 用户或群关闭主动消息时会发送失败, 失败时只记录日志。
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/overview.html
 * Sends online and offline notices of the kernel plugin to the groups bound to
 * inbox documents as active messages; a failed notice is only logged.
 */
export class QQNotices {
    private readonly siyuan: kernel.ISiyuan;
    private readonly openapi: QQOpenApi;

    constructor(siyuan: kernel.ISiyuan, openapi: QQOpenApi) {
        this.siyuan = siyuan;
        this.openapi = openapi;
    }

    /**
     * 向每个群发送一条通知, 同时发送, 全部结束 (成功或失败) 后兑现
     * @param credentials - 机器人的 AppID 与 AppSecret
     * @param groups - 群的 group_openid, 重复的只发送一次
     * @param notice - 通知类型
     * @param device - 通知中的设备名称
     */
    public async send(credentials: TCredentials, groups: string[], notice: TNotice, device: string): Promise<void> {
        const content = this.text(notice).replaceAll("{{1}}", device);
        await Promise.all([...new Set(groups)].map((group) => this.sendTo(credentials, group, notice, content)));
    }

    private async sendTo(credentials: TCredentials, group: string, notice: TNotice, content: string): Promise<void> {
        try {
            const response = await this.openapi.request(credentials, {
                url: `/v2/groups/${encodeURIComponent(group)}/messages`,
                method: "POST",
                body: {
                    msg_type: 0,
                    content,
                },
            });
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`${response.status} ${JSON.stringify(response.body)}`);
            }
            void this.siyuan.logger.info(`[qq] [notices] sent the ${notice} notice to group ${group}`);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[qq] [notices] send the ${notice} notice to group ${group} failed:`, errorMessage(error));
        }
    }

    private text(notice: TNotice): string {
        const texts = this.siyuan.plugin.i18n?.notices as Partial<Record<TNotice, string>> | undefined;
        return texts?.[notice] || DEFAULT_TEXTS[notice];
    }
}
