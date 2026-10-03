<!--
 Copyright (C) 2024 Zuoqiu Yingyi

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

<!-- 设置面板 -->

<script lang="ts">
    import Group from "@workspace/components/siyuan/setting/item/Group.svelte";
    import Input from "@workspace/components/siyuan/setting/item/Input.svelte";
    import { ItemType } from "@workspace/components/siyuan/setting/item/item";
    import Item from "@workspace/components/siyuan/setting/item/Item.svelte";
    import MiniItem from "@workspace/components/siyuan/setting/item/MiniItem.svelte";
    import Panel from "@workspace/components/siyuan/setting/panel/Panel.svelte";
    import Panels from "@workspace/components/siyuan/setting/panel/Panels.svelte";
    import Tabs from "@workspace/components/siyuan/setting/tab/Tabs.svelte";

    import { DEFAULT_FEISHU_INBOX_BINDING, DEFAULT_INBOX_BINDING, DEFAULT_TELEGRAM_INBOX_BINDING } from "@/configs/default";
    import { DEFAULT_API_BASE_URL as DEFAULT_FEISHU_API_BASE_URL } from "@/feishu/constants";
    import { INTENTS } from "@/qq/constants";
    import { DEFAULT_API_BASE_URL } from "@/telegram/constants";

    import FeishuConnection from "./FeishuConnection.svelte";
    import QQConnection from "./QQConnection.svelte";
    import TelegramConnection from "./TelegramConnection.svelte";
    import WeixinAccount from "./WeixinAccount.svelte";

    import type { ITab } from "@workspace/components/siyuan/setting/tab";

    import type Plugin from "@/index";
    import type { TIntent } from "@/qq/constants";
    import type { IConfig, IFeishuInboxBinding, IQQInboxBinding, ITelegramInboxBinding } from "@/types/config";

    interface IProps {
        config: IConfig; // 传入的配置项
        plugin: InstanceType<typeof Plugin>; // 插件实例
    }

    const { config, plugin }: IProps = $props();

    // svelte-ignore state_referenced_locally
    const i18n = plugin.i18n;

    async function updated() {
        await plugin.updateConfig(config);
    }

    function resetOptions() {
        plugin.siyuan.confirm(
            i18n.settings.generalSettings.reset.title, // 标题
            i18n.settings.generalSettings.reset.description, // 文本
            async () => {
                await plugin.resetConfig(); // 重置配置
                globalThis.location.reload(); // 刷新页面
            }, // 确认按钮回调
        );
    }

    const PanelKey = {
        general: "general", // 常规设置
        qq: "qq", // QQ 机器人设置
        weixin: "weixin", // 微信机器人设置
        telegram: "telegram", // Telegram 机器人设置
        feishu: "feishu", // 飞书机器人设置
    } as const;

    const TabKey = {
        bot: "bot", // 机器人
        inbox: "inbox", // 收集箱
    } as const;

    const panels_focus_key = PanelKey.general;
    const panels = [
        {
            key: PanelKey.general,
            text: i18n.settings.generalSettings.title,
            name: i18n.settings.generalSettings.title,
            icon: "#iconSettings",
        },
        {
            key: PanelKey.qq,
            text: i18n.settings.qqBotSettings.title,
            name: i18n.settings.qqBotSettings.title,
            icon: "#icon-qq",
        },
        {
            key: PanelKey.weixin,
            text: i18n.settings.weixinBotSettings.title,
            name: i18n.settings.weixinBotSettings.title,
            icon: "#icon-wechat",
        },
        {
            key: PanelKey.telegram,
            text: i18n.settings.telegramBotSettings.title,
            name: i18n.settings.telegramBotSettings.title,
            icon: "#icon-telegram",
        },
        {
            key: PanelKey.feishu,
            text: i18n.settings.feishuBotSettings.title,
            name: i18n.settings.feishuBotSettings.title,
            icon: "#icon-feishu",
        },
    ] as const satisfies ITab[];

    /* 各机器人面板中的页签: 机器人本身的设置与收集箱的设置 */
    const tabs_focus_key = TabKey.bot;
    const qqTabs = [
        {
            key: TabKey.bot,
            text: i18n.settings.qqBotSettings.tabs.bot,
            name: i18n.settings.qqBotSettings.tabs.bot,
            icon: "⚙",
        },
        {
            key: TabKey.inbox,
            text: i18n.settings.qqBotSettings.tabs.inbox,
            name: i18n.settings.qqBotSettings.tabs.inbox,
            icon: "📥",
        },
    ] as const satisfies ITab[];
    const weixinTabs = [
        {
            key: TabKey.bot,
            text: i18n.settings.weixinBotSettings.tabs.bot,
            name: i18n.settings.weixinBotSettings.tabs.bot,
            icon: "⚙",
        },
        {
            key: TabKey.inbox,
            text: i18n.settings.weixinBotSettings.tabs.inbox,
            name: i18n.settings.weixinBotSettings.tabs.inbox,
            icon: "📥",
        },
    ] as const satisfies ITab[];
    const telegramTabs = [
        {
            key: TabKey.bot,
            text: i18n.settings.telegramBotSettings.tabs.bot,
            name: i18n.settings.telegramBotSettings.tabs.bot,
            icon: "⚙",
        },
        {
            key: TabKey.inbox,
            text: i18n.settings.telegramBotSettings.tabs.inbox,
            name: i18n.settings.telegramBotSettings.tabs.inbox,
            icon: "📥",
        },
    ] as const satisfies ITab[];
    const feishuTabs = [
        {
            key: TabKey.bot,
            text: i18n.settings.feishuBotSettings.tabs.bot,
            name: i18n.settings.feishuBotSettings.tabs.bot,
            icon: "⚙",
        },
        {
            key: TabKey.inbox,
            text: i18n.settings.feishuBotSettings.tabs.inbox,
            name: i18n.settings.feishuBotSettings.tabs.inbox,
            icon: "📥",
        },
    ] as const satisfies ITab[];

    const intents = Object.keys(INTENTS) as TIntent[];
    const intentsTitle = `${i18n.settings.qqBotSettings.intents.title}<div class="b3-label__text">${i18n.settings.qqBotSettings.intents.description}</div>`;

    const currentDevice = window.siyuan.config!.system.id; // 本机设备 ID
    // svelte-ignore state_referenced_locally
    let device = $state(config.qq.device); // 运行 QQ 机器人的设备 ID

    // svelte-ignore state_referenced_locally
    let weixinOnline = $state(config.weixin.online); // 内核插件已应用的微信上线开关, 变化后微信账号重新获取接收状态

    const bindingsTitle = `${i18n.settings.qqBotSettings.inboxBindings.title}<div class="b3-label__text">${i18n.settings.qqBotSettings.inboxBindings.description}</div>`;

    /* 收集箱绑定; 旧版配置中的绑定没有 enabled、reply 与 notify, 按默认值补全 */
    // svelte-ignore state_referenced_locally
    const bindings = $state<IQQInboxBinding[]>(config.qq.inbox.bindings.map((binding) => ({ ...DEFAULT_INBOX_BINDING, ...binding })));

    async function saveBindings() {
        config.qq.inbox.bindings = $state.snapshot(bindings);
        await updated();
    }

    async function addBinding() {
        bindings.push({ ...DEFAULT_INBOX_BINDING });
        await saveBindings();
    }

    async function removeBinding(index: number) {
        bindings.splice(index, 1);
        await saveBindings();
    }

    // svelte-ignore state_referenced_locally
    let telegramDevice = $state(config.telegram.device); // 运行 Telegram 机器人的设备 ID

    const telegramBindingsTitle = `${i18n.settings.telegramBotSettings.inboxBindings.title}<div class="b3-label__text">${i18n.settings.telegramBotSettings.inboxBindings.description}</div>`;

    /* Telegram 收集箱绑定; 手动编辑的配置可能缺少字段, 按默认值补全 */
    // svelte-ignore state_referenced_locally
    const telegramBindings = $state<ITelegramInboxBinding[]>(config.telegram.inbox.bindings.map((binding) => ({ ...DEFAULT_TELEGRAM_INBOX_BINDING, ...binding })));

    async function saveTelegramBindings() {
        config.telegram.inbox.bindings = $state.snapshot(telegramBindings);
        await updated();
    }

    async function addTelegramBinding() {
        telegramBindings.push({ ...DEFAULT_TELEGRAM_INBOX_BINDING });
        await saveTelegramBindings();
    }

    async function removeTelegramBinding(index: number) {
        telegramBindings.splice(index, 1);
        await saveTelegramBindings();
    }

    // svelte-ignore state_referenced_locally
    let feishuDevice = $state(config.feishu.device); // 运行飞书机器人的设备 ID

    const feishuBindingsTitle = `${i18n.settings.feishuBotSettings.inboxBindings.title}<div class="b3-label__text">${i18n.settings.feishuBotSettings.inboxBindings.description}</div>`;

    /* 飞书收集箱绑定; 手动编辑的配置可能缺少字段, 按默认值补全 */
    // svelte-ignore state_referenced_locally
    const feishuBindings = $state<IFeishuInboxBinding[]>(config.feishu.inbox.bindings.map((binding) => ({ ...DEFAULT_FEISHU_INBOX_BINDING, ...binding })));

    async function saveFeishuBindings() {
        config.feishu.inbox.bindings = $state.snapshot(feishuBindings);
        await updated();
    }

    async function addFeishuBinding() {
        feishuBindings.push({ ...DEFAULT_FEISHU_INBOX_BINDING });
        await saveFeishuBindings();
    }

    async function removeFeishuBinding(index: number) {
        feishuBindings.splice(index, 1);
        await saveFeishuBindings();
    }
