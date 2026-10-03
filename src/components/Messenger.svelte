<!--
 Copyright (C) 2026 Zuoqiu Yingyi

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

<!-- 向已知的群与单聊用户发送消息的页签 -->

<script
    lang="ts"
    module
>
    import type Plugin from "@/index";
    import type { IMessengerTab } from "@/index";

    /* 消息类型: text 为纯文本 (msg_type 0), markdown 为 Markdown (msg_type 2) */
    export type TMessageType = "markdown" | "text";

    /* 页签数据: 正在编辑的消息, 思源保存界面布局 (如打开、切换或关闭页签) 时一并保存, 恢复布局时还原 */
    export interface IMessengerTabData {
        target: string; // 发送对象: `group:<group_openid>` 或 `c2c:<user_openid>`, 为空表示未选择
        type: TMessageType; // 消息类型
        content: string; // 消息内容
        wakeup: boolean; // 仅单聊: 是否作为互动召回消息 (is_wakeup) 发送
    }

    export interface IProps {
        plugin: InstanceType<typeof Plugin>; // 插件实例
        tab: IMessengerTab; // 所在的页签
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import { SvelteSet } from "svelte/reactivity";

    import Tab from "@workspace/components/siyuan/tab/Tab.svelte";
    import { preventDefault } from "@workspace/utils/svelte/event";

    import { formatRpcError } from "@/utils/rpc";

    import ApiResult from "./ApiResult.svelte";

    import type { IApiError, IApiResponse, IGroupInfo } from "@/types/qq";
    import type { IBotUsers, IGroupRecord, IProactiveSetting, IUserRecord } from "@/types/users";

    import type { TApiResult } from "./ApiResult.svelte";

    /* 发送对象的场景, 与 QQ 指令面板的 scope 相同 */
    type TScope = "c2c" | "group";

    /* 下拉列表中的一个发送对象 */
    type TTarget = { key: string; openid: string; activity: number }
        & ({ scope: "c2c"; record: IUserRecord } | { scope: "group"; record: IGroupRecord });

    /* 群信息的查询结果: 查询成功时为群信息, 否则为响应或错误 */
    type TInfoResult = { failure: TApiResult } | { info: IGroupInfo };

    /* 最近一次发送 */
    interface ISent {
        label: string; // 发送对象在下拉列表中的名称
        result: TApiResult;
    }

    const WHITELIST_ERROR = 11253; // 接口仅对白名单机器人开放

    const { plugin, tab }: IProps = $props();

    // svelte-ignore state_referenced_locally
    const i18n = plugin.i18n.messenger;

    // svelte-ignore state_referenced_locally
    const draft = $state({ ...tab.data }); // 正在编辑的消息
    let known = $state.raw<IBotUsers>(); // 已知的群与单聊用户
    let loading = $state(false); // 是否正在读取已知的群与单聊用户
    let loadError = $state(""); // 读取失败的原因
    let infos = $state.raw<Record<string, TInfoResult>>({}); // group_openid → 群信息的查询结果
    const querying = new SvelteSet<string>(); // 正在查询信息的群
    let sending = $state(false); // 是否正在等待发送的响应
    let sent = $state.raw<ISent>(); // 最近一次发送

    /* 编辑的消息写回页签数据, 思源保存界面布局时一并保存 */
    $effect(() => {
        Object.assign(tab.data, $state.snapshot(draft));
    });

    /* 把值填入界面文本中的 {{1}}; 用函数替换, 昵称与群名称中的美元符号才不会被当作替换模式 */
    function fill(template: string, value: string): string {
        return template.replaceAll("{{1}}", () => value);
    }

    /* 时刻的毫秒数, 没有或无法解析时为 0 */
    function timeOf(time: unknown): number {
        const ms = typeof time === "string" ? Date.parse(time) : Number.NaN;
        return Number.isNaN(ms) ? 0 : ms;
    }

    /* 最近一次活动: 最近一条消息、最近一次被添加与首次记录中最晚的一项 */
    function activityOf(record: IGroupRecord | IUserRecord): number {
        return Math.max(timeOf(record.lastMessage?.time), timeOf(record.added?.time), timeOf(record.firstSeen));
    }

    /* 机器人仍在群中 (或仍被用户添加) 的排在前面, 同一状态中最近有活动的排在前面 */
    function toTargets(scope: TScope, records: Record<string, IGroupRecord | IUserRecord> | undefined): TTarget[] {
        return Object.entries(records ?? {})
            .map(([openid, record]) => ({ key: `${scope}:${openid}`, scope, openid, record, activity: activityOf(record) }) as TTarget)
            .sort((a, b) => Number(a.record.status === "removed") - Number(b.record.status === "removed") || b.activity - a.activity);
    }

    /* 发送对象的名称: 这次查询到的或 chats.json 中记录的群名称、群主或用户的昵称, 都没有时为空 */
    function nameOf(item: TTarget): string {
        if (item.scope === "c2c") {
            return item.record.lastMessage?.username ?? "";
        }
        const info = infos[item.openid];
        if (info && "info" in info && info.info.group_name) {
            return info.info.group_name;
        }
        if (item.record.name) {
            return item.record.name;
        }
        const owner = item.record.owner?.username;
        return owner ? fill(i18n.ownerOf, owner) : "";
    }

    function statusOf(item: TTarget): string {
        if (item.scope === "group") {
            return item.record.status === "removed" ? i18n.groupRemoved : i18n.groupAdded;
        }
        return item.record.status === "removed" ? i18n.userRemoved : i18n.userAdded;
    }

    /* 下拉列表中的名称: 名称与 OpenID, 机器人已被移出群 (或已被用户删除) 时注明 */
    function labelOf(item: TTarget): string {
        const name = nameOf(item);
        const label = name ? `${name} (${item.openid})` : item.openid;
        return item.record.status === "removed" ? `${label} · ${statusOf(item)}` : label;
    }

    /* 本地时间; 没有时为 -, 无法解析时原样显示 */
    function formatTime(time: string | undefined): string {
        if (!time) {
            return "-";
        }
        const date = new Date(time);
        return Number.isNaN(date.getTime()) ? time : date.toLocaleString();
    }

    function proactiveOf(setting: IProactiveSetting | undefined): string {
        if (typeof setting?.allowed !== "boolean") {
            return i18n.proactiveUnknown;
        }
        return fill(setting.allowed ? i18n.proactiveAllowed : i18n.proactiveRejected, formatTime(setting.time));
    }

    function formatTags(tags: unknown): string {
        return Array.isArray(tags) && tags.length > 0 ? tags.join(", ") : "-";
    }

    /**
     * 响应体中的错误码, 没有或为 0 时为 undefined。
     * 文档建议按 err_code 判断请求是否失败, 部分接口的错误码在 code 中
     * REF: https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/api-call-guide.html
     */
    function errorCode(body: unknown): number | undefined {
        if (typeof body !== "object" || body === null) {
            return undefined;
        }
        const error = body as IApiError;
        return [error.err_code, error.code].find((code) => typeof code === "number" && code !== 0);
    }

    /* 请求是否成功: 状态码为 2xx, 且响应体中没有错误码; 状态码为 201 与 202 时响应体中也可能有错误 */
    function isSuccess(response: IApiResponse): boolean {
        return response.status >= 200 && response.status < 300 && errorCode(response.body) === undefined;
    }

    /* 接口是否因为机器人不在白名单中而拒绝 */
    function isWhitelistError(result: TApiResult): boolean {
        return "response" in result && errorCode(result.response.body) === WHITELIST_ERROR;
    }

    const groups = $derived(toTargets("group", known?.groups));
    const users = $derived(toTargets("c2c", known?.users));
    const target = $derived(groups.find((item) => item.key === draft.target) ?? users.find((item) => item.key === draft.target));
    const canSend = $derived(!!target && draft.content.trim() !== "" && !sending);

    /* 从内核插件读取已知的群与单聊用户; 之前选择的对象不在其中时清空选择 */
    async function load(): Promise<void> {
        loading = true;
        try {
            known = await plugin.getUsers();
            loadError = "";
            if (draft.target && !target) {
                draft.target = "";
            }
        }
        catch (error) {
            loadError = formatRpcError(error);
        }
        finally {
            loading = false;
        }
    }

    /* 查询群信息 (GET /v2/groups/{group_openid}/info), 查询到的群名称也显示在下拉列表中 */
    async function queryInfo(openid: string): Promise<void> {
        querying.add(openid);
        const start = performance.now();
        let info: TInfoResult;
        try {
            const response = await plugin.callQQApi(`/v2/groups/${encodeURIComponent(openid)}/info`, "GET");
            info = isSuccess(response) && typeof response.body === "object" && response.body !== null
                ? { info: response.body as IGroupInfo }
                : { failure: { duration: performance.now() - start, response } };
        }
        catch (error) {
            info = { failure: { duration: performance.now() - start, error: formatRpcError(error) } };
        }
        infos = { ...infos, [openid]: info };
        querying.delete(openid);
    }

    /**
     * 发送主动消息: 群聊为 `POST /v2/groups/{group_openid}/messages`, 单聊为 `POST /v2/users/{user_openid}/messages`。
     * 发送成功后清空消息内容; 发送失败, 或者等待响应时消息内容被修改, 则保留
     */
    async function send(): Promise<void> {
        const current = target;
        const content = draft.content;
        if (!current || !content.trim() || sending) {
            return;
        }
        const body: Record<string, unknown> = draft.type === "markdown"
            ? { msg_type: 2, markdown: { content } }
            : { msg_type: 0, content };
        if (current.scope === "c2c" && draft.wakeup) {
            body.is_wakeup = true;
        }
        const url = current.scope === "group"
            ? `/v2/groups/${encodeURIComponent(current.openid)}/messages`
            : `/v2/users/${encodeURIComponent(current.openid)}/messages`;
        const label = labelOf(current);

        sending = true;
        const start = performance.now();
        try {
            const response = await plugin.callQQApi(url, "POST", body);
            sent = { label, result: { duration: performance.now() - start, response } };
            if (isSuccess(response) && draft.content === content) {
                draft.content = "";
            }
        }
        catch (error) {
            sent = { label, result: { duration: performance.now() - start, error: formatRpcError(error) } };
        }
        finally {
            sending = false;
        }
    }

    /* 在消息内容中按 Ctrl+Enter 或 ⌘+Enter 发送, 输入法组字时的回车不算 */
    function onKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.isComposing) {
            event.preventDefault();
            void send();
        }
    }

    onMount(() => {
        void load();
    });
