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
 * Telegram Bot API 的数据结构, 只列出插件用到的字段。
 * 用户与会话的 ID 最多 52 位有效数字, JSON.parse 解析为 number 不会丢失精度。
 * REF: https://core.telegram.org/bots/api
 */

/* 响应中的附加信息 */
export interface IResponseParameters {
    migrate_to_chat_id?: number; // 群已升级为超级群, 之后要用这个 ID
    retry_after?: number; // 超过频率限制, 重试前需要等待的秒数
}

/* 所有方法的响应 */
export interface IResponse<T> {
    ok: boolean;
    result?: T;
    error_code?: number;
    description?: string;
    parameters?: IResponseParameters;
}

export interface IUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
}

export type TChatType = "channel" | "group" | "private" | "supergroup";

export interface IChat {
    id: number;
    type: TChatType;
    title?: string; // 群组与频道
    username?: string;
    first_name?: string; // 私聊
    last_name?: string;
}

/* 文本中的实体, offset 与 length 以 UTF-16 码元计; 有公共字符的两个实体一定是一个包含另一个 */
export interface IMessageEntity {
    type: string; // 如 bold、bot_command、text_link, 见 https://core.telegram.org/bots/api#messageentity
    offset: number;
    length: number;
    url?: string; // text_link 的网址
    language?: string; // pre 的编程语言
    unix_time?: number; // date_time 表示的时间 (Unix 时间, 秒)
}

/* 文件的共有字段 */
export interface IFile {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string; // getFile 的结果, 用于拼接下载地址
}

export interface IPhotoSize extends IFile {
    width: number;
    height: number;
}

export interface IAnimation extends IFile {
    duration: number;
    file_name?: string;
    mime_type?: string;
}

export interface IAudio extends IFile {
    duration: number;
    performer?: string;
    title?: string;
    file_name?: string;
    mime_type?: string;
}

export interface IDocument extends IFile {
    file_name?: string;
    mime_type?: string;
}

export interface ISticker extends IFile {
    is_animated: boolean; // .tgs 动画贴纸
    is_video: boolean; // .webm 视频贴纸
    emoji?: string;
    thumbnail?: IPhotoSize; // .webp 或 .jpg 格式的缩略图
}

export interface IVideo extends IFile {
    duration: number;
    file_name?: string;
    mime_type?: string;
}

export interface IVideoNote extends IFile {
    duration: number;
}

export interface IVoice extends IFile {
    duration: number;
    mime_type?: string;
}

export interface IContact {
    phone_number: string;
    first_name: string;
    last_name?: string;
}

export interface IDice {
    emoji: string;
    value: number;
}

export interface ILocation {
    latitude: number;
    longitude: number;
}

export interface IPollOption {
    text: string;
}

export interface IPoll {
    question: string;
    options: IPollOption[];
}

export interface IVenue {
    location: ILocation;
    title: string;
    address: string;
}

/* 回复时引用的部分文本 */
export interface ITextQuote {
    text: string;
}

export interface IMessage {
    message_id: number; // 只在同一个会话中唯一
    message_thread_id?: number;
    from?: IUser; // 频道消息没有; 匿名管理员与频道身份发言时是占位的机器人
    sender_chat?: IChat; // 以群组或频道的身份发言时为该群组或频道
    date: number; // 发送时间 (Unix 时间, 秒)
    chat: IChat;
    author_signature?: string;
    reply_to_message?: IMessage; // 同一会话中被回复的消息, 不再带它自己的 reply_to_message
    quote?: ITextQuote;
    text?: string;
    entities?: IMessageEntity[];
    caption?: string;
    caption_entities?: IMessageEntity[];
    animation?: IAnimation; // 带有 animation 时 document 也是同一个文件
    audio?: IAudio;
    document?: IDocument;
    photo?: IPhotoSize[]; // 同一张图片的多个尺寸
    sticker?: ISticker;
    video?: IVideo;
    video_note?: IVideoNote;
    voice?: IVoice;
    contact?: IContact;
    dice?: IDice;
    location?: ILocation;
    poll?: IPoll;
    venue?: IVenue; // 带有 venue 时 location 也是同一个位置
    forum_topic_created?: object; // 话题的创建消息: 话题中的消息都把它作为 reply_to_message
    migrate_to_chat_id?: number; // 群已升级为超级群
}

export type TChatMemberStatus = "administrator" | "creator" | "kicked" | "left" | "member" | "restricted";

export interface IChatMember {
    status: TChatMemberStatus;
    user: IUser;
}

/* 机器人在会话中的状态变化 */
export interface IChatMemberUpdated {
    chat: IChat;
    from: IUser;
    date: number;
    old_chat_member: IChatMember;
    new_chat_member: IChatMember;
}

/* getUpdates 返回的更新, 插件只订阅这三种 (见 ALLOWED_UPDATES) */
export interface IUpdate {
    update_id: number;
    message?: IMessage;
    channel_post?: IMessage;
    my_chat_member?: IChatMemberUpdated;
}

/**
 * 本设备上 Telegram 机器人的连接状态
 */
export type TTelegramConnectionStatus
    = | "connected" // 正在接收: 最近一次 getUpdates 成功
        | "connecting" // 正在验证 Token 或等待第一次 getUpdates 的结果
        | "failed" // 遇到不能自动恢复的错误 (Token 无效、设置了 Webhook、其他程序在接收等), 已停止接收
        | "offline" // 上线开关已关闭
        | "other-device" // 只在其他设备上运行
        | "reconnecting" // 请求失败, 等待重试
        | "stopped" // 没有运行
        | "unconfigured"; // 没有填写 Token

/* RPC telegram-get-state 的返回值 */
export interface ITelegramConnectionState {
    status: TTelegramConnectionStatus;
    since?: string; // 进入该状态的时间 (ISO 8601)
    username?: string; // connected: 机器人的用户名
    error?: string; // reconnecting 与 failed: 失败的原因, 不含 Token
    retryAt?: string; // reconnecting: 下次请求的时间 (ISO 8601)
    device?: string; // other-device: 运行 Telegram 机器人的设备 ID
}
