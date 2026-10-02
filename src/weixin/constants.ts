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

/* 微信 iLink Bot API 的常量, 取值与官方客户端 @tencent-weixin/openclaw-weixin 2.4.9 一致 (REF: docs/ilink-api.md) */

export const API_BASE_URL = "https://ilinkai.weixin.qq.com"; // 扫码登录使用的接口地址, 登录后改用返回的 baseurl
export const CDN_BASE_URL = "https://novac2c.cdn.weixin.qq.com/c2c"; // 媒体没有 full_url 时, 用 encrypt_query_param 拼接下载地址
export const APP_ID = "bot"; // iLink-App-Id
export const BOT_TYPE = "3"; // get_bot_qrcode 的 bot_type
export const BOT_AGENT_NAME = "siyuan-plugin-im-bot"; // base_info.bot_agent 中的产品名

export const LOGIN_TIMEOUT = 480_000; // 一次扫码登录的最长时间 (ms)
export const LOGIN_POLL_INTERVAL = 1_000; // 两次查询扫码状态之间的间隔 (ms), 查询本身是长轮询
export const MAX_QR_CODES = 3; // 一次登录最多获取的二维码数, 二维码过期或验证码被锁定时获取新的二维码

export const RETRY_DELAY = 2_000; // getupdates 失败后的重试间隔 (ms)
export const BACKOFF_DELAY = 30_000; // 连续失败 MAX_CONSECUTIVE_FAILURES 次后的等待时间 (ms)
export const MAX_CONSECUTIVE_FAILURES = 3;
export const SESSION_EXPIRED = -14; // errcode 或 ret: 登录失效 (session timeout), 需要重新扫码

export const MEDIA_MAX_BYTES = 100 * 1024 * 1024; // 保存的媒体文件的最大字节数, 更大的媒体显示为占位文本

/* 消息的发送方 */
export enum MessageType {
    USER = 1, // 微信用户
    BOT = 2, // 机器人
}

/* 消息的状态 */
export enum MessageState {
    NEW = 0,
    GENERATING = 1,
    FINISH = 2,
}

/* 消息项的类型 */
export enum MessageItemType {
    TEXT = 1,
    IMAGE = 2,
    VOICE = 3,
    FILE = 4,
    VIDEO = 5,
}
