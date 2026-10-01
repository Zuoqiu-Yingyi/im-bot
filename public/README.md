<div align="center">
<img alt="icon" src="https://cdn.jsdelivr.net/gh/Zuoqiu-Yingyi/siyuan-plugin-im-bot/public/icon.png" style="width: 8em; height: 8em;">

---

[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/Zuoqiu-Yingyi/siyuan-plugin-im-bot?include_prereleases&style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/releases/latest)
[![GitHub Release Date](https://img.shields.io/github/release-date/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/releases/latest)
[![GitHub License](https://img.shields.io/github/license/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commits/main)
![GitHub repo size](https://img.shields.io/github/repo-size/Zuoqiu-Yingyi/siyuan-plugin-im-bot?style=flat-square)
![GitHub code size](https://img.shields.io/github/languages/code-size/Zuoqiu-Yingyi/siyuan-plugin-im-bot.svg?style=flat-square)
![hits](https://hits.b3log.org/Zuoqiu-Yingyi/siyuan-plugin-im-bot.svg)

<!-- ![jsDelivr hits (GitHub)](https://img.shields.io/jsdelivr/gh/hy/Zuoqiu-Yingyi/siyuan-packages-im-bot?style=flat-square) -->

[![GitHub all releases](https://img.shields.io/github/downloads/Zuoqiu-Yingyi/siyuan-plugin-im-bot/total?style=flat-square)](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/releases)

---

[简体中文](./README.zh-CN.md) \| English

---

</div>

# SiYuan IM Bot

A plugin for [SiYuan Note](https://github.com/siyuan-note/siyuan) that connects a QQ bot to SiYuan: it records the messages of QQ groups in inbox documents, and provides a command to look up OpenIDs, a tab that sends messages to the known groups and users, and a debugger for the QQ bot API.

The main features run in the SiYuan kernel, so they work while SiYuan is running, without its interface open. Requires SiYuan 3.7.3 or later.

## QUICK START

1. Create a bot on the [QQ Open Platform](https://q.qq.com/), get its AppID and AppSecret from the development settings of the bot, and choose WebSocket in 「事件订阅与回调地址」 (event subscription and callback).
2. Add the bot to the QQ group to record, and have the group owner turn on 「获取群内全部消息」 (receive all group messages) for the bot.
3. Fill in `QQ Bot > AppID` and `QQ Bot > AppSecret` in the settings of this plugin.
4. As the group owner, send `/openid` to the bot with an @ mention in the group. The bot replies with the group_openid of the group.
5. In `Inbox > Bound groups`, click "Add a binding" and fill in the group_openid and the ID of the document that collects the messages.

From then on, the messages of the group are recorded in dated sub-documents of that document.

## Q & A

- No new messages in the inbox?

  - The group owner needs to turn on 「获取群内全部消息」 for the bot. Otherwise the bot only receives the messages that @ it, and these are all commands, which are not written to the inbox.
  - Check that the binding is enabled, that the group_openid and the document ID are right, and that "Group and C2C chats" is on in `QQ Bot > Subscribed events`.
  - With `QQ Bot > Run on this device only` on, only the chosen device writes the inbox.
- The bot does not connect or respond?

  - Look for lines with `[plugin:im-bot]` in the kernel log `temp/siyuan.log` of the workspace.
  - When the AppID or the AppSecret is wrong, or a subscribed event category is not permitted, the plugin stops reconnecting until the AppID, the AppSecret or the subscribed events change, or the plugin is enabled again.
  - If the bot has an IP allowlist on the QQ Open Platform, add the public IP of the device running SiYuan to it.
- "Reply with the block link" is on, but no reply arrives?

  - A passive reply can only be sent within 5 minutes after the message, at most 5 times per message.
  - QQ requires the link domains in bot messages to be registered on the open platform first (the message URL allowlist, for domains with an ICP filing), so QQ may reject `siyuan://` links (error code 40054010). This has not been tried in a real QQ group yet; the kernel log shows why a reply failed.
- The plugin is installed on several devices?

  - The plugin settings sync with your data. Without a chosen device, every device connects to the bot and writes the inbox on its own, which may create duplicate messages or sync conflicts. Turn on `QQ Bot > Run on this device only` on a device that is always on.
- Is the AppSecret safe?

  - The AppSecret is stored in plain text in `data/storage/petal/im-bot/config.json` of the workspace and syncs with your data. Any program that can call the kernel API of this workspace, including other plugins, can read this file.
  - The kernel methods this plugin provides (the RPC method `call-qq-api`, which calls the QQ bot API as the bot, and `get-users`, which returns the known groups and C2C users) can be used by the same programs too; they never return the AppSecret or the access token.

## INTRODUCTION

### Features Introduction

- Connection to the QQ bot

  - The plugin connects to the QQ bot over WebSocket from the SiYuan kernel and reconnects after a disconnect, waiting from 1 second up to 60 seconds between attempts.
  - Every received event is written to the kernel log, and also saved as a file with `QQ Bot > Event log` on.
- Known groups and C2C users

  - QQ has no API that lists the groups the bot is in or the users who chat with it, so the plugin records them from the received events in `data/storage/petal/im-bot/users.json` of the workspace (next to `config.json`, synced with your data), where you can look up group_openids and user_openids. These events belong to "Group and C2C chats" in `QQ Bot > Subscribed events`.
  - Only groups and users that appear in events are recorded: a group the bot was in before the plugin started running shows up once it gets a new message.
  - The records are kept per AppID of the bot (an OpenID is only valid for the same bot), with groups keyed by group_openid and C2C users by user_openid. Times come from the events and are in UTC.
  - Group records

    - `status`: `added` when the bot is in the group, `removed` after the bot was removed from it
    - `firstSeen`: the time of the earliest recorded event
    - `added`, `removed`: when the bot was last added to or removed from the group, and the member_openid of the member who did it
    - `proactive`: whether a group admin last allowed or refused active messages from the bot (`allowed`), when and by whom
    - `lastMessage`: the time of the latest group message
    - `owner`: the member_openid and nickname of the group owner, from the latest message the owner sent
  - C2C user records

    - `status`: `added` when the user has added the bot, `removed` after the user deleted it
    - `firstSeen`: the time of the earliest recorded event
    - `unionOpenid`: the union_openid of the user
    - `added`, `removed`: when the user last added or deleted the bot; `added` also has the scene value `scene` and the callback data of the share link `sceneParam`
    - `proactive`: whether the user last allowed or refused active messages from the bot (`allowed`), and when
    - `lastMessage`: the time of the latest C2C message and the nickname of the user (QQ may leave it out)
  - `status` follows the latest of the bot being added, the bot being removed and the latest message, so a group that adds the bot back while the plugin is offline turns back to `added` with its next message.
  - The changes are written 5 seconds after an event, together with the others in that time, and at once when the plugin stops. Each write reads the file again and merges into it, so fields you add by hand (such as a remark) are kept, and a group or user you delete by hand comes back only when it appears in an event again.
  - When the file is not a valid JSON object, the plugin does not overwrite it and only logs a warning in the kernel log. After you fix or delete the file, the next related event writes the changes made in the meantime; they are lost if the plugin stops before that.
- Inbox

  - Each message of a group becomes a super block. It is first inserted into the `.temp` document under the inbox document, its assets are downloaded when needed, and then it is moved to the end of the `YYYY/MM/YYYY-MM-DD` document under the inbox document. The date is the day the message was sent, in the time zone of the device running the SiYuan kernel. Missing documents are created automatically.
  - The inbox document may be moved or renamed.
  - Messages that @ the bot are commands and are not written to the inbox, except messages that @ everyone, even when they also @ the bot.
  - A message pushed more than once is written once.
  - How messages are converted

    - Text: one paragraph per message, shown as sent (Markdown syntax has no effect), with line breaks kept. Mentions show as <kbd>@nickname</kbd>, QQ faces as `[face name]`, and URLs become links.
    - Images: shown before the text of the message (QQ does not tell where images sit in the text).
    - Voice: an audio block, followed by the speech recognition text from QQ.
    - Video: a video block.
    - Files: a link named after the file.
    - Quotes: a block reference to the quoted message when it is in the inbox; otherwise a blockquote with the quoted content.
    - Chat records (forwarded messages): a super block per message, including nested chat records.
    - Cards and other messages: shown as text.
  - Message blocks carry these custom attributes, which can be used in queries

    - `custom-author-username`: the nickname of the sender, shown above the message block
    - `custom-author-id`: the OpenID of the sender
    - `custom-msg-idx`: the index of the message in QQ
    - `custom-event-id`: the ID of the event that pushed the message
  - When SiYuan quits while downloading assets, messages are left in `.temp`. After the plugin starts again, when the inbox gets its first message, the plugin moves them to the date documents of the time they were inserted into `.temp`.
- Online and offline notices

  - When "Online and offline notices" is on in a binding, the group gets an "Inbox online" notice when the plugin starts running, and an "Inbox offline" notice when the plugin stops (disabled, uninstalled, reloaded after an update, or SiYuan exits normally). The notices name the device. The switch is off by default.
  - Only the device that runs the bot sends them. When SiYuan exits, it waits at most 5 seconds for the offline notice; a forced exit, a crash or a kill sends no offline notice.
  - The notices are active QQ messages and count against the QQ limits (20 per minute and 1000 per day for each group). They fail when the bot has no permission to send active messages; the kernel log shows why a notice failed.
- Commands

  - `/openid`: look up OpenIDs

    - Send `/openid` to the bot in a C2C chat, and the bot replies with your user_openid.
    - Send `/openid` to the bot with an @ mention in a group, and the bot replies with your member_openid in the group and the group_openid of the group.
  - In groups, the bot only answers the commands of the group owner and ignores the commands of other members.
  - In groups, every message that @ the bot is a command. Anything that is not a known command (such as "@bot hello") is ignored and not written to the inbox. Messages that do not @ the bot are never commands.
- Command panels

  - When the plugin starts running, it creates or updates the command panels of C2C and group chats on the QQ Open Platform (shown when you type `/` in the QQ input box). By default they list the `openid` command, and in groups only admins can use it.
  - The panels are not in the settings panel. Advanced users can edit `qq.panels` in `data/storage/petal/im-bot/config.json`, in the format of the QQ documentation [creating a panel](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels.post.html). `panel.remark` must not be empty, because the plugin finds the panel by it.
- Messenger

  - Run "Open the QQ bot messenger" in the Command Palette (desktop only) to open a tab that sends active messages as the bot to the known groups and C2C users.
  - Choose the recipient from `users.json` (see "Known groups and C2C users"). Groups the bot is still in and users who still have the bot come first, the most recently active first; groups that removed the bot and users who deleted it are marked. Click "Refresh" to read the list again, including the changes not written to `users.json` yet.
  - The tab shows the status of the chosen recipient, its active message setting, the group owner or the union_openid, and the times of the latest message and the first record.
  - For a group, click "Query the group info" to get its name, description, category, tags and number of members; the name then also shows in the recipient list. This API is only open to allowlisted bots; otherwise the tab says that you need to apply for it on the QQ Open Platform.
  - Choose text or Markdown as the message type. For a C2C user, turn on "Wake-up message" to send it as a wake-up message (`is_wakeup`).
  - Click "Send" or press Ctrl+Enter (⌘+Enter on macOS) to send the message and see the status code, the time, the response headers and the response body. The message is cleared after it is sent and kept when sending fails; the error code in the response body tells why.
  - QQ limits active messages: a group needs the group owner to turn on 「机器人主动在群聊内发言」 (the bot may speak in the group) for the bot, and a user needs to turn on active messages on the profile card of the bot. Each group or user receives at most 20 per minute and 1000 per day. Wake-up messages can only be sent within 30 days after the user chats with the bot, one each on the same day, in days 1–3, 3–7 and 7–30.
  - Messages are really sent to the groups and users. The messenger works on every device, regardless of "Run on this device only".
- QQ bot API debugger

  - Run "Open the QQ bot API debugger" in the Command Palette (desktop only) to open a tab that calls the [QQ bot server API](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/api-call-guide.html) as the bot.
  - Pick the request method, enter a request path starting with `/` (relative to `https://api.bot.qq.com`, for example `/gateway/bot`) and a JSON request body, then click "Send" or press Enter in the path field to see the status code, the time, the response headers and the response body.
  - Requests are sent as the bot, so calling APIs such as sending messages has real effects. The debugger works on every device, regardless of "Run on this device only".

### Settings Introduction

- `General`

  - `Reset settings options`

    - Restore all settings options to their defaults; the interface refreshes after you confirm
- `QQ Bot`

  - `AppID QQ_BOT_APPID`

    - AppID of the bot on the QQ Open Platform, from the development settings of the bot
  - `AppSecret QQ_BOT_SECRET`

    - AppSecret of the bot on the QQ Open Platform, used to get the access token
    - Stored in plain text in `data/storage/petal/im-bot/config.json` of the workspace and synced with your data
  - `Subscribed events QQ_BOT_INTENTS`

    - Event categories the bot receives, one switch per category. See the QQ documentation [event subscription and notification](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html) for the events in each category
    - "Group and C2C chats" and "Guild @bot messages" are on by default; the inbox and the commands only need "Group and C2C chats"
    - According to the QQ documentation, categories other than guilds, guild members and guild @bot messages may need permission from the QQ Open Platform first. When a subscribed category is not permitted, QQ closes the connection (error code 4014) and the plugin stops reconnecting
    - The bot reconnects after a change; with every switch off, it does not connect
  - `Event log`

    - When on, each received event is saved as a JSON file `data/storage/petal/im-bot/logs/events/<event type>/<event ID>.json` in the workspace. Details in these files, such as the group_openid, help to set up bindings
    - Events without an event ID (`READY`, `RESUMED`) are not saved
    - The files sync with your data, and the plugin never deletes them; turn the log off when you do not need it for troubleshooting
    - On by default; a change applies to the events received afterwards
  - `Run on this device only`

    - When on, only this device connects to the bot: it writes the event log, the inbox and `users.json`, answers commands, sends the online and offline notices and syncs the command panels. Other devices disconnect once the setting syncs to them
    - When off, every device with this plugin connects to the bot
    - The IDs of this device and of the chosen device show under the switch
- `Inbox`

  - `Bound groups`

    - Each binding writes the messages of a group into an inbox document. A group can be bound to several documents, and a document to several groups
    - Click "Add a binding" to add a binding and "Remove" to remove one; changes are saved at once
    - `Group Open ID`: the OpenID of the group (group_openid). The group owner can get it by sending `/openid` to the bot with an @ mention in the group, and it is also in `users.json` and the event log
    - `Inbox document ID`: the ID of the document that collects the messages. Right-click the document in the document tree and choose "Copy > Copy ID"
    - `Enabled`: when off, the binding writes no messages and sends no online or offline notices. A binding without a group or a document ID has no effect either
    - `Reply with the block link`: when on, the bot quotes each message written to the document in a reply with the block hyperlink of its super block, `siyuan://blocks/<block ID>`. A message written to several documents with this switch on gets one reply per document. Off by default; see Q & A for the limits
    - `Online and offline notices`: when on, the group gets the online and offline notices when the plugin starts running and stops; see "Online and offline notices". When several bindings of a group turn this on, the group gets one notice each time. Off by default
  - `Download assets`

    - When a message has images, voice messages, videos or files, download them into the workspace with the SiYuan feature that converts network assets to local ones. Other links to files in the message are downloaded too, and links to web pages stay as they are
    - On by default. When off, messages keep the QQ network links, which may stop working later, as QQ does not say how long they stay valid

## CHANGELOG

[CHANGELOG.md](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/blob/main/CHANGELOG.md)
