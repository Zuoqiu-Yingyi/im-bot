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

    import { INTENTS } from "@/qq/constants";

    import type { ITab } from "@workspace/components/siyuan/setting/tab";

    import type Plugin from "@/index";
    import type { TIntent } from "@/qq/constants";
    import type { IConfig } from "@/types/config";

    interface IProps {
        config: IConfig; // 传入的配置项
        plugin: InstanceType<typeof Plugin>; // 插件实例
    }

    const {
        config,
        plugin,
    }: IProps = $props();

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
            icon: "#iconUsers",
        },
    ] as const satisfies ITab[];

    const intents = Object.keys(INTENTS) as TIntent[];
    const intentsTitle = `${i18n.settings.qqBotSettings.intents.title}<div class="b3-label__text">${i18n.settings.qqBotSettings.intents.description}</div>`;
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

        <!-- QQ 机器人设置面板 -->
        <Panel display={panels[1].key === focusPanel}>
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
        </Panel>
    {/snippet}
</Panels>

<style lang="less">
</style>
