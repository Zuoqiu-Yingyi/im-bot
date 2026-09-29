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

import type { OpCode } from "@/qq/constants";

/* 网关收发的数据包 */
export interface IPayload<T = any> {
    op: OpCode;
    d?: T;
    s?: number; // 事件序号, 心跳与 resume 时回传最新值
    t?: string; // 事件类型, 仅 op=0 (DISPATCH) 时存在
    id?: string; // 事件 ID
}

/* op=10 (HELLO) */
export interface IHelloData {
    heartbeat_interval: number; // 心跳间隔 (ms)
}

/* op=0 (DISPATCH), t=READY */
export interface IReadyData {
    version: number;
    session_id: string;
    user: {
        id: string;
        username: string;
        bot: boolean;
    };
    shard: [number, number];
}

/* POST https://bots.qq.com/app/getAppAccessToken */
export interface IAccessToken {
    access_token: string;
}

/* GET /gateway/bot */
export interface IGatewayBot {
    url: string; // WebSocket 接入点
    shards: number; // 建议的分片数
    session_start_limit: {
        total: number; // 每 24 小时可创建会话数
        remaining: number; // 剩余可创建会话数
        reset_after: number; // 重置计数的剩余时间 (ms)
        max_concurrency: number; // 每 5 秒可创建会话数
    };
}
