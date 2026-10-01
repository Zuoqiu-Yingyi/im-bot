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
    import { formatRpcError } from "@/utils/rpc";

    import ApiResult from "./ApiResult.svelte";

    import type { TApiResult } from "./ApiResult.svelte";

    const { plugin, tab }: IProps = $props();

    // svelte-ignore state_referenced_locally
    const i18n = plugin.i18n.apiDebugger;
    const methods = [...API_METHODS];

    // svelte-ignore state_referenced_locally
    const request = $state({ ...tab.data }); // 正在编辑的请求
    let bodyError = $state(""); // 请求体的 JSON 解析错误
    let sending = $state(false); // 是否正在等待响应
    let result = $state.raw<TApiResult>(); // 最近一次请求的结果

    /* 编辑的请求写回页签数据, 思源保存界面布局时一并保存 */
    $effect(() => {
        Object.assign(tab.data, $state.snapshot(request));
    });

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
            result = { duration: performance.now() - start, error: formatRpcError(error) };
        }
        finally {
            sending = false;
        }
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
            <ApiResult
                labels={i18n}
                {result}
            />
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

    .code {
        font-family: var(--b3-font-family-code);
    }

    textarea {
        resize: vertical;
    }
</style>
