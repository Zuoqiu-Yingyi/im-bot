<div align="center">
<img alt="图标" src="https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-im-bot/public/icon.png" style="width: 8em; height: 8em;">

---

[![GitHub 最新发行版本 (最新一次发行/预发行)](https://img.shields.io/github/v/release/Zuoqiu-Yingyi/siyuan-plugin-im-bot?include_prereleases&style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/releases/latest)
[![GitHub 最新发行时间](https://img.shields.io/github/release-date/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/releases/latest)
[![GitHub 许可证](https://img.shields.io/github/license/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/blob/main/LICENSE)
[![GitHub 最后一次提交时间](https://img.shields.io/github/last-commit/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commits/main)
![GitHub 仓库大小](https://img.shields.io/github/repo-size/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)
![GitHub 代码大小](https://img.shields.io/github/languages/code-size/Zuoqiu-Yingyi/siyuan-plugin-im-bot.svg?style=flat-square)
![查看次数](https://hits.b3log.org/Zuoqiu-Yingyi/siyuan-plugin-im-bot.svg)

<!-- ![jsDelivr 查看次數 (GitHub)](https://img.shields.io/jsdelivr/gh/hy/Zuoqiu-Yingyi/siyuan-packages-im-bot?style=flat-square) -->

[![GitHub 发行版本下载次数](https://img.shields.io/github/downloads/Zuoqiu-Yingyi/siyuan-plugin-im-bot/total?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/releases)

---

简体中文 \| [English](./README.md)

---

</div>

# 思源 IM 机器人

一款把 QQ 机器人接入[思源笔记](https://github.com/siyuan-note/siyuan)的插件：把 QQ 群里的消息记录到思源的收集箱文档中，并提供查询 OpenID 的指令、向已知的群与用户发送消息的页签与 QQ 机器人接口调试工具。

插件的主要功能运行在思源内核中，思源运行时即可工作，不需要打开思源的界面。需要思源 3.7.3 或更高版本。

## 快速开始

1. 在 [QQ 开放平台](https://q.qq.com/)创建机器人，在机器人的开发设置中获取 AppID 与 AppSecret，并在「事件订阅与回调地址」中选择 WebSocket 方式。
2. 把机器人添加到要记录的 QQ 群，由群主为机器人打开「获取群内全部消息」。
3. 在本插件的设置中填写 `QQ 机器人 > AppID` 与 `QQ 机器人 > AppSecret`。
4. 群主在群里 @ 机器人发送 `/openid`，机器人会回复该群的 group_openid。
5. 在 `收集箱 > 绑定群聊` 中点击「添加绑定」，填写 group_openid 与用来收集消息的文档的 ID。

之后该群的消息都会记录到这篇文档下按日期组织的子文档中。

## 常见问题

- 收集箱里没有新消息？

  - 群主需要为机器人打开「获取群内全部消息」。否则机器人只能收到 @ 它的消息，而这些消息都视为指令，不会写入收集箱。
  - 检查绑定是否开启了「启用」，group_openid 与文档 ID 是否正确，`QQ 机器人 > 订阅事件` 中是否开启了「群聊与单聊」。
  - 开启了 `QQ 机器人 > 只在此设备上运行` 时，只有指定的设备会写入收集箱。
- 机器人没有连接或没有响应？

  - 查看工作空间内核日志 `temp/siyuan.log` 中含有 `[plugin:im-bot]` 的记录。
  - AppID 或 AppSecret 错误，或者订阅了没有权限的事件类别时，插件会停止重连，修改 AppID、AppSecret 或订阅事件，或者重新启用插件后才会再次连接。
  - 如果在 QQ 开放平台为机器人设置了 IP 白名单，需要把运行思源的设备的公网 IP 加入白名单。
- 开启了「回复块链接」，但没有收到回复？

  - 被动回复只能在收到消息后 5 分钟内发送，每条消息最多回复 5 次。
  - QQ 要求机器人消息中的链接域名先在开放平台报备（消息 URL 白名单，域名需要 ICP 备案），`siyuan://` 链接可能因此被拒绝（错误码 40054010）。插件还没有在真实的 QQ 群中验证过这一点，失败的原因可以在内核日志中查看。
- 多台设备都安装了本插件？

  - 插件的设置会随数据同步。没有指定运行设备时，每台设备都会各自连接机器人并写入收集箱，可能产生重复的消息或同步冲突。建议在一台常开的设备上开启 `QQ 机器人 > 只在此设备上运行`。
- AppSecret 安全吗？

  - AppSecret 以明文保存在工作空间的 `data/storage/petal/im-bot/config.json` 中，会随数据同步。能调用本工作空间内核接口的程序（包括其他插件）都能读取这个文件。
  - 插件提供的内核接口（RPC 方法 `call-qq-api` 以机器人的身份调用 QQ 机器人接口，`get-users` 返回已知的群与单聊用户），上述程序也都可以使用它们；它们不会返回 AppSecret 与接口调用凭证。

## 介绍

### 功能介绍

- 连接 QQ 机器人

  - 插件在思源内核中通过 WebSocket 连接 QQ 机器人，断线后自动重连，重连间隔从 1 秒逐步增加到 60 秒。
  - 收到的事件都会记录到内核日志中，开启 `QQ 机器人 > 事件日志` 时还会保存为文件。
- 已知的群与单聊用户

  - QQ 没有列出机器人所在的群与单聊用户的接口，插件根据收到的事件把它们记录在工作空间的 `data/storage/petal/im-bot/users.json` 中（与 `config.json` 在同一目录，会随数据同步），可以从中查找 group_openid 与 user_openid。这些事件属于 `QQ 机器人 > 订阅事件` 中的「群聊与单聊」。
  - 只有在事件中出现过的群与用户才会被记录：插件开始运行之前机器人就在的群，要等该群有了新消息才会出现。
  - 记录按机器人的 AppID 分开（OpenID 只对同一个机器人有效），其中群以 group_openid 为键，单聊用户以 user_openid 为键。时间取自事件，都是 UTC 时间。
  - 群的记录

    - `status`：`added` 表示机器人在群中，`removed` 表示机器人已被移出群
    - `firstSeen`：记录到的最早一个事件的时间
    - `added`、`removed`：最近一次机器人被添加到群、被移出群的时间，以及操作人的 member_openid
    - `proactive`：最近一次群管理员开启或关闭机器人主动消息的结果 `allowed`、时间与操作人
    - `lastMessage`：最近一条群消息的时间
    - `owner`：最近一条由群主发送的消息中，群主的 member_openid 与昵称
  - 单聊用户的记录

    - `status`：`added` 表示用户已添加机器人，`removed` 表示用户已删除机器人
    - `firstSeen`：记录到的最早一个事件的时间
    - `unionOpenid`：用户的 union_openid
    - `added`、`removed`：最近一次用户添加、删除机器人的时间；`added` 中还有添加的场景值 `scene` 与分享链接中的回调数据 `sceneParam`
    - `proactive`：最近一次用户开启或关闭机器人主动消息的结果 `allowed` 与时间
    - `lastMessage`：最近一条单聊消息的时间与用户的昵称（QQ 可能不提供昵称）
  - `status` 取机器人被添加、被移出与最近一条消息中最晚的一项，所以机器人在插件离线期间被重新拉进群时，该群有新消息后就会恢复为 `added`。
  - 收到事件 5 秒后写入这段时间内的全部变化，插件停止时立即写入。每次写入前都会重新读取该文件并合并，所以手动添加的字段（如备注）会保留，手动删除的群或用户要等再次出现在事件中才会重新记录。
  - 该文件不是有效的 JSON 对象时，插件不会覆盖它，只在内核日志中警告；修复或删除该文件后，下一个相关事件会把期间的变化一起写入。插件在此之前停止时，这些变化会丢失。
- 收集箱

  - 群里的每条消息转换为一个超级块，先插入收集箱文档下的 `.temp` 文档，需要时下载其中的资源文件，再移动到收集箱文档下 `YYYY/MM/YYYY-MM-DD` 文档的末尾。日期为消息的发送日期（按思源内核所在设备的时区），缺少的文档会自动创建。
  - 收集箱文档可以移动或重命名。
  - @ 机器人的消息视为指令，不会写入收集箱；@ 全体成员的消息除外，即使它同时 @ 了机器人。
  - 同一条消息被重复推送时只写入一次。
  - 消息的转换方式

    - 文本：一条消息为一个段落，按原样显示（Markdown 语法不会生效），保留换行；@ 成员显示为 <kbd>@昵称</kbd>，QQ 表情显示为 `[表情名称]`，网址转换为链接。
    - 图片：显示在该消息文本的前面（QQ 不提供图片在文本中的位置）。
    - 语音：转换为音频块，后面附上 QQ 的语音识别文本。
    - 视频：转换为视频块。
    - 文件：转换为以文件名命名的链接。
    - 引用消息：被引用的消息已在收集箱中时，转换为指向它的块引用；否则用引述块显示被引用的内容。
    - 聊天记录（合并转发）：其中的每条消息转换为一个超级块，嵌套的聊天记录也会展开。
    - 卡片等其他消息：以文本显示。
  - 消息块带有以下自定义属性，可以用于查询

    - `custom-author-username`：发送者的昵称，显示在消息块的左上角
    - `custom-author-id`：发送者的 OpenID
    - `custom-msg-idx`：消息在 QQ 中的索引
    - `custom-event-id`：推送该消息的事件的 ID
  - 思源在下载资源文件时退出，会有消息留在 `.temp` 中。插件重新启动后，该收集箱收到第一条消息时，会把这些消息移到对应的日期文档（日期取它们插入 `.temp` 的时间）。
- 上线与下线通知

  - 在绑定中开启「上下线通知」后，插件开始运行时会向该群发送「收集箱已上线」通知，停止时（被禁用、卸载、更新后重新加载，或者正常退出思源）发送「收集箱已下线」通知。通知中带有设备名称。该开关默认关闭。
  - 只由运行机器人的设备发送。退出思源时最多等待下线通知 5 秒；强制退出、崩溃或被系统终止时不会发送下线通知。
  - 通知是 QQ 的主动消息，受 QQ 的频率限制（每个群每分钟 20 条、每天 1000 条），机器人没有发送主动消息的权限时会发送失败，失败的原因可以在内核日志中查看。
- 指令

  - `/openid`：查询 OpenID

    - 单聊中向机器人发送 `/openid`，机器人会回复你的 user_openid。
    - 群里 @ 机器人发送 `/openid`，机器人会回复你在该群的 member_openid 与该群的 group_openid。
  - 群里只响应群主发送的指令，其他成员发送的指令会被忽略。
  - 群里 @ 机器人的消息都视为指令，不是已知指令的内容（例如「@机器人 你好」）会被忽略，也不会写入收集箱；没有 @ 机器人的消息都不会视为指令。
- 指令面板

  - 插件开始运行时，会在 QQ 开放平台创建或更新单聊与群聊的指令面板（在 QQ 的输入框中输入 `/` 时显示），默认列出 `openid` 指令，其中群聊的指令仅管理员可以使用。
  - 指令面板的配置不在设置面板中。高级用户可以编辑 `data/storage/petal/im-bot/config.json` 中的 `qq.panels`，格式见 QQ 文档[创建指令面板](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels.post.html)，其中 `panel.remark` 不能为空，插件用它找到对应的面板。
- 发送消息

  - 在命令面板中运行「打开 QQ 机器人发送消息」（仅桌面端），会打开一个页签，用来以机器人的身份向已知的群与单聊用户发送主动消息。
  - 发送对象从 `users.json` 中选择（见「已知的群与单聊用户」）。机器人仍在群中（或仍被用户添加）的排在前面，其中最近有活动的排在前面；已将机器人移出的群与已删除机器人的用户会注明。点击「刷新」重新读取，其中包括还没写入 `users.json` 的变化。
  - 选择发送对象后，页签中显示它的状态、主动消息的开关、群主或 union_openid，以及最近消息与首次记录的时间。
  - 群可以点击「查询群信息」查询群名称、群简介、群分类、群标签与群成员数，查询到的群名称也会显示在发送对象中。该接口仅对白名单机器人开放，否则会提示需要向 QQ 开放平台申请权限。
  - 消息类型可以选择文本或 Markdown。向单聊用户发送时可以开启「互动召回」，以互动召回消息（`is_wakeup`）发送。
  - 点击「发送」或按 Ctrl+Enter（macOS 上为 ⌘+Enter）发送，下方显示响应的状态码、耗时、响应头与响应体。发送成功后清空消息内容，失败时保留，失败的原因见响应体中的错误码。
  - 主动消息受 QQ 的限制：向群发送需要群主为机器人开启「机器人主动在群聊内发言」，向用户发送需要用户在机器人资料卡中开启主动消息；每个群或用户每分钟最多收到 20 条、每天最多 1000 条。互动召回消息只能在用户与机器人对话后的 30 天内发送，当天、1–3 天、3–7 天、7–30 天各 1 条。
  - 消息会真实地发送给群或用户。该功能在所有设备上都可以使用，不受「只在此设备上运行」的限制。
- QQ 机器人接口调试

  - 在命令面板中运行「打开 QQ 机器人接口调试」（仅桌面端），会打开一个页签，用来以机器人的身份调用 [QQ 机器人服务端接口](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/api-call-guide.html)。
  - 选择请求方法，填写以 `/` 开头的请求路径（相对于 `https://api.bot.qq.com`，例如 `/gateway/bot`）与 JSON 格式的请求体，点击「发送」或在请求路径中按回车，即可查看响应的状态码、耗时、响应头与响应体。
  - 请求会以机器人的身份发出，调用发送消息等接口会产生实际效果。该功能在所有设备上都可以使用，不受「只在此设备上运行」的限制。

### 设置项介绍

- `常规设置`

  - `重置设置选项`

    - 把所有设置选项恢复为默认值，确认后会刷新界面
- `QQ 机器人`

  - `AppID QQ_BOT_APPID`

    - QQ 开放平台中机器人的 AppID，在机器人的开发设置中获取
  - `AppSecret QQ_BOT_SECRET`

    - QQ 开放平台中机器人的 AppSecret，用于获取接口调用凭证
    - 以明文保存在工作空间的 `data/storage/petal/im-bot/config.json` 中，会随数据同步
  - `订阅事件 QQ_BOT_INTENTS`

    - 机器人要接收的事件类别，每个开关对应一个类别，各类别包含的事件见 QQ 文档[事件订阅与通知](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html)
    - 默认开启「群聊与单聊」与「频道 @ 机器人消息」；收集箱与指令只需要「群聊与单聊」
    - 按 QQ 文档，频道、频道成员与频道 @ 机器人消息以外的类别可能需要先在 QQ 开放平台申请权限。订阅了没有权限的类别时，QQ 会关闭连接（错误码 4014），插件随后停止重连
    - 修改后自动重新连接；全部关闭时不连接机器人
  - `事件日志`

    - 开启后，把收到的每个事件保存为工作空间中的一个 JSON 文件 `data/storage/petal/im-bot/logs/events/<事件类型>/<事件 ID>.json`，其中的 group_openid 等信息可用于配置绑定
    - 没有事件 ID 的事件（`READY`、`RESUMED`）不会保存
    - 这些文件会随数据同步，插件不会自动删除它们；不需要排查问题时可以关闭
    - 默认开启，修改后对之后收到的事件生效
  - `只在此设备上运行`

    - 开启后只有本设备连接机器人：写入事件日志、收集箱与 `users.json`、响应指令、发送上线与下线通知、同步指令面板。设置同步到其他设备后，那些设备会断开连接
    - 关闭时，每台安装了本插件的设备都会连接机器人
    - 开关下方显示本设备的 ID 与当前指定的运行设备
- `收集箱`

  - `绑定群聊`

    - 每条绑定把一个群的消息写入一篇收集箱文档；一个群可以绑定多篇文档，一篇文档也可以绑定多个群
    - 点击「添加绑定」新增一条绑定，点击「删除」删除该绑定，修改会立即保存
    - `群聊 Open ID`：群的 OpenID（group_openid）。群主在群里 @ 机器人发送 `/openid` 可以查询，也可以在 `users.json` 或事件日志中找到
    - `收集箱文档 ID`：用来收集消息的文档的 ID。在文档树中右键该文档，选择「复制 > 复制 ID」即可获得
    - `启用`：关闭后该绑定不再写入消息，也不再发送上线与下线通知。群或文档 ID 为空的绑定同样不生效
    - `回复块链接`：开启后，机器人会引用每条写入该文档的消息进行回复，内容为该消息超级块的块超链接 `siyuan://blocks/<块 ID>`。同一条消息写入多篇开启了回复的文档时，每篇文档各回复一次。默认关闭，限制见「常见问题」
    - `上下线通知`：开启后，插件开始运行与停止时向该群发送上线与下线通知，见「上线与下线通知」。一个群的多条绑定都开启了通知时，每次只发送一条。默认关闭
  - `下载资源文件`

    - 消息带有图片、语音、视频或文件时，用思源的「转换网络资源文件为本地」功能把它们下载到工作空间；该消息中指向文件的其他链接也会被下载，指向网页的链接保持不变
    - 默认开启。关闭后消息中保留 QQ 的网络链接，QQ 没有说明这些链接的有效期，它们以后可能会失效

## 更改日志

[CHANGELOG.md](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/blob/main/CHANGELOG.md)
