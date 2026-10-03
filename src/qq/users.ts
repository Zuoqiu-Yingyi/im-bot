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

import { qqChatsPath } from "@/utils/storage";

import type * as kernel from "siyuan/kernel";

import type { IQQBotConfig } from "@/types/config";
import type { IFriendEvent, IGroupMessage, IGroupOperationEvent, IMessage, IPayload } from "@/types/qq";
import type { IBotUsers, IGroupRecord, ITimeRecord, IUserRecord, TRelation, TUsers } from "@/types/users";

/* 事件生成的记录, status 在合并时计算 */
type TGroupUpdate = Omit<IGroupRecord, "status">;
type TUserUpdate = Omit<IUserRecord, "status">;

const FLUSH_DELAY = 5_000; // 收到事件后等待多久写入 chats.json (ms), 这段时间内的变化一起写入

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/* 事件中的时间: 数字为 Unix 秒, 字符串为 RFC3339; 无效时使用当前时间 */
function eventTime(timestamp: unknown): string {
    const ms = typeof timestamp === "number"
        ? timestamp * 1_000
        : typeof timestamp === "string"
            ? Date.parse(timestamp)
            : Number.NaN;
    const date = new Date(ms);
    return (Number.isNaN(date.getTime()) ? new Date() : date).toISOString();
}

/* 时间的毫秒数, 无效时为 NaN; 与 NaN 比较总是 false, 所以无效的时间不会被当作较早或较晚的一项 */
function parseTime(time: unknown): number {
    return typeof time === "string" ? Date.parse(time) : Number.NaN;
}

/* 时间较晚的一项, 时间相同时取 update; base 来自 chats.json, 可能被手动改过 */
function latest<T extends ITimeRecord>(base: T | undefined, update: T | undefined): T | undefined {
    if (!update) {
        return base;
    }
    if (!base) {
        return update;
    }
    return parseTime(base.time) > parseTime(update.time) ? base : update;
}

/* 时间较晚的一项; 它没有昵称而另一项是同一个人 (openid 相同或都没有) 时, 沿用另一项的昵称 */
function latestNamed<T extends ITimeRecord & { openid?: string; username?: string }>(base: T | undefined, update: T | undefined): T | undefined {
    const record = latest(base, update);
    const other = record === update ? base : update;
    return record && !record.username && other?.username && other.openid === record.openid
        ? { ...record, username: other.username }
        : record;
}

/* 较早的时间, base 无效时取 update */
function earliest(base: string | undefined, update: string): string {
    return parseTime(base) < parseTime(update) ? base! : update;
}

/**
 * 机器人与群或用户的关系: 最近一次被移出 (或删除) 之后, 有更晚的添加或消息时为 added。
 * 时间相同时视为 removed: 机器人被移出后收不到该群的消息
 * @param removed - 最近一次被移出群或被用户删除
 * @param presence - 能说明机器人在群中 (或用户已添加机器人) 的记录
 */
function relation(removed: ITimeRecord | undefined, ...presence: (ITimeRecord | undefined)[]): TRelation {
    const removedAt = parseTime(removed?.time);
    return Number.isNaN(removedAt) || presence.some((item) => parseTime(item?.time) > removedAt)
        ? "added"
        : "removed";
}

/* 对象中 key 对应的对象; 不存在或不是对象 (如 chats.json 被改坏) 时为 undefined */
function objectAt<T>(object: unknown, key: string): T | undefined {
    const value = isObject(object) ? object[key] : undefined;
    return isObject(value) ? value as T : undefined;
}

/* 对象中值为对象的项, 跳过 chats.json 中被改坏的记录 */
function records<T>(object: Record<string, unknown> | undefined): Record<string, T> {
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(object ?? {})) {
        if (isObject(value)) {
            result[key] = value as T;
        }
    }
    return result;
}

