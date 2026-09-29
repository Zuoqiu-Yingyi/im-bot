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
- `QQ_BOT_APPID`, `QQ_BOT_SECRET` and `QQ_BOT_INTENTS` are set in the plugin settings. The frontend saves them to `data/storage/petal/im-bot/config.json` and pushes them to the kernel plugin with the `update-config` RPC method. The kernel plugin reads the same file on startup and reconnects only when these values change.
- `QQ_BOT_INTENTS` is a group of switches, one per intent category in `INTENTS` of `src/qq/constants.ts` (the key order is the switch order). `GROUP_AND_C2C_EVENT` and `PUBLIC_GUILD_MESSAGES` are on by default. With every switch off the bot does not connect.
- `siyuan.client` only reaches the local kernel, so the access token and gateway requests go through `/api/network/proxy` (target URL and extra request headers in the `u` and `h` query parameters) and the WebSocket goes through `/ws/network/proxy`. `/api/network/proxy` returns the target's response as `application/octet-stream` with the target's status code; any other media type is a rejection by the kernel itself.
- Every connection attempt fetches a new access token. Close codes 4006, 4007, 4900–4913 and `INVALID_SESSION` start a new session. Close codes 4001, 4002, 4010–4014, 4914, 4915 and a rejected AppID or AppSecret stop reconnecting until a QQ bot setting changes or the plugin restarts. Any other disconnect (4008, 4009, `RECONNECT`, a missed heartbeat ACK, network errors, other close codes such as 4004) reconnects and resumes the session when there is one. The reconnect delay doubles from 1 s up to 60 s and resets after `READY` or `RESUMED`.
- Every device that runs SiYuan with this plugin enabled opens its own gateway session for the same bot, because the config syncs with the workspace.

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
