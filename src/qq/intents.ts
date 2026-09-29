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

import { INTENTS } from "./constants";

/**
 * 由各类事件的订阅开关计算 intents 位掩码
 * @param switches - 各事件类别是否订阅, 未知的类别会被忽略
 */
export function resolveIntents(switches: Partial<Record<string, boolean>>): number {
    let intents = 0;
    for (const [name, bit] of Object.entries(INTENTS)) {
        if (switches[name] === true) {
            intents |= bit;
        }
    }
    return intents;
}

/**
 * 格式化 intents 位掩码, 用于日志
 * @returns 形如 `GROUP_AND_C2C_EVENT|PUBLIC_GUILD_MESSAGES (1107296256)`
 */
export function formatIntents(intents: number): string {
    const names = Object.entries(INTENTS)
        .filter(([, bit]) => intents & bit)
        .map(([name]) => name);
    return `${names.join("|")} (${intents})`;
}
