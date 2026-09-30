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
    /* 插件配置文件名, 前端插件 saveData 与内核插件 siyuan.storage 都相对 data/storage/petal/im-bot/ */
    GLOBAL_CONFIG_NAME: "config.json",
    /* 前端插件与内核插件共用的 RPC 方法名 */
    KERNEL_RPC_METHOD: {
        UPDATE_CONFIG: "update-config", // 更新配置, QQ 机器人配置变化时重新连接
        CALL_QQ_API: "call-qq-api", // 以 QQ 机器人身份调用服务端接口 (OpenAPI), 参数为 (url, method, body?)
    } as const,
} as const;
