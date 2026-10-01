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

<!-- 一次 OpenAPI 请求的结果: 状态码、耗时、响应头与响应体, 或者请求未能发出时的错误 -->

<script
    lang="ts"
    module
>
    import type { IApiResponse } from "@/types/qq";

    /* 一次请求的结果: 目标的响应, 或者请求未能发出时的错误 */
    export type TApiResult = { duration: number } & ({ error: string } | { response: IApiResponse });

    /* 界面文本 */
    export interface IApiResultLabels {
        duration: string; // 耗时
        error: string; // 请求未能发出
        headers: string; // 响应头
        noBody: string; // 没有响应体
    }

    export interface IProps {
        result?: TApiResult; // 最近一次请求的结果, 为空时不显示
        labels: IApiResultLabels;
    }
</script>

<script lang="ts">
    const { result, labels }: IProps = $props();

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

<div
    class="summary"
    aria-live="polite"
>
    {#if result}
        {#if "response" in result}
            <span class="b3-chip b3-chip--middle {statusClass(result.response.status)}">{result.response.status}</span>
        {:else}
            <span class="b3-chip b3-chip--middle b3-chip--error">{labels.error}</span>
        {/if}
        <span class="ft__on-surface">{labels.duration} {Math.round(result.duration)} ms</span>
    {/if}
</div>
{#if result}
    {#if "response" in result}
        <details>
            <summary>{labels.headers}</summary>
            <pre class="code">{formatHeaders(result.response.headers)}</pre>
        </details>
        {#if result.response.body === null}
            <span class="ft__on-surface">{labels.noBody}</span>
        {:else}
            <pre class="code">{formatBody(result.response.body)}</pre>
        {/if}
    {:else}
        <pre class="code ft__error">{result.error}</pre>
    {/if}
{/if}

<style lang="less">
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
