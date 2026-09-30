> **Git submodule of the [siyuan-packages-monorepo](https://github.com/Zuoqiu-Yingyi/siyuan-packages-monorepo) at [/workspace/plugins/im-bot](https://github.com/Zuoqiu-Yingyi/siyuan-packages-monorepo/tree/main/workspace/plugins/im-bot)**

<div align="center">
<img alt="icon" src="./public/icon.png" style="width: 8em; height: 8em;">

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

</div>

## USER GUIDE

[简体中文](./public/README.zh-CN.md) \| [English](./public/README.md)

## DEVELOPER GUIDE

### BUILD

The plugin has two entries, both built into `dist/`:

| Entry           | Output                                       | Runs in                           | Script              |
| --------------- | -------------------------------------------- | --------------------------------- | ------------------- |
| `src/index.ts`  | `dist/index.js` (CommonJS), `dist/index.css` | SiYuan frontend                   | `pnpm build:plugin` |
| `src/kernel.ts` | `dist/kernel.js` (plain script)              | goja runtime of the SiYuan kernel | `pnpm build:kernel` |

- `pnpm build` and `pnpm build:dev` build the frontend plugin first, then the kernel plugin. The kernel build does not empty `dist/`.
- SiYuan starts `kernel.js` only when `public/plugin.json` declares `kernels`. It lists the backends where the kernel plugin runs, matched like `backends` (`all` for every backend).
- `minAppVersion` is `3.7.3`: kernel plugins shipped in SiYuan 3.7.0, and 3.7.3 fixed kernel plugins not loading on mobile and early RPC calls failing during startup ([siyuan#18271](https://github.com/siyuan-note/siyuan/issues/18271)).
- SiYuan evaluates `kernel.js` as a plain script, not an ES module, so the bundle must not contain `import` or `export`: do not export from `src/kernel.ts`, and do not import runtime values from external modules such as `siyuan`. The kernel plugin has no DOM; use the global `siyuan` object typed by `siyuan/kernel` instead.
- The frontend plugin calls kernel RPC methods with `this.kernel.rpc.call[method](...args)`. Keep method names in `src/constants.ts` so both sides share them.

### QQ BOT GATEWAY

- The kernel plugin (`src/kernel.ts`, `src/qq/`) connects to the QQ bot WebSocket gateway and writes every event the gateway pushes (`op` 0, including `READY` and `RESUMED`) to the kernel log `<workspace>/temp/siyuan.log` at INFO level, for example `[plugin:im-bot] [qq] event C2C_MESSAGE_CREATE {...}`.
- With the event log on (the `eventLog` setting, on by default), the kernel plugin also saves each event as unindented JSON to `data/storage/petal/im-bot/logs/events/<t>/<id>.json` of the workspace (`src/qq/event-log.ts`). `<id>` is the event `id` without its `<t>:` prefix, so an event with the `id` `GROUP_MESSAGE_CREATE:npjpy7jp` is saved to `logs/events/GROUP_MESSAGE_CREATE/npjpy7jp.json`. Any character other than a letter, a digit, `_` or `-` in `<t>` or `<id>` becomes `_`. `READY` and `RESUMED` have no `id` and are not saved. Toggling the setting applies from the next event without reconnecting. The files are under `data/`, so they sync with the workspace.
- The event log is written with `siyuan.storage.put`, not `/api/file/putFile`. A putFile write into `data/storage/petal/im-bot/` pushes a data change for the plugin to every frontend, and a frontend plugin that does not override `onDataChanged` reloads on it.
- `QQ_BOT_APPID`, `QQ_BOT_SECRET` and `QQ_BOT_INTENTS` are set in the plugin settings. The frontend saves them to `data/storage/petal/im-bot/config.json` and pushes them to the kernel plugin with the `update-config` RPC method. The kernel plugin reads the same file on startup, watches it with `siyuan.storage.watcher` and reloads it 1 s after it changes, so a config synced from another device also applies. It reconnects only when these values change.
- `QQ_BOT_INTENTS` is a group of switches, one per intent category in `INTENTS` of `src/qq/constants.ts` (the key order is the switch order). `GROUP_AND_C2C_EVENT` and `PUBLIC_GUILD_MESSAGES` are on by default. With every switch off the bot does not connect.
- `siyuan.client` only reaches the local kernel, so the access token, gateway and OpenAPI requests go through `/api/network/proxy` (target URL and extra request headers in the `u` and `h` query parameters) and the WebSocket goes through `/ws/network/proxy`. `/api/network/proxy` returns the target's response as `application/octet-stream` with the target's status code; any other media type is a rejection by the kernel itself.
- Every connection attempt gets the access token from the cache shared with the OpenAPI client (see QQ BOT OPENAPI). Close codes 4006, 4007, 4900–4913 and `INVALID_SESSION` start a new session. Close codes 4001, 4002, 4010–4014, 4914, 4915 and a rejected AppID or AppSecret stop reconnecting until a QQ bot setting changes or the plugin restarts. The access token endpoint returns its errors with HTTP 200; `100001` (too many requests), HTTP 429 and 5xx are retried like network errors, and any other failure counts as a rejected AppID or AppSecret. Any other disconnect (4008, 4009, `RECONNECT`, a missed heartbeat ACK, network errors, other close codes such as 4004) reconnects and resumes the session when there is one. The reconnect delay doubles from 1 s up to 60 s and resets after `READY` or `RESUMED`.
- The config syncs with the workspace, so every device with this plugin enabled opens its own gateway session for the same bot. The "Run on this device only" setting stores the SiYuan device ID (`conf.system.id` of `/api/system/getConf`, the same as `siyuan.config.system.id` in the frontend) in `qq.device`. When it is set, only that device connects, writes the event log and writes the inbox; the other devices disconnect once the config syncs to them. When it is empty, every device connects.

### QQ BOT OPENAPI

- The `call-qq-api` RPC method (`src/qq/openapi.ts`) calls a server-side API ([OpenAPI](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/api-call-guide.html)) as the bot set in the plugin settings, for example `await this.kernel.rpc.call["call-qq-api"]("/v2/groups/{group_openid}/messages", "POST", { content: "Hello", msg_type: 0 })`. It takes three positional parameters:
  - `url`: the request path, starting with `/`, relative to `https://api.bot.qq.com`. Full URLs are rejected, so the access token is only sent to the QQ API.
  - `method`: `GET`, `POST`, `PUT`, `PATCH` or `DELETE`, case-insensitive.
  - `body` (optional): sent as JSON. Without it (or with `null`) no request body is sent.
- It resolves to the response `{ status, headers, body }` (`IApiResponse` in `src/types/qq.d.ts`) for every HTTP status, so an error such as `400 { err_code, message, trace_id }` is returned rather than thrown. `headers` are the target's response headers without the `Siyuan-Proxy-` prefix the kernel adds, for example `X-Tps-Trace-Id`. `body` is the parsed JSON, `null` when there is no body (such as `204`), or the raw text when it is not JSON. The call rejects with a JSON-RPC error only when the request cannot be made: invalid parameters, an empty AppID or AppSecret, a failed access token request, or the kernel failing to reach the target.
- The access token is cached with its `expires_in` and fetched again when less than 60 s is left: within its validity the token endpoint returns the same token, and in the last 60 s it returns a new one while the old one stays valid. Concurrent calls share one token request, and a `401` response drops the cached token so the next call fetches a new one.
- The method works on every device, regardless of "Run on this device only". Any code that can call the kernel API of the workspace, including other plugins, can call it and act as the bot; the access token itself is never returned.
- The command "Open the QQ bot API debugger" (`openApiDebugger`) opens a tab (`src/components/ApiDebugger.svelte`) for trying the API: pick the method, enter the path and a JSON body, then click "Send" or press Enter in the path field. The tab calls `call-qq-api` through `callQQApi` of the frontend plugin and shows the status code, the time, the response headers and the body (JSON is pretty-printed). A body that is not valid JSON is not sent, an empty body sends no body, and an RPC rejection shows the JSON-RPC code, message and data. The request being edited is written to the tab data, which SiYuan saves with the layout (for example when a tab is opened, switched or closed), so a tab restored from the layout shows the request as of the last layout save. Running the command again switches to a debugger tab that still has the default request instead of opening another one. The command is not registered on mobile, where SiYuan does not open custom tabs.

### QQ BOT COMMANDS

- `src/qq/commands.ts` answers `/openid` in C2C and group chats with a passive text reply (`msg_id` of the command message, `msg_seq` 1): the user's `user_openid` in a C2C chat, and the member's `member_openid` followed by the `group_openid` in a group. The reply texts are `commands.openid` of the i18n files, in the language of the kernel; `{{1}}` is the OpenID.
- In a group, every message that @ the bot is a command and is not written to the inbox, whoever sends it and whatever it says, and no other message is a command. Only the commands of the group owner (`author.member_role` is `owner`) are answered; `/openid` from anyone else is logged at INFO level and ignored. C2C messages have no role, so every user can send commands to the bot in a C2C chat.
- `mentionsBot` of `src/qq/message.ts` decides whether a group message @ the bot. A message that @ everyone (`<@all>` in `content`, or an entry of `mentions` with `scope` `all`) does not, even when it also mentions the bot: QQ sets `is_you` on the entry of everyone too, and `GROUP_AT_MESSAGE_CREATE` removes the mention of the bot from `content` and leaves the bot out of `mentions`, so it cannot show whether such a message also mentions the bot, while both events of a message have to agree. Any other `GROUP_AT_MESSAGE_CREATE` does, and so does a `GROUP_MESSAGE_CREATE` with an entry of `mentions` that has `is_you`.
- A command runs when the text starts with `/<name>`. In `C2C_MESSAGE_CREATE` and `GROUP_AT_MESSAGE_CREATE` the text is the whole `content`. `GROUP_MESSAGE_CREATE` keeps the mention of the bot in `content` (`<@openid>`), so mentions of the bot are removed first; a message that starts with a mention of anyone else, such as `<@openid> /openid`, runs no command. The same message may be pushed again or pushed as both group events, so a message is answered once: the last 1024 answered messages are remembered by message ID and `msg_idx`. A command ignored for the role of its sender is not remembered, so the other event of the message is checked again.
- Every device that connects to the gateway answers commands. The replies all use `msg_seq` 1 and QQ rejects the same `msg_id` and `msg_seq` twice, so when several devices run the bot (no device set in "Run on this device only"), only the first reply is sent and the others are logged as failed. A failed reply, for example after the passive reply window of 5 minutes, is logged as a warning.

### QQ BOT COMMAND PANELS

- `qq.panels.c2c` and `qq.panels.group` are the command panels ([指令面板](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/menu-panel/)) of C2C and group chats, in the request body format of [creating a panel](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_panels.post.html). By default each lists the `openid` command (`type` `command`); clicking an item fills its `name` into the chat input box, and the name of a command item must match a command in `COMMANDS` of `src/qq/constants.ts`. The panels are not in the settings panel; edit `config.json`. Arrays in the saved config replace the defaults instead of merging with them, so a saved config keeps its own `items` when the defaults change.
- `src/qq/panels.ts` syncs them when the kernel plugin starts running and after the AppID, the AppSecret or `qq.panels` change, on the device that runs the bot only:
  1. List the panels of the scope with `GET /v2/panels?scope=<scope>` and find the one whose `panel.remark` equals the config's (`siyuan-plugin-im-bot-c2c` and `siyuan-plugin-im-bot-group`). The list is sorted by the time a panel was set, so with several matches the latest one is used.
  2. If there is none, create the panel with `POST /v2/panels` and the whole config.
  3. Otherwise compare the items and the remark with the config (an omitted `type` counts as `command`, other omitted fields as empty or `false`) and, if they differ, update the panel with `PUT /v2/panels/{panel_id}` and `{ panel }`. An update cannot change `target_type` or the users and groups of a panel, so a different `target_type` is only logged as a warning.
- Syncs run one at a time. A failed sync is logged as a warning and retried the next time the config is applied, for example when the frontend plugin loads. A panel without `remark` is not synced, because it could not be found again after it is created.

### INBOX

- `qq.inbox.bindings` binds the `group_openid` of a group to the ID of an inbox document. The settings panel edits it as a textarea with one `group_openid:document-ID` pair per line (a full-width `：` from an input method also works); lines without both parts are dropped. One group may be bound to several documents.
- `src/qq/inbox.ts` handles `GROUP_AT_MESSAGE_CREATE` and `GROUP_MESSAGE_CREATE` of bound groups, except messages that @ the bot (see QQ BOT COMMANDS), one message at a time in arrival order:
  1. Convert the message into one super block (`src/qq/message.ts`) and append it to the `.temp` document under the inbox document.
  2. If the message has attachments and `qq.inbox.downloadAssets` is on (the default), call `/api/format/netAssets2LocalAssets` on `.temp`.
  3. Move the block to the end of `YYYY/MM/YYYY-MM-DD` under the inbox document. The date is the message `timestamp` in the local time zone of the kernel. Missing documents are created with `/api/filetree/createDocWithMd` under their parent ID, and the empty paragraph of a new date document is deleted.
- The super block carries `custom-event-id` (the event `id`), `custom-author-id`, `custom-author-username` and `custom-msg-idx` (`msg_idx=` of `message_scene.ext`). A message whose `custom-msg-idx` is already in the inbox document tree is skipped, because the gateway may push the same message again or push both events for it. The lookup first checks the last 1024 written messages in memory, because the `attributes` table only indexes a new block about 3 s after it is written, and then queries the `attributes` table.
- Conversion (`src/qq/message.ts`, `src/qq/chat-record.ts`, `src/utils/kramdown.ts`):
  - Text, including images and text mixed in one message, becomes one paragraph. Markdown syntax is escaped so the text shows as sent, and line breaks become `<br>`. `<@all>` and `<@openid>` become `<kbd>@username</kbd>` with the username from `mentions` (lute shows the content of `<kbd>` as is and does not apply backslash escapes in it, so only `&`, `<` and `>` are replaced with entities), faces (`<faceType=...,ext="base64">`) become `[text]` from `ext`, and URLs become links (parentheses in link targets are percent-encoded). The gateway does not tell where images sit in the text, so images come first.
  - A voice attachment becomes an audio block with `voice_wav_url` (browsers cannot play the original amr or silk file) followed by a paragraph with `asr_refer_text`. A `video/*` attachment becomes a video block. Any other attachment becomes a link named after `filename`.
  - A reference (`message_type` 103) becomes a block reference to the block whose `custom-msg-idx` equals `ref_msg_idx`, with the quoted text as a static anchor, followed by the reply. If the quoted message is not in the inbox, a blockquote shows the quoted content from `msg_elements` instead.
  - A chat record (`message_type` 102) only has a text rendering in `content`. `parseChatRecord` parses it into a super block per message, with the sender in `custom-author-username`; nested chat records and quoted messages become nested super blocks. Content that does not match the format becomes a paragraph.
  - Any other message, such as an ARK card (`message_type` 3), is converted as text.
- `netAssets2LocalAssets` converts every remote link in `.temp`, including plain links in the text. SiYuan skips responses served as `text/html`, so links to web pages stay remote. The kernel reads `.temp` when a download (or a data sync of it) starts and writes the whole document back when it finishes, which would drop blocks inserted or moved out in the meantime. The kernel plugin's `siyuan.client.fetch` times out after 1 minute while the kernel keeps downloading, so before each message and after a timed-out download the plugin polls `isSyncing` of `/api/filetree/getDoc` on `.temp` (for up to 30 minutes) before touching it. This also covers a download left running by a previous run of the plugin. QQ does not document how long attachment URLs stay valid, so turning the download off may leave links that stop working later.
- On the first message for an inbox after the plugin starts, message blocks left in `.temp` (for example when SiYuan quit during a download) are downloaded and moved to the date document of their block ID's date.
- The inbox document may be moved or renamed; the plugin caches only document IDs and looks up the parent path again before creating a document. When a cached `.temp` or date document has been deleted, the plugin clears the cache, looks the documents up again (creating them when missing) and retries once.
- A failed message is logged as a warning and skipped; the gateway connection and the event log are not affected.
- `src/qq/notices.ts` sends a notice to every bound group, once per group, as an active text message: `notices.online` when the kernel plugin starts running, and `notices.offline` when it unloads (the plugin is disabled, uninstalled or reloaded, for example after an update or when `kernel.js` changes, or SiYuan exits normally). The texts come from the i18n files in the language of the kernel; `{{1}}` is the device name (`conf.system.name`, or the device ID when the name is empty). Only the device that runs the bot sends them, and only with an AppID and an AppSecret.
- The kernel waits for `onunload` before it stops the plugin, also when SiYuan exits, so the offline notice waits at most 5 s. A forced exit does not stop kernel plugins, so it sends no offline notice. Active messages count against the QQ limits (20 per minute and 1000 per day for each group) and fail when active messages are turned off; a failed notice is logged as a warning.

### RELEASE STEPS

1. Update the version number in `<subrepo-root-dir>/package.json` and `<subrepo-root-dir>/public/plugin.json`, then commit the changes in this sub-repository on the `main` branch.
2. Push the `main` branch to `origin`.
   ```bash
   git push origin main
   ```
3. Update the submodule pointer in [monorepo](https://github.com/Zuoqiu-Yingyi/siyuan-packages-monorepo) to this sub-repository commit, then commit the pointer change in monorepo.
   ```bash
   cd <monorepo-root-dir>
   git add workspace/plugins/im-bot
   git commit -m "chore(submodule): update im-bot"
   ```
4. Await for the CD workflow `release-please.yml` to complete, it will create a _release pull request_ in sub-repository.
5. Merge the _release pull request_, it will create a new _pre-release_ with current [changelog](./CHANGELOG.md) and a new _tag_ with [semantic version](https://semver.org/) in sub-repository.
6. Await for the CD workflow `build.yml` to complete, it will update the distribution files to `publish` branch in sub-repository.
7. Await for the CD workflow `release-distribution.yml` to complete, it will create a new _pre-release_ with an asset named `package.zip` and a new _tag_ with timestamp in sub-repository.

## CHANGELOG

[CHANGE LOG](./CHANGELOG.md)