/* 合并同一个群的两份记录, base 中的其他字段 (如手动添加的备注) 保留; update 中有群名称时取新的群名称 */
function mergeGroup(base: IGroupRecord | undefined, update: TGroupUpdate): IGroupRecord {
    const added = latest(base?.added, update.added);
    const removed = latest(base?.removed, update.removed);
    const lastMessage = latest(base?.lastMessage, update.lastMessage);
    return {
        ...base,
        status: relation(removed, added, lastMessage),
        name: update.name || base?.name,
        firstSeen: earliest(base?.firstSeen, update.firstSeen),
        added,
        removed,
        proactive: latest(base?.proactive, update.proactive),
        lastMessage,
        owner: latestNamed(base?.owner, update.owner),
    };
}

/* 合并同一个用户的两份记录, base 中的其他字段 (如手动添加的备注) 保留 */
function mergeUser(base: IUserRecord | undefined, update: TUserUpdate): IUserRecord {
    const added = latest(base?.added, update.added);
    const removed = latest(base?.removed, update.removed);
    const lastMessage = latestNamed(base?.lastMessage, update.lastMessage);
    return {
        ...base,
        status: relation(removed, added, lastMessage),
        firstSeen: earliest(base?.firstSeen, update.firstSeen),
        unionOpenid: update.unionOpenid || base?.unionOpenid,
        added,
        removed,
        proactive: latest(base?.proactive, update.proactive),
        lastMessage,
    };
}

/**
 * 把一个机器人的 update 合并到 base: 同一个群或用户逐项取时间较晚的一项, 再重新计算 status。
 * base 中的其他群、用户与字段都保留, 不会因为 update 中没有而被删除
 * @param base - 已有的记录, 如 chats.json 的内容; 不是对象的部分 (被改坏的记录) 视为没有
 * @param update - 新的记录
 */
function mergeBotUsers(base: unknown, update: IBotUsers): IBotUsers {
    const groups = { ...objectAt<IBotUsers["groups"]>(base, "groups") };
    for (const [openid, record] of Object.entries(update.groups)) {
        groups[openid] = mergeGroup(objectAt(groups, openid), record);
    }
    const users = { ...objectAt<IBotUsers["users"]>(base, "users") };
    for (const [openid, record] of Object.entries(update.users)) {
        users[openid] = mergeUser(objectAt(users, openid), record);
    }
    return { ...(isObject(base) ? base : {}), groups, users };
}

/**
 * 把 update 合并到 base, 同一个机器人的记录按 mergeBotUsers 合并; base 中的其他机器人都保留
 * @param base - 已有的记录
 * @param update - 新的记录
 */
export function mergeUsers(base: TUsers, update: TUsers): TUsers {
    const result: TUsers = { ...base };
    for (const [appid, bot] of Object.entries(update)) {
        result[appid] = mergeBotUsers(base[appid], bot);
    }
    return result;
}

function groupUpdate(openid: string, record: TGroupUpdate): IBotUsers {
    return { groups: { [openid]: mergeGroup(undefined, record) }, users: {} };
}

function userUpdate(openid: string, record: TUserUpdate): IBotUsers {
    return { groups: {}, users: { [openid]: mergeUser(undefined, record) } };
}

/**
 * 由网关推送的事件生成群或单聊用户的记录
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/server-inter/group/manage/event.html
 * REF: https://bot.q.qq.com/wiki/develop/api-v2/server-inter/user/manage/event.html
 * @returns 与群或单聊用户无关的事件返回 undefined
 */
