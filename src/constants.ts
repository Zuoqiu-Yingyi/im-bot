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

export default {
    /* 插件配置文件名, 前端插件 saveData 与内核插件 siyuan.storage 都相对 data/storage/petal/im-bot/; 各机器人的数据文件见 utils/storage.ts */
    GLOBAL_CONFIG_NAME: "config.json",
    /* 前端插件与内核插件共用的 RPC 方法名 */
    KERNEL_RPC_METHOD: {
        UPDATE_CONFIG: "update-config", // 更新配置, QQ 机器人配置变化时重新连接
        CALL_QQ_API: "call-qq-api", // 以 QQ 机器人身份调用服务端接口 (OpenAPI), 参数为 (url, method, body?)
        GET_USERS: "get-users", // 获取 QQ 机器人已知的群与单聊用户
        QQ_GET_STATE: "qq-get-state", // 获取本设备上 QQ 机器人的连接状态
        WEIXIN_GET_ACCOUNT: "weixin-get-account", // 获取微信机器人的登录信息 (不含 bot_token)
        WEIXIN_LOGIN_START: "weixin-login-start", // 开始微信扫码登录, 返回登录状态
        WEIXIN_LOGIN_STATE: "weixin-login-state", // 获取扫码登录的状态
        WEIXIN_LOGIN_VERIFY: "weixin-login-verify", // 提交手机上显示的数字, 参数为 (code)
        WEIXIN_LOGIN_CANCEL: "weixin-login-cancel", // 取消扫码登录
        WEIXIN_LOGOUT: "weixin-logout", // 退出登录: 停止接收消息并删除登录信息
        TELEGRAM_GET_STATE: "telegram-get-state", // 获取本设备上 Telegram 机器人的连接状态
        FEISHU_GET_STATE: "feishu-get-state", // 获取本设备上飞书机器人的连接状态
    } as const,
} as const;
