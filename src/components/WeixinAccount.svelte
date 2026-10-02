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

<!-- 微信账号: 扫码登录、登录信息与退出登录 -->

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
    import { renderSVG } from "uqr";

    import { preventDefault } from "@workspace/utils/svelte/event";

    import { formatRpcError } from "@/utils/rpc";

    import type { IWeixinAccountState, IWeixinLoginState, TWeixinLoginStatus } from "@/types/weixin";

    const { plugin }: IProps = $props();

    // svelte-ignore state_referenced_locally
    const i18n = plugin.i18n.settings.weixinBotSettings.account;

    const POLL_INTERVAL = 1_000; // 登录进行中时查询登录状态的间隔 (ms), 内核插件在后台长轮询扫码状态
    const ACTIVE_STATUSES = new Set<TWeixinLoginStatus>([
        "need_verifycode",
        "scaned",
        "verifying",
        "wait",
    ]);

    const currentDevice = window.siyuan.config!.system.id; // 本机设备 ID

    let account = $state<IWeixinAccountState | null>(null);
    let login = $state<IWeixinLoginState>({ status: "idle" });
    let error = $state(""); // RPC 调用失败的原因
    let code = $state(""); // 手机微信上显示的数字
    let busy = $state(false); // 正在开始登录或退出登录

    let timer: ReturnType<typeof setTimeout> | undefined;
    let destroyed = false;

    const active = $derived(ACTIVE_STATUSES.has(login.status));
    // 二维码固定为白底黑块, 深色主题下也能识别; 链接是登录凭证, 只在本地生成二维码
    const qrcode = $derived(active && login.url
        ? renderSVG(login.url, {
            border: 2,
            pixelSize: 4,
            whiteColor: "#fff",
            blackColor: "#000",
        })
        : "");

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

    async function loadAccount(): Promise<void> {
        try {
            account = await plugin.getWeixinAccount();
        }
        catch (e) {
            error = formatRpcError(e);
        }
    }

    /**
     * 查询登录状态, 登录进行中时稍后再次查询。
     * 设置定时器前先清除上一个, 同时进行的多次查询最终只留下一个定时器
     */
    async function poll(): Promise<void> {
        try {
            login = await plugin.getWeixinLoginState();
            error = "";
        }
        catch (e) {
            error = formatRpcError(e);
        }
        if (login.status === "confirmed") {
            await loadAccount();
        }
        clearTimeout(timer);
        if (!destroyed && ACTIVE_STATUSES.has(login.status)) {
            timer = setTimeout(() => void poll(), POLL_INTERVAL);
        }
    }

    async function start(): Promise<void> {
        busy = true;
        error = "";
        code = "";
        try {
            login = await plugin.startWeixinLogin();
        }
        catch (e) {
            error = formatRpcError(e);
        }
        finally {
            busy = false;
        }
        void poll();
    }

    async function verify(): Promise<void> {
        try {
            login = await plugin.verifyWeixinLogin(code.trim());
            code = "";
            error = "";
        }
        catch (e) {
            error = formatRpcError(e);
        }
        void poll();
    }

    async function cancel(): Promise<void> {
        try {
            login = await plugin.cancelWeixinLogin();
        }
        catch (e) {
            error = formatRpcError(e);
        }
        void poll();
    }

    function logout(): void {
        plugin.siyuan.confirm(
            i18n.logoutTitle,
            i18n.logoutDescription,
            async () => {
                busy = true;
                try {
                    await plugin.logoutWeixin();
                    login = { status: "idle" };
                    error = "";
                }
                catch (e) {
                    error = formatRpcError(e);
                }
                finally {
                    busy = false;
                }
                await loadAccount();
            },
        );
    }

    onMount(() => {
        void loadAccount().then(poll);
    });

    // 关闭设置面板时不取消登录: 已扫码的登录仍会由内核插件在后台完成, 再次打开设置面板时继续显示
    onDestroy(() => {
        destroyed = true;
        clearTimeout(timer);
    });
</script>