</script>

<Panels
    focus={panels_focus_key}
    {panels}
>
    {#snippet children(focusPanel)}
        <!-- 常规设置面板 -->
        <Panel display={panels[0].key === focusPanel}>
            <!-- 重置设置 -->
            <Item
                text={i18n.settings.generalSettings.reset.description}
                title={i18n.settings.generalSettings.reset.title}
            >
                {#snippet input()}
                    <Input
                        onClicked={resetOptions}
                        settingKey="Reset"
                        settingValue={i18n.settings.generalSettings.reset.text}
                        type={ItemType.button}
                    />
                {/snippet}
            </Item>
        </Panel>

        <!-- QQ 机器人设置面板: 机器人与收集箱两个页签 -->
        <Panel display={panels[1].key === focusPanel}>
            <Tabs
                focus={tabs_focus_key}
                tabs={qqTabs}
            >
                {#snippet children(focusTab)}
                    <!-- 标签页 1 - 机器人 -->
                    <div
                        class:fn__none={qqTabs[0].key !== focusTab}
                        data-type={qqTabs[0].name}
                    >
                        <!-- 上线 -->
                        <Item
                            text={i18n.settings.qqBotSettings.online.description}
                            title={i18n.settings.qqBotSettings.online.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.qq.online = e.value;
                                        await updated();
                                    }}
                                    settingKey="online"
                                    settingValue={config.qq.online}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 连接状态 -->
                        <div class="b3-label">
                            {i18n.settings.qqBotSettings.connection.title}
                            <div class="b3-label__text">{i18n.settings.qqBotSettings.connection.description}</div>
                            <div class="fn__hr"></div>
                            <QQConnection {plugin} />
                        </div>

                        <!-- AppID -->
                        <Item
                            block={true}
                            text={i18n.settings.qqBotSettings.appid.description}
                            title={i18n.settings.qqBotSettings.appid.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.qq.appid = e.value;
                                        await updated();
                                    }}
                                    placeholder="QQ_BOT_APPID"
                                    settingKey="appid"
                                    settingValue={config.qq.appid}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- AppSecret -->
                        <Item
                            block={true}
                            text={i18n.settings.qqBotSettings.secret.description}
                            title={i18n.settings.qqBotSettings.secret.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.qq.secret = e.value;
                                        await updated();
                                    }}
                                    placeholder="QQ_BOT_SECRET"
                                    settingKey="secret"
                                    settingValue={config.qq.secret}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- 订阅事件 -->
                        <Group title={intentsTitle}>
                            {#each intents as intent (intent)}
                                <MiniItem
                                    marginRight="1em"
                                    minWidth="18em"
                                >
                                    {#snippet title()}
                                        {i18n.settings.qqBotSettings.intents.items[intent]}
                                        <div class="b3-label__text">
                                            <code class="fn__code">{intent}</code>
                                        </div>
                                    {/snippet}
                                    {#snippet input()}
                                        <Input
                                            onChanged={async (e) => {
                                                config.qq.intents[intent] = e.value;
                                                await updated();
                                            }}
                                            settingKey={intent}
                                            settingValue={config.qq.intents[intent]}
                                            type={ItemType.checkbox}
                                        />
                                    {/snippet}
                                </MiniItem>
                            {/each}
                        </Group>

                        <!-- 事件日志 -->
                        <Item
                            text={i18n.settings.qqBotSettings.eventLog.description}
                            title={i18n.settings.qqBotSettings.eventLog.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.qq.eventLog = e.value;
                                        await updated();
                                    }}
                                    settingKey="eventLog"
                                    settingValue={config.qq.eventLog}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 运行设备 -->
                        <Item title={i18n.settings.qqBotSettings.device.title}>
                            {#snippet textSlot()}
                                {i18n.settings.qqBotSettings.device.description}
                                <br />
                                {i18n.settings.qqBotSettings.device.current} <code class="fn__code">{currentDevice}</code>
                                <br />
                                {#if device}
                                    {i18n.settings.qqBotSettings.device.assigned} <code class="fn__code">{device}</code>
                                {:else}
                                    {i18n.settings.qqBotSettings.device.unassigned}
                                {/if}
                            {/snippet}
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        device = e.value ? currentDevice : "";
                                        config.qq.device = device;
                                        await updated();
                                    }}
                                    settingKey="device"
                                    settingValue={device === currentDevice}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>

                    <!-- 标签页 2 - 收集箱 -->
                    <div
                        class:fn__none={qqTabs[1].key !== focusTab}
                        data-type={qqTabs[1].name}
                    >
                        <!-- 绑定群聊: 不能放进 Item 的 label 中, 否则点击空白处会切换第一个开关 -->
                        <div class="b3-label">
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                            {@html bindingsTitle}
                            {#each bindings as binding, index (binding)}
                                <div class="fn__hr"></div>
                                <div class="binding">
                                    <div class="binding__fields">
                                        <label class="binding__field">
                                            <span>{i18n.settings.qqBotSettings.inboxBindings.group}</span>
                                            <Input
                                                block={true}
                                                onChanged={async (e) => {
                                                    binding.chat = e.value.trim();
                                                    await saveBindings();
                                                }}
                                                placeholder={i18n.settings.qqBotSettings.inboxBindings.groupPlaceholder}
                                                settingKey="chat"
                                                settingValue={binding.chat}
                                                type={ItemType.text}
                                            />
                                        </label>
                                        <label class="binding__field">
                                            <span>{i18n.settings.qqBotSettings.inboxBindings.doc}</span>
                                            <Input
                                                block={true}
                                                onChanged={async (e) => {
                                                    binding.doc = e.value.trim();
                                                    await saveBindings();
                                                }}
                                                placeholder={i18n.settings.qqBotSettings.inboxBindings.docPlaceholder}
                                                settingKey="doc"
                                                settingValue={binding.doc}
                                                type={ItemType.text}
                                            />
                                        </label>
                                    </div>
                                    <div class="fn__flex binding__switches">
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.qqBotSettings.inboxBindings.enabled}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.enabled = e.value;
                                                    await saveBindings();
                                                }}
                                                settingKey="enabled"
                                                settingValue={binding.enabled}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.qqBotSettings.inboxBindings.reply}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.reply = e.value;
                                                    await saveBindings();
                                                }}
                                                settingKey="reply"
                                                settingValue={binding.reply}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.qqBotSettings.inboxBindings.notify}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.notify = e.value;
                                                    await saveBindings();
                                                }}
                                                settingKey="notify"
                                                settingValue={binding.notify}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <button
                                            class="b3-button b3-button--remove binding__remove"
                                            onclick={() => removeBinding(index)}
                                        >
                                            {i18n.settings.qqBotSettings.inboxBindings.remove}
                                        </button>
                                    </div>
                                </div>
                            {/each}
                            <div class="fn__hr"></div>
                            <button
                                class="b3-button b3-button--outline"
                                onclick={addBinding}
                            >
                                {i18n.settings.qqBotSettings.inboxBindings.add}
                            </button>
                        </div>

                        <!-- 下载资源文件 -->
                        <Item
                            text={i18n.settings.qqBotSettings.inboxDownloadAssets.description}
                            title={i18n.settings.qqBotSettings.inboxDownloadAssets.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.qq.inbox.downloadAssets = e.value;
                                        await updated();
                                    }}
                                    settingKey="downloadAssets"
                                    settingValue={config.qq.inbox.downloadAssets}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>
                {/snippet}
            </Tabs>
        </Panel>

        <!-- 微信机器人设置面板: 机器人与收集箱两个页签 -->
        <Panel display={panels[2].key === focusPanel}>
            <Tabs
                focus={tabs_focus_key}
                tabs={weixinTabs}
            >
                {#snippet children(focusTab)}
                    <!-- 标签页 1 - 机器人 -->
                    <div
                        class:fn__none={weixinTabs[0].key !== focusTab}
                        data-type={weixinTabs[0].name}
                    >
                        <!-- 上线 -->
                        <Item
                            text={i18n.settings.weixinBotSettings.online.description}
                            title={i18n.settings.weixinBotSettings.online.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.weixin.online = e.value;
                                        await updated();
                                        weixinOnline = e.value; // 内核插件应用配置后, 微信账号再重新获取接收状态
                                    }}
                                    settingKey="weixinOnline"
                                    settingValue={config.weixin.online}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 微信账号: 含多个控件, 不能放进 Item 的 label 中 -->
                        <div class="b3-label">
                            {i18n.settings.weixinBotSettings.account.title}
                            <div class="b3-label__text">{i18n.settings.weixinBotSettings.account.description}</div>
                            <div class="fn__hr"></div>
                            <WeixinAccount
                                online={weixinOnline}
                                {plugin}
                            />
                        </div>

                        <!-- 事件日志 -->
                        <Item
                            text={i18n.settings.weixinBotSettings.eventLog.description}
                            title={i18n.settings.weixinBotSettings.eventLog.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.weixin.eventLog = e.value;
                                        await updated();
                                    }}
                                    settingKey="weixinEventLog"
                                    settingValue={config.weixin.eventLog}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>

                    <!-- 标签页 2 - 收集箱 -->
                    <div
                        class:fn__none={weixinTabs[1].key !== focusTab}
                        data-type={weixinTabs[1].name}
                    >
                        <!-- 收集箱文档 -->
                        <Item
                            block={true}
                            text={i18n.settings.weixinBotSettings.inboxDoc.description}
                            title={i18n.settings.weixinBotSettings.inboxDoc.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.weixin.inbox.doc = e.value.trim();
                                        await updated();
                                    }}
                                    placeholder={i18n.settings.weixinBotSettings.inboxDoc.placeholder}
                                    settingKey="weixinInboxDoc"
                                    settingValue={config.weixin.inbox.doc}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- 写入收集箱 -->
                        <Item
                            text={i18n.settings.weixinBotSettings.inboxEnabled.description}
                            title={i18n.settings.weixinBotSettings.inboxEnabled.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.weixin.inbox.enabled = e.value;
                                        await updated();
                                    }}
                                    settingKey="weixinInboxEnabled"
                                    settingValue={config.weixin.inbox.enabled}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 回复块链接 -->
                        <Item
                            text={i18n.settings.weixinBotSettings.inboxReply.description}
                            title={i18n.settings.weixinBotSettings.inboxReply.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.weixin.inbox.reply = e.value;
                                        await updated();
                                    }}
                                    settingKey="weixinInboxReply"
                                    settingValue={config.weixin.inbox.reply}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 下载资源文件 -->
                        <Item
                            text={i18n.settings.weixinBotSettings.inboxDownloadAssets.description}
                            title={i18n.settings.weixinBotSettings.inboxDownloadAssets.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.weixin.inbox.downloadAssets = e.value;
                                        await updated();
                                    }}
                                    settingKey="weixinInboxDownloadAssets"
                                    settingValue={config.weixin.inbox.downloadAssets}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>
                {/snippet}
            </Tabs>
        </Panel>

        <!-- Telegram 机器人设置面板: 机器人与收集箱两个页签 -->
        <Panel display={panels[3].key === focusPanel}>
            <Tabs
                focus={tabs_focus_key}
                tabs={telegramTabs}
            >
                {#snippet children(focusTab)}
                    <!-- 标签页 1 - 机器人 -->
                    <div
                        class:fn__none={telegramTabs[0].key !== focusTab}
                        data-type={telegramTabs[0].name}
                    >
                        <!-- 上线 -->
                        <Item
                            text={i18n.settings.telegramBotSettings.online.description}
                            title={i18n.settings.telegramBotSettings.online.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.telegram.online = e.value;
                                        await updated();
                                    }}
                                    settingKey="telegramOnline"
                                    settingValue={config.telegram.online}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 连接状态 -->
                        <div class="b3-label">
                            {i18n.settings.telegramBotSettings.connection.title}
                            <div class="b3-label__text">{i18n.settings.telegramBotSettings.connection.description}</div>
                            <div class="fn__hr"></div>
                            <TelegramConnection {plugin} />
                        </div>

                        <!-- Token -->
                        <Item
                            block={true}
                            text={i18n.settings.telegramBotSettings.token.description}
                            title={i18n.settings.telegramBotSettings.token.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.telegram.token = e.value.trim();
                                        await updated();
                                    }}
                                    placeholder={i18n.settings.telegramBotSettings.token.placeholder}
                                    settingKey="telegramToken"
                                    settingValue={config.telegram.token}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- Bot API 地址 -->
                        <Item
                            block={true}
                            text={i18n.settings.telegramBotSettings.apiBaseUrl.description}
                            title={i18n.settings.telegramBotSettings.apiBaseUrl.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.telegram.apiBaseUrl = e.value.trim();
                                        await updated();
                                    }}
                                    placeholder={DEFAULT_API_BASE_URL}
                                    settingKey="telegramApiBaseUrl"
                                    settingValue={config.telegram.apiBaseUrl}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- 事件日志 -->
                        <Item
                            text={i18n.settings.telegramBotSettings.eventLog.description}
                            title={i18n.settings.telegramBotSettings.eventLog.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.telegram.eventLog = e.value;
                                        await updated();
                                    }}
                                    settingKey="telegramEventLog"
                                    settingValue={config.telegram.eventLog}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 运行设备 -->
                        <Item title={i18n.settings.telegramBotSettings.device.title}>
                            {#snippet textSlot()}
                                {i18n.settings.telegramBotSettings.device.description}
                                <br />
                                {i18n.settings.telegramBotSettings.device.current} <code class="fn__code">{currentDevice}</code>
                                <br />
                                {#if telegramDevice}
                                    {i18n.settings.telegramBotSettings.device.assigned} <code class="fn__code">{telegramDevice}</code>
                                {:else}
                                    {i18n.settings.telegramBotSettings.device.unassigned}
                                {/if}
                            {/snippet}
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        telegramDevice = e.value ? currentDevice : "";
                                        config.telegram.device = telegramDevice;
                                        await updated();
                                    }}
                                    settingKey="telegramDevice"
                                    settingValue={telegramDevice === currentDevice}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>

                    <!-- 标签页 2 - 收集箱 -->
                    <div
                        class:fn__none={telegramTabs[1].key !== focusTab}
                        data-type={telegramTabs[1].name}
                    >
                        <!-- 绑定会话: 不能放进 Item 的 label 中, 否则点击空白处会切换第一个开关 -->
                        <div class="b3-label">
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                            {@html telegramBindingsTitle}
                            {#each telegramBindings as binding, index (binding)}
                                <div class="fn__hr"></div>
                                <div class="binding">
                                    <div class="binding__fields">
                                        <label class="binding__field">
                                            <span>{i18n.settings.telegramBotSettings.inboxBindings.chat}</span>
                                            <Input
                                                block={true}
                                                onChanged={async (e) => {
                                                    binding.chat = e.value.trim();
                                                    await saveTelegramBindings();
                                                }}
                                                placeholder={i18n.settings.telegramBotSettings.inboxBindings.chatPlaceholder}
                                                settingKey="chat"
                                                settingValue={binding.chat}
                                                type={ItemType.text}
                                            />
                                        </label>
                                        <label class="binding__field">
                                            <span>{i18n.settings.telegramBotSettings.inboxBindings.doc}</span>
                                            <Input
                                                block={true}
                                                onChanged={async (e) => {
                                                    binding.doc = e.value.trim();
                                                    await saveTelegramBindings();
                                                }}
                                                placeholder={i18n.settings.telegramBotSettings.inboxBindings.docPlaceholder}
                                                settingKey="doc"
                                                settingValue={binding.doc}
                                                type={ItemType.text}
                                            />
                                        </label>
                                    </div>
                                    <div class="fn__flex binding__switches">
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.telegramBotSettings.inboxBindings.enabled}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.enabled = e.value;
                                                    await saveTelegramBindings();
                                                }}
                                                settingKey="enabled"
                                                settingValue={binding.enabled}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.telegramBotSettings.inboxBindings.reply}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.reply = e.value;
                                                    await saveTelegramBindings();
                                                }}
                                                settingKey="reply"
                                                settingValue={binding.reply}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.telegramBotSettings.inboxBindings.notify}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.notify = e.value;
                                                    await saveTelegramBindings();
                                                }}
                                                settingKey="notify"
                                                settingValue={binding.notify}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <button
                                            class="b3-button b3-button--remove binding__remove"
                                            onclick={() => removeTelegramBinding(index)}
                                        >
                                            {i18n.settings.telegramBotSettings.inboxBindings.remove}
                                        </button>
                                    </div>
                                </div>
                            {/each}
                            <div class="fn__hr"></div>
                            <button
                                class="b3-button b3-button--outline"
                                onclick={addTelegramBinding}
                            >
                                {i18n.settings.telegramBotSettings.inboxBindings.add}
                            </button>
                        </div>

                        <!-- 下载资源文件 -->
                        <Item
                            text={i18n.settings.telegramBotSettings.inboxDownloadAssets.description}
                            title={i18n.settings.telegramBotSettings.inboxDownloadAssets.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.telegram.inbox.downloadAssets = e.value;
                                        await updated();
                                    }}
                                    settingKey="telegramDownloadAssets"
                                    settingValue={config.telegram.inbox.downloadAssets}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>
                {/snippet}
            </Tabs>
        </Panel>

        <!-- 飞书机器人设置面板: 机器人与收集箱两个页签 -->
        <Panel display={panels[4].key === focusPanel}>
            <Tabs
                focus={tabs_focus_key}
                tabs={feishuTabs}
            >
                {#snippet children(focusTab)}
                    <!-- 标签页 1 - 机器人 -->
                    <div
                        class:fn__none={feishuTabs[0].key !== focusTab}
                        data-type={feishuTabs[0].name}
                    >
                        <!-- 上线 -->
                        <Item
                            text={i18n.settings.feishuBotSettings.online.description}
                            title={i18n.settings.feishuBotSettings.online.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.feishu.online = e.value;
                                        await updated();
                                    }}
                                    settingKey="feishuOnline"
                                    settingValue={config.feishu.online}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 连接状态 -->
                        <div class="b3-label">
                            {i18n.settings.feishuBotSettings.connection.title}
                            <div class="b3-label__text">{i18n.settings.feishuBotSettings.connection.description}</div>
                            <div class="fn__hr"></div>
                            <FeishuConnection {plugin} />
                        </div>

                        <!-- App ID -->
                        <Item
                            block={true}
                            text={i18n.settings.feishuBotSettings.appId.description}
                            title={i18n.settings.feishuBotSettings.appId.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.feishu.appId = e.value.trim();
                                        await updated();
                                    }}
                                    placeholder={i18n.settings.feishuBotSettings.appId.placeholder}
                                    settingKey="feishuAppId"
                                    settingValue={config.feishu.appId}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- App Secret -->
                        <Item
                            block={true}
                            text={i18n.settings.feishuBotSettings.appSecret.description}
                            title={i18n.settings.feishuBotSettings.appSecret.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.feishu.appSecret = e.value.trim();
                                        await updated();
                                    }}
                                    settingKey="feishuAppSecret"
                                    settingValue={config.feishu.appSecret}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- 开放平台地址 -->
                        <Item
                            block={true}
                            text={i18n.settings.feishuBotSettings.apiBaseUrl.description}
                            title={i18n.settings.feishuBotSettings.apiBaseUrl.title}
                        >
                            {#snippet input()}
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        config.feishu.apiBaseUrl = e.value.trim();
                                        await updated();
                                    }}
                                    placeholder={DEFAULT_FEISHU_API_BASE_URL}
                                    settingKey="feishuApiBaseUrl"
                                    settingValue={config.feishu.apiBaseUrl}
                                    type={ItemType.text}
                                />
                            {/snippet}
                        </Item>

                        <!-- 事件日志 -->
                        <Item
                            text={i18n.settings.feishuBotSettings.eventLog.description}
                            title={i18n.settings.feishuBotSettings.eventLog.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.feishu.eventLog = e.value;
                                        await updated();
                                    }}
                                    settingKey="feishuEventLog"
                                    settingValue={config.feishu.eventLog}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>

                        <!-- 运行设备 -->
                        <Item title={i18n.settings.feishuBotSettings.device.title}>
                            {#snippet textSlot()}
                                {i18n.settings.feishuBotSettings.device.description}
                                <br />
                                {i18n.settings.feishuBotSettings.device.current} <code class="fn__code">{currentDevice}</code>
                                <br />
                                {#if feishuDevice}
                                    {i18n.settings.feishuBotSettings.device.assigned} <code class="fn__code">{feishuDevice}</code>
                                {:else}
                                    {i18n.settings.feishuBotSettings.device.unassigned}
                                {/if}
                            {/snippet}
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        feishuDevice = e.value ? currentDevice : "";
                                        config.feishu.device = feishuDevice;
                                        await updated();
                                    }}
                                    settingKey="feishuDevice"
                                    settingValue={feishuDevice === currentDevice}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>

                    <!-- 标签页 2 - 收集箱 -->
                    <div
                        class:fn__none={feishuTabs[1].key !== focusTab}
                        data-type={feishuTabs[1].name}
                    >
                        <!-- 绑定会话: 不能放进 Item 的 label 中, 否则点击空白处会切换第一个开关 -->
                        <div class="b3-label">
                            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                            {@html feishuBindingsTitle}
                            {#each feishuBindings as binding, index (binding)}
                                <div class="fn__hr"></div>
                                <div class="binding">
                                    <div class="binding__fields">
                                        <label class="binding__field">
                                            <span>{i18n.settings.feishuBotSettings.inboxBindings.chat}</span>
                                            <Input
                                                block={true}
                                                onChanged={async (e) => {
                                                    binding.chat = e.value.trim();
                                                    await saveFeishuBindings();
                                                }}
                                                placeholder={i18n.settings.feishuBotSettings.inboxBindings.chatPlaceholder}
                                                settingKey="chat"
                                                settingValue={binding.chat}
                                                type={ItemType.text}
                                            />
                                        </label>
                                        <label class="binding__field">
                                            <span>{i18n.settings.feishuBotSettings.inboxBindings.doc}</span>
                                            <Input
                                                block={true}
                                                onChanged={async (e) => {
                                                    binding.doc = e.value.trim();
                                                    await saveFeishuBindings();
                                                }}
                                                placeholder={i18n.settings.feishuBotSettings.inboxBindings.docPlaceholder}
                                                settingKey="doc"
                                                settingValue={binding.doc}
                                                type={ItemType.text}
                                            />
                                        </label>
                                    </div>
                                    <div class="fn__flex binding__switches">
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.feishuBotSettings.inboxBindings.enabled}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.enabled = e.value;
                                                    await saveFeishuBindings();
                                                }}
                                                settingKey="enabled"
                                                settingValue={binding.enabled}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.feishuBotSettings.inboxBindings.reply}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.reply = e.value;
                                                    await saveFeishuBindings();
                                                }}
                                                settingKey="reply"
                                                settingValue={binding.reply}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <label class="fn__flex">
                                            <span class="binding__switch">{i18n.settings.feishuBotSettings.inboxBindings.notify}</span>
                                            <span class="fn__space"></span>
                                            <Input
                                                onChanged={async (e) => {
                                                    binding.notify = e.value;
                                                    await saveFeishuBindings();
                                                }}
                                                settingKey="notify"
                                                settingValue={binding.notify}
                                                type={ItemType.checkbox}
                                            />
                                        </label>
                                        <button
                                            class="b3-button b3-button--remove binding__remove"
                                            onclick={() => removeFeishuBinding(index)}
                                        >
                                            {i18n.settings.feishuBotSettings.inboxBindings.remove}
                                        </button>
                                    </div>
                                </div>
                            {/each}
                            <div class="fn__hr"></div>
                            <button
                                class="b3-button b3-button--outline"
                                onclick={addFeishuBinding}
                            >
                                {i18n.settings.feishuBotSettings.inboxBindings.add}
                            </button>
                        </div>

                        <!-- 下载资源文件 -->
                        <Item
                            text={i18n.settings.feishuBotSettings.inboxDownloadAssets.description}
                            title={i18n.settings.feishuBotSettings.inboxDownloadAssets.title}
                        >
                            {#snippet input()}
                                <Input
                                    onChanged={async (e) => {
                                        config.feishu.inbox.downloadAssets = e.value;
                                        await updated();
                                    }}
                                    settingKey="feishuDownloadAssets"
                                    settingValue={config.feishu.inbox.downloadAssets}
                                    type={ItemType.checkbox}
                                />
                            {/snippet}
                        </Item>
                    </div>
                {/snippet}
            </Tabs>
        </Panel>
    {/snippet}
</Panels>

<style lang="less">
    .binding {
        border: 1px solid var(--b3-border-color);
        border-radius: var(--b3-border-radius);
        padding: 8px 12px;

        // 两行输入框共用一列字段名, 字段名的长度随语言变化时也能对齐
        &__fields {
            display: grid;
            gap: 8px;
            grid-template-columns: max-content 1fr;
        }

        &__field {
            align-items: center;
            display: grid;
            grid-column: 1 / -1;
            grid-template-columns: subgrid;
        }

        // 开关较多、设置面板较窄时整个开关换行, 而不是挤压开关的文字
        &__switches {
            align-items: center;
            flex-wrap: wrap;
            gap: 8px 16px;
            margin-top: 8px;
        }

        &__switch {
            align-self: center;
        }

        // 换行后也靠右
        &__remove {
            margin-left: auto;
        }
    }
</style>
