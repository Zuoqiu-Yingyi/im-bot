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

    import { DEFAULT_INBOX_BINDING } from "@/configs/default";
    import { INTENTS } from "@/qq/constants";

    import WeixinAccount from "./WeixinAccount.svelte";

    import type { ITab } from "@workspace/components/siyuan/setting/tab";

    import type Plugin from "@/index";
    import type { TIntent } from "@/qq/constants";
    import type { IConfig, IQQInboxBinding } from "@/types/config";

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
        inbox: "inbox", // 收集箱设置
        qq: "qq", // QQ 机器人设置
        weixin: "weixin", // 微信机器人设置
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
            key: PanelKey.inbox,
            text: i18n.settings.inboxSettings.title,
            name: i18n.settings.inboxSettings.title,
            icon: "#iconInbox",
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
    ] as const satisfies ITab[];

    const intents = Object.keys(INTENTS) as TIntent[];
    const intentsTitle = `${i18n.settings.qqBotSettings.intents.title}<div class="b3-label__text">${i18n.settings.qqBotSettings.intents.description}</div>`;

    const currentDevice = window.siyuan.config!.system.id; // 本机设备 ID
    // svelte-ignore state_referenced_locally
    let device = $state(config.qq.device); // 运行 QQ 机器人的设备 ID

    const bindingsTitle = `${i18n.settings.inboxSettings.bindings.title}<div class="b3-label__text">${i18n.settings.inboxSettings.bindings.description}</div>`;

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

        <!-- 收集箱设置面板 -->
        <Panel display={panels[1].key === focusPanel}>
            <!-- 绑定群聊: 不能放进 Item 的 label 中, 否则点击空白处会切换第一个开关 -->
            <div class="b3-label">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html bindingsTitle}
                {#each bindings as binding, index (binding)}
                    <div class="fn__hr"></div>
                    <div class="binding">
                        <div class="binding__fields">
                            <label class="binding__field">
                                <span>{i18n.settings.inboxSettings.bindings.group}</span>
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        binding.group = e.value.trim();
                                        await saveBindings();
                                    }}
                                    placeholder={i18n.settings.inboxSettings.bindings.groupPlaceholder}
                                    settingKey="group"
                                    settingValue={binding.group}
                                    type={ItemType.text}
                                />
                            </label>
                            <label class="binding__field">
                                <span>{i18n.settings.inboxSettings.bindings.doc}</span>
                                <Input
                                    block={true}
                                    onChanged={async (e) => {
                                        binding.doc = e.value.trim();
                                        await saveBindings();
                                    }}
                                    placeholder={i18n.settings.inboxSettings.bindings.docPlaceholder}
                                    settingKey="doc"
                                    settingValue={binding.doc}
                                    type={ItemType.text}
                                />
                            </label>
                        </div>
                        <div class="fn__flex binding__switches">
                            <label class="fn__flex">
                                <span class="binding__switch">{i18n.settings.inboxSettings.bindings.enabled}</span>
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
                                <span class="binding__switch">{i18n.settings.inboxSettings.bindings.reply}</span>
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
                                <span class="binding__switch">{i18n.settings.inboxSettings.bindings.notify}</span>
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
                                {i18n.settings.inboxSettings.bindings.remove}
                            </button>
                        </div>
                    </div>
                {/each}
                <div class="fn__hr"></div>
                <button
                    class="b3-button b3-button--outline"
                    onclick={addBinding}
                >
                    {i18n.settings.inboxSettings.bindings.add}
                </button>
            </div>

            <!-- 下载资源文件 -->
            <Item
                text={i18n.settings.inboxSettings.downloadAssets.description}
                title={i18n.settings.inboxSettings.downloadAssets.title}
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
        </Panel>

        <!-- QQ 机器人设置面板 -->
        <Panel display={panels[2].key === focusPanel}>
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
        </Panel>

        <!-- 微信机器人设置面板 -->
        <Panel display={panels[3].key === focusPanel}>
            <!-- 微信账号: 含多个控件, 不能放进 Item 的 label 中 -->
            <div class="b3-label">
                {i18n.settings.weixinBotSettings.account.title}
                <div class="b3-label__text">{i18n.settings.weixinBotSettings.account.description}</div>
                <div class="fn__hr"></div>
                <WeixinAccount {plugin} />
            </div>

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
