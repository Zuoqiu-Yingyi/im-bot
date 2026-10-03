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

A plugin for [SiYuan Note](https://github.com/siyuan-note/siyuan) that connects a QQ bot, a WeChat ClawBot and a Telegram bot to SiYuan: it records the messages of QQ groups, the messages sent to the WeChat ClawBot and the messages of Telegram private chats, groups and channels in inbox documents, and provides commands to look up OpenIDs and chat IDs, a tab that sends messages to the known groups and users, and a debugger for the QQ bot API.

The main features run in the SiYuan kernel, so they work while SiYuan is running, without its interface open. Requires SiYuan 3.7.3 or later.

## QUICK START

1. Create a bot on the [QQ Open Platform](https://q.qq.com/), get its AppID and AppSecret from the development settings of the bot, and choose WebSocket in 「事件订阅与回调地址」 (event subscription and callback).
2. Add the bot to the QQ group to record, and have the group owner turn on 「获取群内全部消息」 (receive all group messages) for the bot.
3. Fill in `QQ Bot > Bot > AppID` and `QQ Bot > Bot > AppSecret` in the settings of this plugin, then turn on `QQ Bot > Bot > Online` (off by default).
4. As the group owner, send `/openid` to the bot with an @ mention in the group. The bot replies with the group_openid of the group.
5. In `QQ Bot > Inbox > Bound groups`, click "Add a binding" and fill in the group_openid and the ID of the document that collects the messages.

From then on, the messages of the group are recorded in dated sub-documents of that document.

To connect a WeChat ClawBot:

1. In `WeChat Bot > Bot > WeChat account`, click "Log in with a QR code", scan the QR code with WeChat on your phone, and confirm on the phone.
2. Fill in the ID of the document that collects the messages in `WeChat Bot > Inbox > Inbox document ID`, then turn on `WeChat Bot > Bot > Online` (off by default).

From then on, the messages you send to this ClawBot in WeChat are recorded in dated sub-documents of that document.

To connect a Telegram bot:

1. In Telegram, send `/newbot` to [@BotFather](https://t.me/BotFather) to create a bot and get its token. To record every message of a group, first send `/setprivacy` to @BotFather to turn off the privacy mode of the bot, then add the bot to the group (a bot already in the group has to be removed and added again for the change to take effect), or make the bot an administrator of the group. To record a channel, add the bot to the channel as an administrator.
2. Fill in the token in `Telegram Bot > Bot > Token`, then turn on `Telegram Bot > Bot > Online` (off by default).
3. Send `/chatid` to the bot in a private chat; in a group, have the owner or an administrator send `/chatid@<bot username>`; in a channel, post `/chatid` (the reply of the bot appears in the channel, so you may delete it afterwards). The bot replies with the ID of the chat.
4. In `Telegram Bot > Inbox > Bound chats`, click "Add a binding" and fill in the chat ID and the ID of the document that collects the messages.

From then on, the messages of the chat are recorded in dated sub-documents of that document.

## Q & A

- No new messages in the inbox?

  - Check that `QQ Bot > Bot > Online` is on. It is off by default, and the bot does not connect to QQ while it is off.
  - The group owner needs to turn on 「获取群内全部消息」 for the bot. Otherwise the bot only receives the messages that @ it, and these are all commands, which are not written to the inbox.
  - Check that the binding is enabled, that the group_openid and the document ID are right, and that "Group and C2C chats" is on in `QQ Bot > Bot > Subscribed events`.
  - With `QQ Bot > Bot > Run on this device only` on, only the chosen device writes the inbox.
- The bot does not connect or respond?

  - Check the connection of this device in `QQ Bot > Bot > Connection`, which shows the reason when the bot is disconnected or stopped connecting. When it says offline, turn on `QQ Bot > Bot > Online`.
  - Look for lines with `[plugin:im-bot]` in the kernel log `temp/siyuan.log` of the workspace.
  - When the AppID or the AppSecret is wrong, or a subscribed event category is not permitted, the plugin stops reconnecting and `Connection` shows why. It connects again after a settings change (such as the AppID, the AppSecret or the subscribed events), or after the plugin is enabled again.
  - If the bot has an IP allowlist on the QQ Open Platform, add the public IP of the device running SiYuan to it.
- "Reply with the block link" is on, but no reply arrives?

  - A passive reply can only be sent within 5 minutes after the message, at most 5 times per message.
  - QQ requires the link domains in bot messages to be registered on the open platform first (the message URL allowlist, for domains with an ICP filing), so QQ may reject `siyuan://` links (error code 40054010). This has not been tried in a real QQ group yet; the kernel log shows why a reply failed.
- The plugin is installed on several devices?

  - The plugin settings sync with your data. Without a chosen device, every device connects to the bot and writes the inbox on its own, which may create duplicate messages or sync conflicts. Turn on `QQ Bot > Bot > Run on this device only` on a device that is always on.
- Is the AppSecret safe?

  - The AppSecret is stored in plain text in `data/storage/petal/im-bot/config.json` of the workspace and syncs with your data. Any program that can call the kernel API of this workspace, including other plugins, can read this file.
  - The kernel methods this plugin provides (the RPC method `call-qq-api`, which calls the QQ bot API as the bot, and `get-users`, which returns the known groups and C2C users) can be used by the same programs too; they never return the AppSecret or the access token.
- WeChat messages are not written to the inbox?

  - Check the status in `WeChat Bot > Bot > WeChat account`: when it says offline, turn on `WeChat Bot > Bot > Online`; an expired login needs a new QR code scan; and only the device where you scanned the QR code receives messages.
  - Check `WeChat Bot > Inbox > Inbox document ID` and that `Write into the inbox` is on.
  - Look for lines with `[plugin:im-bot] [weixin]` in the kernel log.
- What are the limits of the WeChat ClawBot?

  - It only chats one-on-one with the WeChat user who scanned the QR code. It cannot join group chats, and nobody else can add it.
  - Images, voice messages, files and videos are stored encrypted on the WeChat CDN. They are decrypted and saved into the workspace only when the SiYuan kernel provides `siyuan.crypto` with AES-ECB; otherwise they are recorded as placeholder text (voice messages come with the WeChat transcription).
  - Voice messages are saved in the WeChat SILK format, which SiYuan cannot play, so the transcription stays in the message. Media over 100 MB are not downloaded.
  - "Reply with the block link" replies right after a message arrives. WeChat does not publish the limits of replies; the community has observed at most about 10 replies after each message. When a reply succeeds without a message ID, it may not have been delivered, and the kernel log shows a warning. Messages the bot starts on its own are even less reliable, so the plugin does not send online and offline notices to WeChat.
  - The plugin uses the same API (the iLink Bot API) as the official OpenClaw WeChat plugin. WeChat has not said whether other clients may use it.
- Is the WeChat login safe?

  - The login token (bot_token) is stored in plain text in `data/storage/petal/im-bot/weixin.json` of the workspace and syncs with your data. Any program that can call the kernel API of this workspace, including other plugins, can read this file.
  - The WeChat kernel methods of this plugin never return the bot_token. The login QR code is generated locally. Whoever scans it becomes the user who can chat with the bot, so do not share it.
- Telegram messages are not written to the inbox?

  - Check the state of this device in `Telegram Bot > Bot > Connection`, which shows the reason when the bot stopped receiving. When it says offline, turn on `Telegram Bot > Bot > Online`.
  - In groups: bots run in privacy mode by default and only receive a few messages, such as commands meant for them and replies to them. To record every message, send `/setprivacy` to @BotFather to turn privacy mode off, then remove the bot from the group and add it again (Telegram applies the change only after the bot is added again); or make the bot an administrator of the group.
  - In channels: the bot has to be a member of the channel (usually as an administrator) to receive channel posts.
  - When a basic group is upgraded to a supergroup, its chat ID changes to a new one starting with `-100`. The kernel log shows a warning; update the binding with the new chat ID.
  - Check that the binding is enabled and that the chat ID and the document ID are right. With `Run on this device only` on, only the chosen device writes the inbox.
  - Look for lines with `[plugin:im-bot] [telegram]` in the kernel log.
- The Telegram connection says it stopped receiving?

  - The plugin stops receiving when the token is wrong or malformed, or the Bot API server is wrong. It connects again after a settings change (such as the token or the Bot API server), or after the plugin is enabled again.
  - Telegram does not allow receiving messages the way this plugin does (getUpdates) while the bot has a webhook. Delete the webhook first, for example by opening `https://api.telegram.org/bot<token>/deleteWebhook` in a browser.
  - Only one program can receive the messages of a bot at a time: when SiYuan on another device or another bot program receives them too, the one that starts later makes the earlier one get a conflict error (error code 409), and this plugin stops receiving when it gets that error. With several devices, turn on `Run on this device only`, and stop other programs that use the token.
- Is the Telegram token safe?

  - The token is stored in plain text in `data/storage/petal/im-bot/config.json` of the workspace and syncs with your data. Any program that can call the kernel API of this workspace, including other plugins, can read this file. Whoever has the token fully controls the bot; if it leaks, send `/revoke` to @BotFather to get a new token.
  - In the logs the plugin writes and in the errors it shows in the settings panel, the secret part of the token is replaced with `***`.
  - Every request sends the token to the `Bot API server`, so only fill in a server you trust.

## INTRODUCTION

### Features Introduction

- Connection to the QQ bot

  - With `QQ Bot > Bot > Online` on, the plugin connects to the QQ bot over WebSocket from the SiYuan kernel and reconnects after a disconnect, waiting from 1 second up to 60 seconds between attempts. Turning the switch off disconnects the bot; events while it is offline are not recorded, and they are not received later when it goes online again.
  - `QQ Bot > Bot > Connection` shows the connection of this device.
  - Every received event is written to the kernel log, and also saved as a file with `QQ Bot > Bot > Event log` on.
- Known groups and C2C users

  - QQ has no API that lists the groups the bot is in or the users who chat with it, so the plugin records them from the received events in `data/storage/petal/im-bot/users.json` of the workspace (next to `config.json`, synced with your data), where you can look up group_openids and user_openids. These events belong to "Group and C2C chats" in `QQ Bot > Bot > Subscribed events`.
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

  - When "Online and offline notices" is on in a binding, the group gets an "Inbox online" notice when the bot goes online, and an "Inbox offline" notice when it goes offline. The notices name the device. The switch is off by default.
  - The bot goes online when you turn on `QQ Bot > Bot > Online`, or when the plugin starts running with that switch on. It goes offline when you turn the switch off, or when the plugin stops (disabled, uninstalled, reloaded after an update, or SiYuan exits normally). When "Run on this device only" moves the bot to another device, the previous device sends the offline notice and the new device sends the online notice.
  - Only the device that runs the bot sends them. When SiYuan exits, it waits at most 5 seconds for the offline notice; a forced exit, a crash or a kill sends no offline notice.
  - The notices are active QQ messages and count against the QQ limits (20 per minute and 1000 per day for each group). They fail when the bot has no permission to send active messages; the kernel log shows why a notice failed.
- Commands

  - `/openid`: look up OpenIDs

    - Send `/openid` to the bot in a C2C chat, and the bot replies with your user_openid.
    - Send `/openid` to the bot with an @ mention in a group, and the bot replies with your member_openid in the group and the group_openid of the group.
  - In groups, the bot only answers the commands of the group owner and ignores the commands of other members.
  - In groups, every message that @ the bot is a command. Anything that is not a known command (such as "@bot hello") is ignored and not written to the inbox. Messages that do not @ the bot are never commands.
- Command panels

  - When the bot goes online, the plugin creates or updates the command panels of C2C and group chats on the QQ Open Platform (shown when you type `/` in the QQ input box). By default they list the `openid` command, and in groups only admins can use it. While the plugin runs, it syncs them again only after the AppID, the AppSecret or the panel config changes.
  - The panels are not in the settings panel. Advanced users can edit `qq.panels` in `data/storage/petal/im-bot/config.json`, in the format of the QQ documentation [creating a panel](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels.post.html). `panel.remark` must not be empty, because the plugin finds the panel by it.
- Messenger

  - Run "Open the QQ bot messenger" in the Command Palette (desktop only) to open a tab that sends active messages as the bot to the known groups and C2C users.
  - Choose the recipient from `users.json` (see "Known groups and C2C users"). Groups the bot is still in and users who still have the bot come first, the most recently active first; groups that removed the bot and users who deleted it are marked. Click "Refresh" to read the list again, including the changes not written to `users.json` yet.
  - The tab shows the status of the chosen recipient, its active message setting, the group owner or the union_openid, and the times of the latest message and the first record.
  - For a group, click "Query the group info" to get its name, description, category, tags and number of members; the name then also shows in the recipient list. This API is only open to allowlisted bots; otherwise the tab says that you need to apply for it on the QQ Open Platform.
  - Choose text or Markdown as the message type. For a C2C user, turn on "Wake-up message" to send it as a wake-up message (`is_wakeup`).
  - Click "Send" or press Ctrl+Enter (⌘+Enter on macOS) to send the message and see the status code, the time, the response headers and the response body. Sending succeeds when the status code is 2xx and the response body has no error code (`err_code`); the message is then cleared. It is kept when sending fails, or when you edit it while waiting for the response; the error code in the response body tells why sending failed.
  - QQ limits active messages: a group needs the group owner to turn on 「机器人主动在群聊内发言」 (the bot may speak in the group) for the bot, and a user needs to turn on active messages on the profile card of the bot. Each group or user receives at most 20 per minute and 1000 per day. Wake-up messages can only be sent within 30 days after the user chats with the bot, one each on the same day, in days 1–3, 3–7 and 7–30.
  - Messages are really sent to the groups and users. The messenger works on every device, regardless of "Online" and "Run on this device only".
- QQ bot API debugger

  - Run "Open the QQ bot API debugger" in the Command Palette (desktop only) to open a tab that calls the [QQ bot server API](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/api-call-guide.html) as the bot.
  - Pick the request method, enter a request path starting with `/` (relative to `https://api.bot.qq.com`, for example `/gateway/bot`) and a JSON request body, then click "Send" or press Enter in the path field to see the status code, the time, the response headers and the response body.
  - Requests are sent as the bot, so calling APIs such as sending messages has real effects. The debugger works on every device, regardless of "Online" and "Run on this device only".
- WeChat bot (ClawBot)

  - After you log in with a QR code in `WeChat Bot > Bot > WeChat account` and turn on `WeChat Bot > Bot > Online`, the plugin receives the messages sent to the ClawBot by long polling in the SiYuan kernel, without a public address. The login is stored in `data/storage/petal/im-bot/weixin.json`.
  - Turning "Online" off stops receiving, and turning it on again continues from the last receiving position. Whether the messages sent to the ClawBot while it is offline arrive after it goes online depends on whether the WeChat service keeps them, which has not been verified.
  - The device where you scan the QR code receives the messages. After you scan a new QR code on another device, that device receives them, and the previous device stops once your data syncs.
  - The receiving position is stored in `data/storage/petal/im-bot/weixin/cursor.json`, so the plugin continues where it stopped after a restart. A new login starts over.
  - When WeChat reports that the login expired, the plugin stops receiving until you scan a new QR code. "Log out" stops receiving and removes the login.
  - Received messages are written into the document in `WeChat Bot > Inbox > Inbox document ID` the same way as the QQ inbox: inserted into `.temp` first, then moved to the end of the `YYYY/MM/YYYY-MM-DD` document. The same document can also be the inbox of QQ groups.
  - How messages are converted

    - Each message becomes a super block with one paragraph per message item: text shows as it is, with web addresses turned into links; images, voice messages, files and videos first show as `[Image]`, `[Voice]` followed by the transcription, `[File] <file name>` and `[Video]`.
    - When `WeChat Bot > Inbox > Download assets` is on and the SiYuan kernel can decrypt them, the plugin downloads the media from the WeChat CDN after the reply, decrypts them with AES-128-ECB, saves them as assets and replaces the placeholders: images show as images, videos as video blocks, and voice messages and files as links to their assets (voice messages keep the transcription). The message block keeps its ID, so the block link already sent and the block references to it still work.
    - Media that fail to download or decrypt keep their placeholders, with a warning in the kernel log. When a message carries the MD5 of a file or a video, the plugin checks it and only logs a warning on a mismatch; the file is still saved.
    - Quotes: when the quoted message is already in the inbox, the quote becomes a block reference to it; otherwise a blockquote shows the quoted content.
    - Messages sent by the bot itself are not written, and a message received more than once is written only once.
  - Message blocks have the custom attributes `custom-author-id` (the WeChat user ID of the sender) and `custom-msg-id` (the message ID).
- Telegram bot

  - With a token filled in and `Telegram Bot > Bot > Online` on, the plugin receives the messages of the bot by long polling (getUpdates) in the SiYuan kernel, without a public address. The bot cannot have a webhook at the same time.
  - `Telegram Bot > Bot > Connection` shows the state of this device. A failed request is retried after 2 seconds, and after 30 seconds once 3 requests in a row have failed; when rate limited, the plugin waits as long as Telegram asks.
  - The receiving position is only kept in memory, as the Telegram server remembers which messages were received. Messages sent to the bot while "Online" is off or the plugin is stopped are kept by Telegram for up to 24 hours and received after the bot goes online again.
  - Every received update is written to the kernel log, and also saved as a file with `Telegram Bot > Bot > Event log` on.
- Telegram inbox

  - Each binding writes the messages of a chat (a private chat, a group or a channel) into an inbox document the same way as the QQ inbox: inserted into `.temp` first, then moved to the end of the `YYYY/MM/YYYY-MM-DD` document. The same document can also be the inbox of QQ groups and WeChat.
  - Commands for this bot (such as `/chatid` and `/start@<bot username>`) and service messages such as member changes and pins are not written; a command with the username of another bot (such as `/start@other_bot`) is written as an ordinary message.
  - A message received more than once is written only once. Editing or deleting a message in Telegram does not change the inbox.
  - How messages are converted

    - Each message becomes a super block. Text shows as it is (formatting such as bold is not kept), with web addresses and text links turned into links.
    - Media first show as placeholders such as `[Image]`, `[Voice]` and `[File] <file name>`. With `Telegram Bot > Inbox > Download assets` on, the plugin downloads the media from Telegram, saves them as assets and replaces the placeholders: images and static stickers show as images; videos, video messages, video stickers and animations as video blocks; voice messages and audio as audio blocks; and files as links named after the files. Only the largest size of an image is saved, and the caption follows the media.
    - The official Telegram server only serves files up to 20 MB, so larger media and media that fail to download keep their placeholders, with a warning in the kernel log. Animated stickers (.tgs) cannot be shown and keep their placeholders.
    - Locations show as links to OpenStreetMap; contacts, polls and dice show as text.
    - Replies: when the replied message is already in the inbox, the reply starts with a block reference to it; otherwise a blockquote shows the replied content (the quoted part when the reply quotes part of the message).
  - Message blocks have these custom attributes

    - `custom-msg-id`: `<chat ID>:<message ID>`. A message ID is only unique within its chat, so the chat ID is included
    - `custom-author-id`: the user ID of the sender; the ID of the group or channel when sending as that group or channel
    - `custom-author-username`: the name of the sender (the signature or the channel name in channels), only recorded in groups and channels, and shown at the top left of the message block
  - With "Reply with the block link" on in a binding, the bot replies to each message written to the document with the block hyperlink of its super block, `siyuan://blocks/<block ID>`. With "Online and offline notices" on, the chat gets a notice when the bot goes online and when it goes offline, at the same moments as the QQ "Online and offline notices".
- Telegram commands

  - `/chatid` (and `/start`): the bot replies with the ID of the chat, and in groups also with the user ID of the sender. In groups, send `/chatid@<bot username>`: with privacy mode on, the bot may not receive commands without its username.
  - In groups, only commands from the owner and administrators (anonymous administrators included) are answered; commands from other members are only logged.

### Settings Introduction

- `General`

  - `Reset settings options`

    - Restore all settings options to their defaults; the interface refreshes after you confirm
- `QQ Bot`

  - `Bot`

    - `Online`

      - When on, the bot goes online: it connects to QQ, records the messages of bound groups, writes `users.json`, answers commands and syncs the command panels. When off, the bot goes offline and disconnects, and messages are not recorded while it is offline. The groups whose bindings turn on "Online and offline notices" get a notice each time; see "Online and offline notices"
      - Off by default. The setting syncs to your other devices; with `Run on this device only` on, only the chosen device goes online
    - `Connection`

      - Shows the connection of the bot to QQ on this device: connected (since when, and the name of the bot), connecting, disconnected (when it connects again, and why it disconnected), stopped connecting (and why), and the cases where it does not connect: offline, running on another device only, no AppID or AppSecret, or no subscribed event
      - Refreshed every 2 seconds while the settings panel is open
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
      - When off, every device with this plugin connects to the bot while it is online
      - The IDs of this device and of the chosen device show under the switch
  - `Inbox`

    - `Bound groups`

      - Each binding writes the messages of a group into an inbox document. A group can be bound to several documents, and a document to several groups
      - Click "Add a binding" to add a binding and "Remove" to remove one; changes are saved at once
      - `Group Open ID`: the OpenID of the group (group_openid). The group owner can get it by sending `/openid` to the bot with an @ mention in the group, and it is also in `users.json` and the event log
      - `Inbox document ID`: the ID of the document that collects the messages. Right-click the document in the document tree and choose "Copy > Copy ID"
      - `Enabled`: when off, the binding writes no messages and sends no online or offline notices. A binding without a group or a document ID has no effect either
      - `Reply with the block link`: when on, the bot quotes each message written to the document in a reply with the block hyperlink of its super block, `siyuan://blocks/<block ID>`. A message written to several documents with this switch on gets one reply per document. Off by default; see Q & A for the limits
      - `Online and offline notices`: when on, the group gets a notice when the bot goes online and when it goes offline; see "Online and offline notices". When several bindings of a group turn this on, the group gets one notice each time. Off by default
    - `Download assets`

      - When a message has images, voice messages, videos or files, download them into the workspace with the SiYuan feature that converts network assets to local ones. Other links to files in the message are downloaded too, and links to web pages stay as they are
      - On by default. When off, messages keep the QQ network links, which may stop working later, as QQ does not say how long they stay valid
- `WeChat Bot`

  - `Bot`

    - `Online`

      - When on, the device where you scanned the QR code receives the messages sent to the ClawBot; when off, it stops receiving them. See "WeChat bot (ClawBot)"
      - Off by default, so turn it on after logging in to receive messages. The setting syncs to your other devices
    - `WeChat account`

      - Shows the logged-in bot, the WeChat user, the login time, the device receiving messages and the status; the status says offline while `Online` is off
      - Click "Log in with a QR code" to show a QR code, scan it with WeChat on your phone and confirm on the phone. When WeChat asks for a number, enter the number shown on the phone here. A QR code expires after about 2 minutes and is replaced automatically, up to 3 QR codes per login (8 minutes at most); after that, click "Log in with a QR code" again
      - Click "Log out" to stop receiving messages and remove the login
    - `Event log`

      - When on, saves each received message as a JSON file `data/storage/petal/im-bot/logs/weixin/messages/<message ID>.json` in the workspace
      - These files sync with your data, and the plugin does not delete them. On by default
  - `Inbox`

    - `Inbox document ID`

      - ID of the document that WeChat messages are written into; nothing is written when empty
    - `Write into the inbox`

      - When off, messages are only logged, not written into the inbox. On by default
    - `Reply with the block link`

      - When on, the bot replies to each message written into the inbox with the block hyperlink of its super block, `siyuan://blocks/<block ID>`. Off by default; see Q & A for the limits
    - `Download assets`

      - When on, decrypts the images, voice messages, videos and files of messages and saves them as assets in the workspace; see "How messages are converted". When the SiYuan kernel cannot decrypt them (no `siyuan.crypto`, or no AES-ECB), they stay placeholders
      - On by default; a change applies to the messages received afterwards
- `Telegram Bot`

  - `Bot`

    - `Online`

      - When on, the bot goes online: it receives Telegram messages, records the messages of bound chats and answers commands. When off, it stops receiving them. The chats whose bindings turn on "Online and offline notices" get a notice each time
      - Off by default. The setting syncs to your other devices; with `Run on this device only` on, only the chosen device goes online
    - `Connection`

      - Shows the connection of the bot to Telegram on this device: receiving messages (since when, and the username of the bot), connecting, request failed (when it retries, and why), stopped receiving (and why), and the cases where it does not connect: offline, running on another device only, or no token
      - Refreshed every 2 seconds while the settings panel is open
    - `Token`

      - Token of the bot from @BotFather, like `123456:ABC-DEF...`
      - Stored in plain text in `data/storage/petal/im-bot/config.json` of the workspace and synced with your data
    - `Bot API server`

      - Leave it empty to use the official Telegram server `https://api.telegram.org`. You can also fill in the address of a [self-hosted Bot API server](https://github.com/tdlib/telegram-bot-api) or a reverse proxy (such as `http://127.0.0.1:8081`) for networks that cannot reach the official server
      - A self-hosted server running in `--local` mode does not serve file downloads, so media keep their placeholders
      - Every request sends the token to this address
    - `Event log`

      - When on, saves each received update as a JSON file `data/storage/petal/im-bot/logs/telegram/updates/<bot ID>/<update ID>.json` in the workspace
      - These files sync with your data, and the plugin does not delete them. On by default
    - `Run on this device only`

      - When on, only this device receives messages: it writes the event log and the inbox, answers commands and sends the online and offline notices. Telegram lets only one program receive the messages of a bot at a time, so turn it on when you have several devices
      - When off, every device with this plugin tries to receive the messages while the bot is online, and they conflict with each other
      - The IDs of this device and of the chosen device show under the switch
  - `Inbox`

    - `Bound chats`

      - Each binding writes the messages of a chat into an inbox document. A chat can be bound to several documents, and a document to several chats
      - `Chat ID`: the user ID of the other person in a private chat; negative for groups, and starting with `-100` for supergroups and channels. Send `/chatid` to the bot to get it, or find it in the event log
      - `Inbox document ID`: the ID of the document that collects the messages. Right-click the document in the document tree and choose "Copy > Copy ID"
      - `Enabled`: when off, the binding writes no messages and sends no online or offline notices. A binding without a chat or a document ID has no effect either
      - `Reply with the block link`: when on, the bot replies to each message written to the document with the block hyperlink of its super block. Off by default
      - `Online and offline notices`: when on, the chat gets a notice when the bot goes online and when it goes offline. When several bindings of a chat turn this on, the chat gets one notice each time. Off by default
    - `Download assets`

      - When on, downloads the images, voice messages, videos, stickers and files of messages as assets in the workspace; see "Telegram inbox". The official server only serves files up to 20 MB
      - On by default; a change applies to the messages received afterwards

## CHANGELOG

[CHANGELOG.md](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/blob/main/CHANGELOG.md)