<div class="weixin">
    {#if account}
        <dl class="weixin__account">
            <dt>{i18n.botId}</dt>
            <dd><code class="fn__code">{account.botId}</code></dd>
            <dt>{i18n.userId}</dt>
            <dd><code class="fn__code">{account.userId || "-"}</code></dd>
            <dt>{i18n.loginTime}</dt>
            <dd>{formatTime(account.loginTime)}</dd>
            <dt>{i18n.device}</dt>
            <dd>
                {account.deviceName || "-"}
                <code class="fn__code">{account.device}</code>
                {#if account.device === currentDevice}
                    ({i18n.thisDevice})
                {/if}
            </dd>
            <dt>{i18n.status}</dt>
            <dd>
                {#if account.expiredAt}
                    <span class="ft__error">{fill(i18n.expired, formatTime(account.expiredAt))}</span>
                {:else if account.device !== currentDevice}
                    {i18n.otherDevice}
                {:else if account.running}
                    {i18n.running}
                {:else}
                    {i18n.notRunning}
                {/if}
            </dd>
        </dl>
    {:else}
        <div class="ft__on-surface">{i18n.notLoggedIn}</div>
    {/if}

    <div
        class="weixin__login"
        aria-live="polite"
    >
        {#if active}
            {#if qrcode}
                <div
                    class="weixin__qrcode"
                    aria-label={i18n.qrcode}
                    role="img"
                >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html qrcode}
                </div>
            {:else}
                <div>{i18n.loading}</div>
            {/if}

            {#if login.status === "wait"}
                <div>{i18n.wait}</div>
            {:else if login.status === "scaned"}
                <div>{i18n.scaned}</div>
            {:else if login.status === "verifying"}
                <div>{i18n.verifying}</div>
            {:else if login.status === "need_verifycode"}
                <form
                    class="fn__flex weixin__verify"
                    onsubmit={preventDefault(verify)}
                >
                    <label class="fn__flex">
                        <span class={login.wrongCode ? "ft__error" : ""}>{login.wrongCode ? i18n.wrongCode : i18n.needVerifyCode}</span>
                        <span class="fn__space"></span>
                        <input
                            class="b3-text-field"
                            autocomplete="one-time-code"
                            inputmode="numeric"
                            bind:value={code}
                        />
                    </label>
                    <span class="fn__space"></span>
                    <button
                        class="b3-button"
                        disabled={!code.trim()}
                        type="submit"
                    >
                        {i18n.verify}
                    </button>
                </form>
            {/if}
        {:else if login.status === "confirmed"}
            <div>{i18n.confirmed}</div>
        {:else if login.status === "expired"}
            <div class="ft__error">{i18n.qrcodeExpired}</div>
        {:else if login.status === "failed"}
            <div class="ft__error">{fill(i18n.failed, login.error ?? "")}</div>
        {/if}
    </div>

    <div class="fn__flex weixin__actions">
        {#if active}
            <button
                class="b3-button b3-button--cancel"
                onclick={cancel}
            >
                {i18n.cancel}
            </button>
        {:else}
            <button
                class="b3-button b3-button--outline"
                disabled={busy}
                onclick={start}
            >
                {account ? i18n.relogin : i18n.login}
            </button>
        {/if}
        {#if account}
            <button
                class="b3-button b3-button--remove"
                disabled={busy}
                onclick={logout}
            >
                {i18n.logout}
            </button>
        {/if}
    </div>

    {#if error}
        <pre class="ft__error weixin__error">{error}</pre>
    {/if}
</div>

<style lang="less">
    .weixin {
        display: flex;
        flex-direction: column;
        gap: 8px;

        &__account {
            display: grid;
            gap: 4px 16px;
            grid-template-columns: max-content 1fr;
            margin: 0;

            dd {
                margin: 0;
            }
        }

        &__login:empty {
            display: none;
        }

        // 二维码需要留白, 放大到便于手机扫描的尺寸
        &__qrcode {
            width: 200px;
            margin-bottom: 8px;

            :global(svg) {
                display: block;
                width: 100%;
                height: auto;
            }
        }

        &__verify,
        &__actions {
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }

        &__error {
            margin: 0;
            white-space: pre-wrap;
        }
    }
</style>
