# Changelog

## [0.0.0](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/compare/v0.1.0...v0.0.0) (2026-10-01)


### Miscellaneous

* add the icon and preview images ([ba77c7d](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/ba77c7dced13b0ffd9987fe537169e567a33a0d4))
* fill in the plugin metadata ([959a7a4](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/959a7a4621018a5d7bf3d280e4d28fba4b0a1d08))
* **i18n:** label the group field of inbox bindings "Group Open ID" ([fc52de9](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/fc52de9341c28dd193eeb86a5476d3cd828ae46b))
* release `v0.1.0` ([a288a2a](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/a288a2a18fe4fc4d2f0d3ca681c3f92ff22ec123))
* update version to 0.1.0 in manifest, package, and plugin files ([8baef0a](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/8baef0a5996a9048953f11d93350992fa80c796f))


### Documentation

* write the user guide and follow the template developer README ([0495afc](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/0495afc0abdc30cff8cd9ef667b190d5e25266b5))


### Features

* **qq:** add a switch for the online and offline notices of each inbox binding ([db7a78f](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/db7a78f6bb12d8d04cf6506f3a645a85337958aa))
* **qq:** add a tab for debugging the QQ bot OpenAPI ([6af1211](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/6af121122e5b484abc3691335913d21834f2cf01))
* **qq:** add a tab that sends messages to the known groups and users ([9094c4a](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/9094c4aeb19a0d50175d4863a2078e2cb9582afd))
* **qq:** add the /openid command and sync the command panels ([a36e48a](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/a36e48a827d2198b459bd50b517aae572c0a7f5d))
* **qq:** add the call-qq-api RPC method for the QQ bot OpenAPI ([0ac2245](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/0ac22452b735f3517ebe31d7792c44a0b80268ac))
* **qq:** connect to the QQ bot gateway and log its events ([94ff4cb](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/94ff4cb7f4448de712268edc60ca536df478a9d2))
* **qq:** edit the inbox bindings in a GUI with enable and reply switches ([ede7e55](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/ede7e5575f640b961499dc5c526984a2da38149a))
* **qq:** keep the known groups and C2C users in users.json ([154e1be](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/154e1bef18ad9c17e025fedd7b402b93585b0a7e))
* **qq:** notify the bound groups when the kernel plugin starts and stops ([01308fe](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/01308fe5958bf83532a6bd855eb519bd9448e949))
* **qq:** quote the message in the block link reply ([a9554da](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/a9554da98ce2895a3ef1835b23e0f6c185a02619))
* **qq:** save gateway events to logs/events ([1e6ecb8](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/1e6ecb8f1d66832048f84d408e8d818e3f2ad5f8))
* **qq:** separate inbox bindings with ":" and show mentions as kbd ([a9d4a51](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/a9d4a51bee0670a37d5eba3760e501cf25e3a426))
* **qq:** show the sender's nickname above each inbox message ([3434cc0](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/3434cc0979bd9d2eeaa8b90f37c9f64151672f41))
* **qq:** treat group messages that mention the bot as commands ([ed4754b](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/ed4754bae74f6f1a17300bab6ebcf3d9195784cd))
* **qq:** write messages of bound groups into inbox documents ([118acff](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/118acff06165d3c62f89f86a39108fb6b77838ac))


### Bug Fixes

* **qq:** get the access token from api.bot.qq.com ([bb5f11c](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/bb5f11cb735d0928cbccc29f8b5a3e03538d14fe))
* **qq:** keep dollar signs in messenger labels and judge sends by err_code ([6c5d729](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/6c5d729647bd65528046d3411dd481e5c336a6cd))
* **qq:** parse links and images followed by a space or a quote ([6f6d5d0](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/6f6d5d08a9238505d7cbe91894f9e9c10c46c181))


### Code Refactoring

* **init:** rename template references to im-bot and update related configurations ([0cf3c27](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/0cf3c27ab6b679ccd4d96b243fca1d91ea5234cf))


### Styles

* put else and catch on their own lines ([6016f71](https://github.com/Zuoqiu-Yingyi/siyuan-plugin-im-bot/commit/6016f71b8fc3fa5cd7b374cdc9030402a096cf3d))