</script>

<Tab>
    <!-- 发送对象与刷新按钮 -->
    {#snippet breadcrumbSlot()}
        <div class="protyle-breadcrumb recipient">
            <select
                class="b3-select fn__flex-1 target"
                aria-label={i18n.target}
                bind:value={draft.target}
            >
                <option
                    disabled
                    value=""
                >
                    {loading ? i18n.loading : i18n.targetPlaceholder}
                </option>
                {#if groups.length > 0}
                    <optgroup label={i18n.groups}>
                        {#each groups as item (item.key)}
                            <option value={item.key}>{labelOf(item)}</option>
                        {/each}
                    </optgroup>
                {/if}
                {#if users.length > 0}
                    <optgroup label={i18n.users}>
                        {#each users as item (item.key)}
                            <option value={item.key}>{labelOf(item)}</option>
                        {/each}
                    </optgroup>
                {/if}
            </select>
            <button
                class="b3-button b3-button--outline"
                disabled={loading}
                onclick={load}
            >
                {i18n.refresh}
            </button>
        </div>
    {/snippet}

    {#snippet content()}
        <div class="content fn__flex-column">
            {#if loadError}
                <div
                    class="ft__error"
                    role="alert"
                >
                    {i18n.loadError}
                    <pre class="code">{loadError}</pre>
                </div>
            {:else if known && groups.length === 0 && users.length === 0}
                <div class="ft__on-surface">{i18n.empty}</div>
            {/if}

            <!-- 发送对象的状态 -->
            {#if target}
                <dl class="fields">
                    <dt>OpenID</dt>
                    <dd><code class="fn__code">{target.openid}</code></dd>
                    <dt>{i18n.status}</dt>
                    <dd>{statusOf(target)}</dd>
                    <dt>{i18n.proactive}</dt>
                    <dd>{proactiveOf(target.record.proactive)}</dd>
                    {#if target.scope === "group" && target.record.owner?.openid}
                        <dt>{i18n.owner}</dt>
                        <dd>{target.record.owner.username ?? ""} <code class="fn__code">{target.record.owner.openid}</code></dd>
                    {/if}
                    {#if target.scope === "c2c" && target.record.unionOpenid}
                        <dt>union_openid</dt>
                        <dd><code class="fn__code">{target.record.unionOpenid}</code></dd>
                    {/if}
                    <dt>{i18n.lastMessage}</dt>
                    <dd>{formatTime(target.record.lastMessage?.time)}</dd>
                    <dt>{i18n.firstSeen}</dt>
                    <dd>{formatTime(target.record.firstSeen)}</dd>
                </dl>

                <!-- 群信息 -->
                {#if target.scope === "group"}
                    {@const openid = target.openid}
                    {@const info = infos[openid]}
                    <div class="fn__flex section">
                        <span class="title">{i18n.info}</span>
                        <button
                            class="b3-button b3-button--outline"
                            disabled={querying.has(openid)}
                            onclick={() => queryInfo(openid)}
                        >
                            {querying.has(openid) ? i18n.querying : i18n.query}
                        </button>
                    </div>
                    {#if info && "info" in info}
                        <dl class="fields">
                            <dt>{i18n.infoName}</dt>
                            <dd>{info.info.group_name || "-"}</dd>
                            <dt>{i18n.infoMemo}</dt>
                            <dd>{info.info.group_finger_memo || "-"}</dd>
                            <dt>{i18n.infoClass}</dt>
                            <dd>{info.info.group_class_text || "-"}</dd>
                            <dt>{i18n.infoTags}</dt>
                            <dd>{formatTags(info.info.group_tags)}</dd>
                            <dt>{i18n.infoMembers}</dt>
                            <dd>{info.info.group_member_num ?? "-"}</dd>
                        </dl>
                    {:else if info}
                        {#if isWhitelistError(info.failure)}
                            <div class="ft__error">{i18n.infoWhitelist}</div>
                        {/if}
                        <ApiResult
                            labels={i18n}
                            result={info.failure}
                        />
                    {/if}
                {/if}
            {/if}

            <!-- 消息 -->
            <form
                class="fn__flex-column composer"
                onsubmit={preventDefault(send)}
            >
                <div class="fn__flex options">
                    <label class="fn__flex option">
                        <span>{i18n.type}</span>
                        <span class="fn__space"></span>
                        <select
                            class="b3-select"
                            bind:value={draft.type}
                        >
                            <option value="text">{i18n.text}</option>
                            <option value="markdown">{i18n.markdown}</option>
                        </select>
                    </label>
                    {#if target?.scope === "c2c"}
                        <label class="fn__flex option">
                            <span>{i18n.wakeup} <code class="fn__code">is_wakeup</code></span>
                            <span class="fn__space"></span>
                            <input
                                class="b3-switch"
                                type="checkbox"
                                bind:checked={draft.wakeup}
                            />
                        </label>
                    {/if}
                </div>
                <textarea
                    class="b3-text-field fn__block"
                    aria-label={i18n.content}
                    onkeydown={onKeydown}
                    placeholder={i18n.contentPlaceholder}
                    rows="8"
                    bind:value={draft.content}
                ></textarea>
                {#if target}
                    <div class="b3-label__text">{target.scope === "c2c" ? i18n.hintUser : i18n.hintGroup}</div>
                {/if}
                <div class="fn__flex">
                    <button
                        class="b3-button"
                        disabled={!canSend}
                        type="submit"
                    >
                        {sending ? i18n.sending : i18n.send}
                    </button>
                </div>
            </form>

            <!-- 发送结果 -->
            {#if sent}
                <span class="title">{fill(i18n.result, sent.label)}</span>
            {/if}
            <ApiResult
                labels={i18n}
                result={sent?.result}
            />
        </div>
    {/snippet}
</Tab>

<style lang="less">
    /* 页签内容整体在页签面板中滚动, 发送对象栏固定在顶部; 不能叫 .toolbar, 思源的顶栏用了这个类名 */
    .recipient {
        position: sticky;
        top: 0;
        gap: 8px;
    }

    // 名称较长时下拉列表收窄, 而不是把刷新按钮挤出页签
    .target {
        min-width: 0;
    }

    .content {
        flex-shrink: 0;
        gap: 8px;
        padding: 8px 16px;
    }

    .title {
        font-weight: bold;
    }

    .section {
        align-items: center;
        gap: 8px;
    }

    // 字段名一列, 值一列, 字段名的长度随语言变化时也能对齐
    .fields {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 4px 16px;
        margin: 0;

        dt {
            color: var(--b3-theme-on-surface);
        }

        dd {
            margin: 0;
            overflow-wrap: anywhere;
        }
    }

    .composer {
        gap: 8px;
    }

    // 选项较多、页签较窄时整个选项换行
    .options {
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 16px;
    }

    .option {
        align-items: center;
    }

    .code {
        font-family: var(--b3-font-family-code);
    }

    pre {
        margin: 8px 0 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    textarea {
        resize: vertical;
    }
</style>
