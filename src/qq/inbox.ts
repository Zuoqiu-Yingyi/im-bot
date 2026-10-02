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

import { messageDate } from "@/utils/inbox";

import { GROUP_MESSAGE_EVENTS, MessageType } from "./constants";
import { convertMessage, mentionsBot, sceneValue } from "./message";
import { resolveCredentials } from "./openapi";

import type * as kernel from "siyuan/kernel";

import type { IQQBotConfig, IQQInboxBinding, IQQInboxConfig } from "@/types/config";
import type { IGroupMessage, IPayload } from "@/types/qq";
import type { InboxWriter } from "@/utils/inbox";

import type { IMessageLabels } from "./message";
import type { QQOpenApi } from "./openapi";

const MSG_IDX_ATTRIBUTE = "custom-msg-idx"; // 消息块中记录 msg_idx 的属性, 用于去重与引用

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 生效的绑定: 已启用, 且群与文档都已填写 */
export function activeBindings(config: IQQInboxConfig): IQQInboxBinding[] {
    return config.bindings.filter((binding) => binding.enabled && binding.group && binding.doc);
}

/**
 * 思源收集箱: 把绑定群聊的消息写入收集箱文档。提及机器人的消息都视为指令, 不写入收集箱 (见 mentionsBot)。
 * 文档的写入由与微信共用的 InboxWriter 完成: 先插入 .temp, 下载资源文件, 再移动到 YYYY/MM/YYYY-MM-DD 文档的末尾。
 * 绑定开启回复时, 消息插入 .temp 后即引用该消息, 被动回复其超级块的块超链接 (siyuan://blocks/ 加块 ID)。
 * Writes the messages of bound QQ groups into SiYuan documents, except messages
 * that mention the bot, which are commands. The documents are written by the
 * InboxWriter shared with WeChat.
 */
export class QQInbox {
    private readonly siyuan: kernel.ISiyuan;
    private readonly openapi: QQOpenApi;
    private readonly writer: InboxWriter;
    private readonly config: () => IQQBotConfig;

    /**
     * @param siyuan - 内核插件全局对象
     * @param openapi - 发送回复的 OpenAPI 客户端
     * @param writer - 写入收集箱文档, 与微信共用
     * @param config - 返回当前的 QQ 机器人配置
     */
    constructor(siyuan: kernel.ISiyuan, openapi: QQOpenApi, writer: InboxWriter, config: () => IQQBotConfig) {
        this.siyuan = siyuan;
        this.openapi = openapi;
        this.writer = writer;
        this.config = config;
    }

    /* 处理网关推送的事件, 只接收有生效绑定的群聊中没有 @ 机器人的消息 */
    public handle(payload: IPayload): void {
        if (!payload.t || !GROUP_MESSAGE_EVENTS.has(payload.t)) {
            return;
        }
        const message = payload.d as IGroupMessage;
        if (mentionsBot(payload.t, message)) {
            return;
        }
        const bindings = activeBindings(this.config().inbox).filter((binding) => binding.group === message.group_openid);
        if (bindings.length === 0) {
            return;
        }

        this.writer.enqueue(async () => {
            for (const [index, binding] of bindings.entries()) {
                try {
                    // 写入多个收集箱的消息各回复一次, 相同的 msg_id 与 msg_seq 只能发送一次
                    await this.write(binding, payload.id ?? "", message, index + 1);
                }
                catch (error) {
                    void this.siyuan.logger.warn(`[qq] [inbox] write the message ${message.id} of group ${binding.group} to ${binding.doc} failed:`, errorMessage(error));
                }
            }
        });
    }

    private async write(binding: IQQInboxBinding, eventId: string, message: IGroupMessage, replySeq: number): Promise<void> {
        const inbox = binding.doc;
        await this.writer.prepare(inbox);

        const msgIdx = sceneValue(message, "msg_idx");
        if (msgIdx && await this.writer.findMessage(inbox, MSG_IDX_ATTRIBUTE, msgIdx)) {
            // 同一条消息可能重复推送, 也可能同时推送 GROUP_AT_MESSAGE_CREATE 与 GROUP_MESSAGE_CREATE
            void this.siyuan.logger.debug(`[qq] [inbox] the message ${msgIdx} is already in ${inbox}, skip it`);
            return;
        }

        const refIdx = message.message_type === MessageType.REFERENCE ? sceneValue(message, "ref_msg_idx") : undefined;
        const converted = convertMessage(message, {
            eventId,
            reference: refIdx ? await this.writer.findMessage(inbox, MSG_IDX_ATTRIBUTE, refIdx) : undefined,
            labels: this.labels(),
        });
        const { block, temp } = await this.writer.appendToTemp(inbox, converted.kramdown);
        if (msgIdx) {
            this.writer.remember(inbox, MSG_IDX_ATTRIBUTE, msgIdx, block);
        }
        if (binding.reply) {
            // 被动回复只能在收到消息后 5 分钟内发送, 所以在下载资源文件与移动之前回复, 且不等待回复结束
            void this.reply(message, block, replySeq);
        }

        if (converted.media > 0 && this.config().inbox.downloadAssets) {
            await this.writer.downloadAssets(temp);
        }
        await this.writer.moveToDate(inbox, block, messageDate(message.timestamp));
    }

    /**
     * 引用消息, 被动回复其超级块的块超链接, 失败时只记录日志。
     * 引用的 message_reference.message_id 是消息的 msg_idx (以 REFIDX_ 开头), 不是消息 ID; 消息没有 msg_idx 时只回复, 不引用
     * REF: https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html
     * @param message - 写入收集箱的消息
     * @param block - 消息的超级块 ID
     * @param seq - 回复序号 msg_seq
     */
    private async reply(message: IGroupMessage, block: string, seq: number): Promise<void> {
        const credentials = resolveCredentials(this.config());
        if (!credentials) {
            return;
        }
        const msgIdx = sceneValue(message, "msg_idx");
        try {
            const response = await this.openapi.request(credentials, {
                url: `/v2/groups/${encodeURIComponent(message.group_openid)}/messages`,
                method: "POST",
                body: {
                    msg_type: 0,
                    content: `siyuan://blocks/${block}`,
                    msg_id: message.id,
                    msg_seq: seq,
                    message_reference: msgIdx ? { message_id: msgIdx } : undefined,
                },
            });
            if (response.status < 200 || response.status >= 300) {
                throw new Error(`${response.status} ${JSON.stringify(response.body)}`);
            }
            void this.siyuan.logger.debug(`[qq] [inbox] replied to the message ${message.id} with the block ${block}`);
        }
        catch (error) {
            void this.siyuan.logger.warn(`[qq] [inbox] reply to the message ${message.id} with the block ${block} failed:`, errorMessage(error));
        }
    }

    private labels(): IMessageLabels {
        const labels = this.siyuan.plugin.i18n?.inbox as Partial<IMessageLabels> | undefined;
        return {
            quote: labels?.quote || "Quoted message",
            unavailable: labels?.unavailable || "[Message not available]",
        };
    }
}
