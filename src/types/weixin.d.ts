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

/**
 * 微信 iLink Bot API 的数据结构, 字段取自官方客户端 `@tencent-weixin/openclaw-weixin` 2.4.9 的 src/api/types.ts。
 * message_id、msg_id 与 svr_id 在 JSON 中是 uint64 数值, 解析时转为字符串 (见 parseLosslessJson)。
 * REF: docs/ilink-api.md
 */

/* 每个鉴权请求都带的客户端信息 */
export interface IBaseInfo {
    channel_version?: string; // 客户端版本
    bot_agent?: string; // 类似 User-Agent 的客户端标识, 只用于服务端的日志与监控
}

/* 接口的业务返回码, 各接口用到的字段不同 */
export interface IResult {
    ret?: number;
    errcode?: number; // 如 -14: 登录失效 (session timeout)
    errmsg?: string;
}

/* CDN 上的加密媒体 */
export interface ICDNMedia {
    encrypt_query_param?: string;
    aes_key?: string; // base64
    encrypt_type?: number;
    full_url?: string;
}

export interface ITextItem {
    text?: string;
}

export interface IImageItem {
    media?: ICDNMedia; // 原图
    thumb_media?: ICDNMedia; // 缩略图
    aeskey?: string; // 16 字节 AES-128 密钥的 hex 字符串
    url?: string;
    mid_size?: number;
    thumb_size?: number;
    thumb_height?: number;
    thumb_width?: number;
    hd_size?: number;
}

export interface IVoiceItem {
    media?: ICDNMedia;
    encode_type?: number; // 1 pcm, 2 adpcm, 3 feature, 4 speex, 5 amr, 6 silk, 7 mp3, 8 ogg-speex
    bits_per_sample?: number;
    sample_rate?: number;
    playtime?: number; // 时长 (ms)
    text?: string; // 语音转文字
}

export interface IFileItem {
    media?: ICDNMedia;
    file_name?: string;
    md5?: string;
    len?: string; // 明文字节数
}

export interface IVideoItem {
    media?: ICDNMedia;
    video_size?: number;
    play_length?: number;
    video_md5?: string;
    thumb_media?: ICDNMedia;
    thumb_size?: number;
    thumb_height?: number;
    thumb_width?: number;
}

/* 引用的消息, 新版微信客户端可能只给 svr_id */
export interface IRefMessage {
    message_item?: IMessageItem;
    title?: string; // 摘要
    svr_id?: string; // 被引用消息的 ID
}

/* 消息项, type 见 MessageItemType */
export interface IMessageItem {
    type?: number;
    create_time_ms?: number;
    update_time_ms?: number;
    is_completed?: boolean;
    msg_id?: string;
    ref_msg?: IRefMessage;
    text_item?: ITextItem;
    image_item?: IImageItem;
    voice_item?: IVoiceItem;
    file_item?: IFileItem;
    video_item?: IVideoItem;
}

/* 消息 (WeixinMessage) */
export interface IWeixinMessage {
    seq?: number;
    message_id?: string;
    from_user_id?: string; // 用户为 xxx@im.wechat, 机器人为 xxx@im.bot
    to_user_id?: string;
    client_id?: string;
    create_time_ms?: number;
    update_time_ms?: number;
    delete_time_ms?: number;
    session_id?: string;
    group_id?: string;
    message_type?: number; // 见 MessageType
    message_state?: number; // 见 MessageState
    item_list?: IMessageItem[];
    context_token?: string; // 回复这条消息时原样带上
    run_id?: string;
}

/* POST /ilink/bot/getupdates */
export interface IGetUpdatesResponse extends IResult {
    msgs?: IWeixinMessage[];
    get_updates_buf?: string; // 下次请求使用的游标
    longpolling_timeout_ms?: number; // 服务端建议的下次长轮询时长
}

/* POST /ilink/bot/sendmessage */
export interface ISendMessageResponse extends IResult {
    message_id?: string; // ret 为 0 却没有 message_id 时, 消息实际上没有送达
}

/* POST /ilink/bot/get_bot_qrcode */
export interface IQRCodeResponse extends IResult {
    qrcode?: string; // 查询扫码状态用的二维码 ID
    qrcode_img_content?: string; // 要编码为二维码的链接 (不是图片)
}

/* GET /ilink/bot/get_qrcode_status 的 status */
export type TQRCodeStatus
    = | "binded_redirect"
        | "confirmed"
        | "expired"
        | "need_verifycode"
        | "scaned_but_redirect"
        | "scaned"
        | "verify_code_blocked"
        | "wait";

/* GET /ilink/bot/get_qrcode_status */
export interface IQRCodeStatusResponse extends IResult {
    status?: TQRCodeStatus;
    bot_token?: string;
    ilink_bot_id?: string; // xxx@im.bot
    baseurl?: string; // 之后的请求使用的接口地址
    ilink_user_id?: string; // 扫码的微信用户, xxx@im.wechat
    redirect_host?: string; // scaned_but_redirect 时改用的主机名
}

/* 扫码登录得到的登录信息, 由内核插件保存在 weixin/<机器人 ID>/auth.json 中, 随数据同步 */
export interface IWeixinAccount {
    botId: string; // ilink_bot_id
    token: string; // bot_token
    baseUrl: string; // 接口地址 (baseurl)
    userId: string; // ilink_user_id: 扫码登录的微信用户, 也是唯一能与机器人对话的用户
    device: string; // 扫码登录的设备 ID, 只有该设备轮询消息
    deviceName: string; // 扫码登录的设备名称
    loginTime: string; // 登录时间 (ISO 8601)
}

/* 返回给前端的登录信息, 不含 token 与接口地址 */
export interface IWeixinAccountState extends Omit<IWeixinAccount, "baseUrl" | "token"> {
    running: boolean; // 本设备是否正在轮询消息
    expiredAt?: string; // 本设备发现登录失效的时间 (ISO 8601): getupdates 返回 -14 后不再轮询, 需要重新扫码
}

/**
 * 扫码登录的状态
 * - idle: 没有进行中的登录
 * - wait: 等待扫码
 * - scaned: 已扫码, 等待在手机上确认
 * - need_verifycode: 需要输入手机上显示的数字
 * - verifying: 已提交数字, 等待服务端确认
 * - confirmed: 登录成功
 * - expired: 二维码多次过期或等待超时
 * - failed: 登录失败, 原因见 error
 * - cancelled: 已取消
 */
export type TWeixinLoginStatus
    = | "cancelled"
        | "confirmed"
        | "expired"
        | "failed"
        | "idle"
        | "need_verifycode"
        | "scaned"
        | "verifying"
        | "wait";

export interface IWeixinLoginState {
    status: TWeixinLoginStatus;
    url?: string; // 要显示为二维码的链接
    wrongCode?: boolean; // 上次输入的数字不正确
    error?: string; // 登录失败的原因
    account?: IWeixinAccountState; // 登录成功后的登录信息
}
