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

| Entry           | Output                          | Runs in                           | Script              |
| --------------- | ------------------------------- | --------------------------------- | ------------------- |
| `src/index.ts`  | `dist/index.js` (CommonJS)      | SiYuan frontend                   | `pnpm build:plugin` |
| `src/kernel.ts` | `dist/kernel.js` (plain script) | goja runtime of the SiYuan kernel | `pnpm build:kernel` |

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
- `siyuan.client` only reaches the local kernel, so the access token and gateway requests go through `/api/network/proxy` (target URL and extra request headers in the `u` and `h` query parameters) and the WebSocket goes through `/ws/network/proxy`. `/api/network/proxy` returns the target's response as `application/octet-stream` with the target's status code; any other media type is a rejection by the kernel itself.
- Every connection attempt fetches a new access token. Close codes 4006, 4007, 4900–4913 and `INVALID_SESSION` start a new session. Close codes 4001, 4002, 4010–4014, 4914, 4915 and a rejected AppID or AppSecret stop reconnecting until a QQ bot setting changes or the plugin restarts. Any other disconnect (4008, 4009, `RECONNECT`, a missed heartbeat ACK, network errors, other close codes such as 4004) reconnects and resumes the session when there is one. The reconnect delay doubles from 1 s up to 60 s and resets after `READY` or `RESUMED`.
- The config syncs with the workspace, so every device with this plugin enabled opens its own gateway session for the same bot. The "Run on this device only" setting stores the SiYuan device ID (`conf.system.id` of `/api/system/getConf`, the same as `siyuan.config.system.id` in the frontend) in `qq.device`. When it is set, only that device connects, writes the event log and writes the inbox; the other devices disconnect once the config syncs to them. When it is empty, every device connects.

### INBOX

- `qq.inbox.bindings` binds the `group_openid` of a group to the ID of an inbox document. The settings panel edits it as a textarea with one `group_openid document-ID` pair per line; lines with fewer than two fields are dropped. One group may be bound to several documents.
- `src/qq/inbox.ts` handles `GROUP_AT_MESSAGE_CREATE` and `GROUP_MESSAGE_CREATE` of bound groups, one message at a time in arrival order:
  1. Convert the message into one super block (`src/qq/message.ts`) and append it to the `.temp` document under the inbox document.
  2. If the message has attachments and `qq.inbox.downloadAssets` is on (the default), call `/api/format/netAssets2LocalAssets` on `.temp`.
  3. Move the block to the end of `YYYY/MM/YYYY-MM-DD` under the inbox document. The date is the message `timestamp` in the local time zone of the kernel. Missing documents are created with `/api/filetree/createDocWithMd` under their parent ID, and the empty paragraph of a new date document is deleted.
- The super block carries `custom-event-id` (the event `id`), `custom-author-id`, `custom-author-username` and `custom-msg-idx` (`msg_idx=` of `message_scene.ext`). A message whose `custom-msg-idx` is already in the inbox document tree is skipped, because the gateway may push the same message again or push both events for it. The lookup first checks the last 1024 written messages in memory, because the `attributes` table only indexes a new block about 3 s after it is written, and then queries the `attributes` table.
- Conversion (`src/qq/message.ts`, `src/qq/chat-record.ts`, `src/utils/kramdown.ts`):
  - Text, including images and text mixed in one message, becomes one paragraph. Markdown syntax is escaped so the text shows as sent, and line breaks become `<br>`. `<@all>` and `<@openid>` become `@username` from `mentions`, faces (`<faceType=...,ext="base64">`) become `[text]` from `ext`, and URLs become links. The gateway does not tell where images sit in the text, so images come first.
  - A voice attachment becomes an audio block with `voice_wav_url` (browsers cannot play the original amr or silk file) followed by a paragraph with `asr_refer_text`. A `video/*` attachment becomes a video block. Any other attachment becomes a link named after `filename`.
  - A reference (`message_type` 103) becomes a block reference to the block whose `custom-msg-idx` equals `ref_msg_idx`, with the quoted text as a static anchor, followed by the reply. If the quoted message is not in the inbox, a blockquote shows the quoted content from `msg_elements` instead.
  - A chat record (`message_type` 102) only has a text rendering in `content`. `parseChatRecord` parses it into a super block per message, with the sender in `custom-author-username`; nested chat records and quoted messages become nested super blocks. Content that does not match the format becomes a paragraph.
  - Any other message, such as an ARK card (`message_type` 3), is converted as text.
- `netAssets2LocalAssets` converts every remote link in `.temp`, including plain links in the text. SiYuan skips responses served as `text/html`, so links to web pages stay remote. The kernel reads `.temp` when a download (or a data sync of it) starts and writes the whole document back when it finishes, which would drop blocks inserted or moved out in the meantime. The kernel plugin's `siyuan.client.fetch` times out after 1 minute while the kernel keeps downloading, so before each message and after a timed-out download the plugin polls `isSyncing` of `/api/filetree/getDoc` on `.temp` (for up to 30 minutes) before touching it. This also covers a download left running by a previous run of the plugin. QQ does not document how long attachment URLs stay valid, so turning the download off may leave links that stop working later.
- On the first message for an inbox after the plugin starts, message blocks left in `.temp` (for example when SiYuan quit during a download) are downloaded and moved to the date document of their block ID's date.
- The inbox document may be moved or renamed; the plugin caches only document IDs and looks up the parent path again before creating a document. When a cached `.temp` or date document has been deleted, the plugin clears the cache, looks the documents up again (creating them when missing) and retries once.
- A failed message is logged as a warning and skipped; the gateway connection and the event log are not affected.

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
