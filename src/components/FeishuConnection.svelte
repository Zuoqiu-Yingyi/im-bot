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

<!-- 飞书机器人的连接状态: 打开设置面板期间定时刷新 -->

<script
    lang="ts"
    module
>
    import type Plugin from "@/index";

    export interface IProps {
        plugin: InstanceType<typeof Plugin>; // 插件实例
    }
</script>

<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import { formatRpcError } from "@/utils/rpc";

    import type { IFeishuConnectionState } from "@/types/feishu";

    const { plugin }: IProps = $props();

    // svelte-ignore state_referenced_locally
    const i18n = plugin.i18n.settings.feishuBotSettings.connection;

    const REFRESH_INTERVAL = 2_000; // 刷新连接状态的间隔 (ms)

    let connection = $state<IFeishuConnectionState | null>(null);
    let error = $state(""); // RPC 调用失败的原因

    let timer: ReturnType<typeof setTimeout> | undefined;
    let destroyed = false;

    function fill(template: string, value: string): string {
        return template.replaceAll("{{1}}", () => value);
    }

    function formatTime(time: string | undefined): string {
        if (!time) {
            return "-";
        }
        const date = new Date(time);
        return Number.isNaN(date.getTime()) ? time : date.toLocaleString();
    }

    function statusText(current: IFeishuConnectionState): string {
        switch (current.status) {
            case "connected":
                return fill(i18n.connected, formatTime(current.since));
            case "connecting":
                return i18n.connecting;
            case "reconnecting":
                return fill(i18n.reconnecting, formatTime(current.retryAt));
            case "failed":
                return i18n.failed;
            case "unconfigured":
                return i18n.unconfigured;
            case "offline":
                return i18n.offline;
            case "other-device":
                return fill(i18n.otherDevice, current.device ?? "-");
            default:
                return i18n.stopped;
        }
    }

    /* 获取连接状态, 稍后再次获取; 设置定时器前先清除上一个 */
    async function refresh(): Promise<void> {
        try {
            connection = await plugin.getFeishuConnectionState();
            error = "";
        }
        catch (e) {
            error = formatRpcError(e);
        }
        clearTimeout(timer);
        if (!destroyed) {
            timer = setTimeout(() => void refresh(), REFRESH_INTERVAL);
        }
    }

    onMount(() => {
        void refresh();
    });

    onDestroy(() => {
        destroyed = true;
        clearTimeout(timer);
    });
</script>

<div
    class="feishu-connection"
    aria-live="polite"
>
    {#if connection}
        <dl class="feishu-connection__state">
            <dt>{i18n.status}</dt>
            <dd class:ft__error={connection.status === "failed"}>{statusText(connection)}</dd>
            {#if connection.username}
                <dt>{i18n.username}</dt>
                <dd>{connection.username}</dd>
            {/if}
            {#if connection.error}
                <dt>{i18n.reason}</dt>
                <dd><code class="fn__code">{connection.error}</code></dd>
            {/if}
        </dl>
    {:else if !error}
        <div class="ft__on-surface">{i18n.loading}</div>
    {/if}

    {#if error}
        <pre class="ft__error feishu-connection__error">{error}</pre>
    {/if}
</div>

<style lang="less">
    .feishu-connection {
        display: flex;
        flex-direction: column;
        gap: 8px;

        &__state {
            display: grid;
            gap: 4px 16px;
            grid-template-columns: max-content 1fr;
            margin: 0;

            dd {
                margin: 0;
                overflow-wrap: anywhere;
            }
        }

        &__error {
            margin: 0;
            white-space: pre-wrap;
        }
    }
</style>
