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

<!-- QQ 机器人服务端接口 (OpenAPI) 调试页签 -->

<script
    lang="ts"
    module
>
    import type Plugin from "@/index";
    import type { IApiDebuggerTab } from "@/index";

    /* 页签数据: 正在编辑的请求, 思源保存界面布局 (如打开、切换或关闭页签) 时一并保存, 恢复布局时还原 */
    export interface IApiDebuggerTabData {
        method: string; // 请求方法
        url: string; // 请求路径
        body: string; // 请求体的 JSON 文本, 为空时不发送请求体
    }

    export interface IProps {
        plugin: InstanceType<typeof Plugin>; // 插件实例
        tab: IApiDebuggerTab; // 所在的页签
    }
</script>

<script lang="ts">
    import Tab from "@workspace/components/siyuan/tab/Tab.svelte";
    import { preventDefault } from "@workspace/utils/svelte/event";

    import { API_METHODS } from "@/qq/constants";

    import type { IApiResponse } from "@/types/qq";

    /* 一次请求的结果: 目标的响应, 或者请求未能发出时的错误 */
    type TResult = { duration: number } & ({ error: string } | { response: IApiResponse });

    const { plugin, tab }: IProps = $props();

    // svelte-ignore state_referenced_locally
    const i18n = plugin.i18n.apiDebugger;
    const methods = [...API_METHODS];

    // svelte-ignore state_referenced_locally
    const request = $state({ ...tab.data }); // 正在编辑的请求
    let bodyError = $state(""); // 请求体的 JSON 解析错误
    let sending = $state(false); // 是否正在等待响应
    let result = $state.raw<TResult>(); // 最近一次请求的结果

    /* 编辑的请求写回页签数据, 思源保存界面布局时一并保存 */
    $effect(() => {
        Object.assign(tab.data, $state.snapshot(request));
    });

    /* 前端的 kernel.rpc.call 以 JsonRpcError 拒绝: message 为 JSON-RPC 的错误类型, data 为内核插件抛出的错误 */
    function formatError(error: unknown): string {
        if (!(error instanceof Error)) {
            return String(error);
        }
        const { code, data } = error as Error & { code?: number; data?: unknown };
        const lines = [code === undefined ? String(error) : `${code} ${error.message}`];
        if (data !== undefined) {
            lines.push(typeof data === "string" ? data : JSON.stringify(data, undefined, 4));
        }
        return lines.join("\n");
    }

    /* 解析请求体后通过内核插件发送请求, 请求体不是有效的 JSON 时不发送 */
    async function send(): Promise<void> {
        let body: unknown;
        if (request.body.trim()) {
            try {
                body = JSON.parse(request.body);
            }
            catch (error) {
                bodyError = String(error);
                return;
            }
        }
        bodyError = "";

        sending = true;
        const start = performance.now();
        try {
            const response = await plugin.callQQApi(request.url.trim(), request.method, body);
            result = { duration: performance.now() - start, response };
        }
        catch (error) {
            result = { duration: performance.now() - start, error: formatError(error) };
        }
        finally {
            sending = false;
        }
    }

    /* 状态码标签的样式: 2xx 为成功, 4xx 与 5xx 为错误 */
    function statusClass(status: number): string {
        if (status >= 200 && status < 300) {
            return "b3-chip--success";
        }
        return status >= 400 ? "b3-chip--error" : "b3-chip--info";
    }

    function formatHeaders(headers: Record<string, string>): string {
        return Object.entries(headers)
            .map(([name, value]) => `${name}: ${value}`)
            .join("\n");
    }

    /* JSON 响应体格式化后显示, 不是 JSON 的响应体原样显示 */
    function formatBody(body: unknown): string {
        return typeof body === "string" ? body : JSON.stringify(body, undefined, 4);
    }
</script>

<Tab>
    <!-- 请求方法、请求路径与发送按钮 -->
    {#snippet breadcrumbSlot()}
        <form
            class="protyle-breadcrumb request"
            onsubmit={preventDefault(send)}
        >
            <select
                class="b3-select"
                aria-label={i18n.method}
                bind:value={request.method}
            >
                {#each methods as method (method)}
                    <option value={method}>{method}</option>
                {/each}
            </select>
            <input
                class="b3-text-field fn__flex-1"
                aria-label={i18n.url}
                placeholder={i18n.urlPlaceholder}
                spellcheck="false"
                type="text"
                bind:value={request.url}
            />
            <button
                class="b3-button"
                disabled={sending}
                type="submit"
            >
                {sending ? i18n.sending : i18n.send}
            </button>
        </form>
    {/snippet}

    {#snippet content()}
        <div class="content fn__flex-column">
            <!-- 请求体 -->
            <label class="fn__flex-column field">
                <span class="title">{i18n.body}</span>
                <textarea
                    class="b3-text-field fn__block code"
                    aria-invalid={!!bodyError}
                    oninput={() => (bodyError = "")}
                    placeholder={i18n.bodyPlaceholder}
                    rows="8"
                    spellcheck="false"
                    bind:value={request.body}
                ></textarea>
            </label>
            {#if bodyError}
                <div
                    class="ft__error"
                    role="alert"
                >
                    {i18n.invalidBody} <code class="fn__code">{bodyError}</code>
                </div>
            {/if}

            <!-- 响应 -->
            {#if result}
                <span class="title">{i18n.response}</span>
            {/if}
            <div
                class="summary"
                aria-live="polite"
            >
                {#if result}
                    {#if "response" in result}
                        <span class="b3-chip b3-chip--middle {statusClass(result.response.status)}">{result.response.status}</span>
                    {:else}
                        <span class="b3-chip b3-chip--middle b3-chip--error">{i18n.error}</span>
                    {/if}
                    <span class="ft__on-surface">{i18n.duration} {Math.round(result.duration)} ms</span>
                {/if}
            </div>
            {#if result}
                {#if "response" in result}
                    <details>
                        <summary>{i18n.headers}</summary>
                        <pre class="code">{formatHeaders(result.response.headers)}</pre>
                    </details>
                    {#if result.response.body === null}
                        <span class="ft__on-surface">{i18n.noBody}</span>
                    {:else}
                        <pre class="code">{formatBody(result.response.body)}</pre>
                    {/if}
                {:else}
                    <pre class="code ft__error">{result.error}</pre>
                {/if}
            {/if}
        </div>
    {/snippet}
</Tab>

<style lang="less">
    /* 页签内容整体在页签面板中滚动, 响应较长时请求栏固定在顶部 */
    .request {
        position: sticky;
        top: 0;
        gap: 8px;
    }

    .content {
        flex-shrink: 0;
        gap: 8px;
        padding: 8px 16px;
    }

    .field {
        gap: 8px;
    }

    .title {
        font-weight: bold;
    }

    .summary {
        display: flex;
        align-items: center;
        gap: 8px;

        &:empty {
            display: none;
        }
    }

    .code {
        font-family: var(--b3-font-family-code);
    }

    textarea {
        resize: vertical;
    }

    pre {
        margin: 0;
        padding: 8px;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        border-radius: var(--b3-border-radius);
        background-color: var(--b3-theme-surface);
    }

    details > pre {
        margin-top: 8px;
    }
</style>