export function recordEvent(payload: IPayload): IBotUsers | undefined {
    switch (payload.t) {
        case "GROUP_ADD_ROBOT":
        case "GROUP_DEL_ROBOT":
        case "GROUP_MSG_RECEIVE":
        case "GROUP_MSG_REJECT": {
            const event = payload.d as IGroupOperationEvent | undefined;
            if (!event?.group_openid) {
                return undefined;
            }
            const time = eventTime(event.timestamp);
            const operation = { time, operator: event.op_member_openid || undefined };
            return groupUpdate(event.group_openid, {
                firstSeen: time,
                added: payload.t === "GROUP_ADD_ROBOT" ? operation : undefined,
                removed: payload.t === "GROUP_DEL_ROBOT" ? operation : undefined,
                proactive: payload.t === "GROUP_MSG_RECEIVE" || payload.t === "GROUP_MSG_REJECT"
                    ? { allowed: payload.t === "GROUP_MSG_RECEIVE", ...operation }
                    : undefined,
            });
        }

        case "GROUP_AT_MESSAGE_CREATE":
        case "GROUP_MESSAGE_CREATE": {
            const message = payload.d as IGroupMessage | undefined;
            if (!message?.group_openid) {
                return undefined;
            }
            const time = eventTime(message.timestamp);
            const member = message.author?.member_openid || message.author?.id;
            return groupUpdate(message.group_openid, {
                firstSeen: time,
                lastMessage: { time },
                owner: message.author?.member_role === "owner" && member
                    ? { openid: member, username: message.author.username || undefined, time }
                    : undefined,
            });
        }

        case "FRIEND_ADD":
        case "FRIEND_DEL":
        case "C2C_MSG_RECEIVE":
        case "C2C_MSG_REJECT": {
            const event = payload.d as IFriendEvent | undefined;
            if (!event?.openid) {
                return undefined;
            }
            const time = eventTime(event.timestamp);
            return userUpdate(event.openid, {
                firstSeen: time,
                unionOpenid: event.author?.union_openid || undefined,
                added: payload.t === "FRIEND_ADD"
                    ? { time, scene: event.scene, sceneParam: event.scene_param || undefined }
                    : undefined,
                removed: payload.t === "FRIEND_DEL" ? { time } : undefined,
                proactive: payload.t === "C2C_MSG_RECEIVE" || payload.t === "C2C_MSG_REJECT"
                    ? { allowed: payload.t === "C2C_MSG_RECEIVE", time }
                    : undefined,
            });
        }

        case "C2C_MESSAGE_CREATE": {
            const message = payload.d as IMessage | undefined;
            const openid = message?.author?.user_openid || message?.author?.id;
            if (!message || !openid) {
                return undefined;
            }
            const time = eventTime(message.timestamp);
            return userUpdate(openid, {
                firstSeen: time,
                unionOpenid: message.author.union_openid || undefined,
                lastMessage: { time, username: message.author.username || undefined },
            });
        }

        default:
            return undefined;
    }
}

/**
 * 已知的群与单聊用户: 按网关推送的事件维护各机器人的 `qq/<AppID>/chats.json`, 记录机器人所在的群与添加了机器人的用户,
 * 以及它们的元信息与状态。QQ 没有列出这些群与用户的接口, 只能从事件中收集; 事件中也没有群名称, 群名称取自查询群信息的接口。
 * 变化先合并在内存中, 5 秒内的变化一起写入; 每次写入前重新读取 chats.json 并合并到其中,
 * 所以从其他设备同步来的记录与手动添加的字段都会保留, 手动删除的记录要再次出现在事件中才会重新记录。
 * Keeps `qq/<AppID>/chats.json` of each bot, the groups the bot is in and the
 * users who added it, with their metadata and status, from the gateway events:
 * QQ has no API that lists them, and the events carry no group names, which
 * come from the group info API. Changes are merged in memory and written
 * together 5 seconds later; each write re-reads chats.json and merges into it,
 * so records synced from other devices and fields added by hand are kept.
 */
export class QQUsers {
    private readonly siyuan: kernel.ISiyuan;
    private readonly config: () => IQQBotConfig;

    private pending: TUsers = {}; // 各机器人还没写入 chats.json 的变化, 键为 AppID
    private timer?: ReturnType<typeof setTimeout>;
    private queue: Promise<void> = Promise.resolve(); // 依次写入, 两次读取、合并与写入不会交错

    /**
     * @param siyuan - 内核插件全局对象
     * @param config - 返回当前的 QQ 机器人配置, 记录归入其中 AppID 对应的机器人
     */
    constructor(siyuan: kernel.ISiyuan, config: () => IQQBotConfig) {
        this.siyuan = siyuan;
        this.config = config;
    }

    /* 处理网关推送的事件, 与群或单聊用户有关的事件在 5 秒后写入 */
    public handle(payload: IPayload): void {
        const appid = this.config().appid.trim();
        const update = appid ? recordEvent(payload) : undefined;
        if (update) {
            this.record(appid, update);
        }
    }

