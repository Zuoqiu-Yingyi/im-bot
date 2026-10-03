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

/* Telegram Bot API 的常量 (REF: https://core.telegram.org/bots/api) */

export const DEFAULT_API_BASE_URL = "https://api.telegram.org"; // 官方 Bot API 服务器
export const TOKEN_PATTERN = /^\d+:[\w-]+$/; // @BotFather 给出的 Token: <机器人 ID>:<密钥>

/**
 * getUpdates 接收的更新类型。
 * 该参数会保存在服务端, 省略时沿用上一次 (可能是其他程序) 设置的值, 所以每次都明确传入
 */
export const ALLOWED_UPDATES = ["message", "channel_post", "my_chat_member"];

export const POLL_TIMEOUT = 30; // getUpdates 长轮询的秒数; 整个请求还受 siyuan.client.fetch 的 1 分钟超时限制
export const POLL_LIMIT = 100; // getUpdates 一次最多返回的更新数, 1 到 100

export const RETRY_DELAY = 2_000; // 请求失败后的重试间隔 (ms)
export const BACKOFF_DELAY = 30_000; // 连续失败 MAX_CONSECUTIVE_FAILURES 次后的等待时间 (ms)
export const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * 不能自动恢复的错误码: 401 为 Token 错误, 404 为 Token 格式不正确或 Bot API 地址错误,
 * 409 为设置了 Webhook, 或者其他程序正在用 getUpdates 接收同一个机器人的更新
 */
export const FATAL_ERROR_CODES = new Set([401, 404, 409]);

export const SEND_ATTEMPTS = 3; // 发送消息等请求超过频率限制 (429) 时最多尝试的次数
export const MAX_SEND_RETRY_AFTER = 60; // 发送消息等请求超过频率限制时, 最多等待的秒数; 要求等待更久时放弃

export const MEDIA_MAX_BYTES = 100 * 1024 * 1024; // 保存的媒体文件的最大字节数; 官方服务器只允许下载 20 MB 以内的文件

/* 插件响应的指令 */
export const COMMANDS = {
    START: "start", // 用户第一次打开机器人时 Telegram 客户端发送的指令
    CHATID: "chatid", // 查询会话 ID
} as const;