    /**
     * 记录查询群信息 (`GET /v2/groups/{group_openid}/info`) 得到的群名称, 5 秒后写入;
     * 还没有该群的记录时新建一条, 能查询到群信息说明机器人在群中
     * @param appid - 机器人的 AppID
     * @param openid - 群的 group_openid
     * @param name - 群名称
     */
    public recordGroupName(appid: string, openid: string, name: string): void {
        this.record(appid, groupUpdate(openid, { firstSeen: new Date().toISOString(), name }));
    }

    /**
     * 立即写入还没写入的变化, 卸载时调用。
     * 写入失败时变化留在内存中, 收到下一个相关事件或再次调用时重试; 返回的 Promise 不会被拒绝
     */
    public flush(): Promise<void> {
        clearTimeout(this.timer);
        this.timer = undefined;
        this.queue = this.queue.then(() => this.write());
        return this.queue;
    }

    /**
     * 一个机器人已知的群与单聊用户: chats.json 与还没写入的变化合并后的结果。
     * 与写入排在同一个队列中, 所以不会漏掉正在写入的变化; 不是对象的记录不会返回
     * @param appid - 机器人的 AppID
     * @throws chats.json 不是 JSON 对象
     */
    public list(appid: string): Promise<IBotUsers> {
        const task = this.queue.then(async () => {
            const base = await this.read(appid);
            const update = this.pending[appid];
            const bot = update ? mergeBotUsers(base, update) : base;
            return {
                groups: records<IGroupRecord>(objectAt(bot, "groups")),
                users: records<IUserRecord>(objectAt(bot, "users")),
            };
        });
        this.queue = task.then(() => undefined, () => undefined);
        return task;
    }

    /* 把变化合并到内存中, 5 秒后写入 */
    private record(appid: string, update: IBotUsers): void {
        this.pending = mergeUsers(this.pending, { [appid]: update });
        if (this.timer === undefined) {
            this.timer = setTimeout(() => void this.flush(), FLUSH_DELAY);
        }
    }

    /* 各机器人的变化分别写入各自的 chats.json, 写入失败的机器人的变化留在内存中 */
    private async write(): Promise<void> {
        const changes = this.pending;
        this.pending = {};
        for (const [appid, update] of Object.entries(changes)) {
            const path = qqChatsPath(appid);
            try {
                const users = mergeBotUsers(await this.read(appid), update);
                await this.siyuan.storage.put(path, JSON.stringify(users, undefined, 4));
                void this.siyuan.logger.debug(`[qq] [chats] updated ${path}`);
            }
            catch (error) {
                this.pending = mergeUsers({ [appid]: update }, this.pending);
                void this.siyuan.logger.warn(`[qq] [chats] update ${path} failed, retry with the next change:`, errorMessage(error));
            }
        }
    }

    /**
     * 读取一个机器人的 chats.json, 文件不存在时为空
     * @throws 读取失败, 或文件不是 JSON 对象: 此时不能覆盖它, 否则其中的记录都会丢失
     */
    private async read(appid: string): Promise<Record<string, unknown>> {
        const path = qqChatsPath(appid);
        if (!(await this.exists(path))) {
            return {};
        }
        const text = await (await this.siyuan.storage.get(path)).text();
        let users: unknown;
        try {
            users = JSON.parse(text);
        }
        catch (error) {
            throw new Error(`${path} is not valid JSON, fix or delete it: ${errorMessage(error)}`);
        }
        if (!isObject(users)) {
            throw new Error(`${path} is not a JSON object, fix or delete it`);
        }
        return users;
    }

    /**
     * 存储目录中的文件是否存在: 从存储目录开始逐级列出, 某一级不存在时为 false。
     * 不用 storage.get 的失败判断: 读取失败不一定是文件不存在, 此时不能当作空文件覆盖
     * @throws 列出目录失败
     */
    private async exists(path: string): Promise<boolean> {
        let directory = ".";
        for (const name of path.split("/")) {
            const entries = await this.siyuan.storage.list(directory);
            if (!entries.some((entry) => entry.name === name)) {
                return false;
            }
            directory = directory === "." ? name : `${directory}/${name}`;
        }
        return true;
    }
}
