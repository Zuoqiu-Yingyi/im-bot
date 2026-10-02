# iLink Bot API（微信 ClawBot）参考文档

> 本文档面向 im-bot 的开发者，用于评估和实现微信个人号接入。内容基于 2026-10-01
> 的调研，详见文末「参考来源」。**微信官方没有面向第三方开发者的 iLink API 文档站**，
> 本文大部分字段定义转述自腾讯官方开源仓库 `Tencent/openclaw-weixin` 随附的协议说明，
> 并补充了对真实服务的探测结果与社区实测数据。请在实现前阅读「六、限制与已知问题」，
> 很多数字没有官方承诺、互相矛盾，或随时可能变化。

## 速览结论

- iLink 是微信「ClawBot」插件背后的协议：个人微信用户扫码后，与自托管程序建立
  **一对一私聊**通道。扫码、收消息、发消息全部是客户端主动发起的 HTTPS 请求，
  **不需要公网 IP 或公网域名**，和思源内核的出站代理模型天然契合。
- 能做的事：收发文本、图片、语音（含转写文本）、文件、视频；展示「正在输入」；
  断线后用游标续传。
- 做不到或不可靠的事：**群聊**（协议不支持）；**可靠的主动推送**（上线/下线通知、
  定时提醒等——依赖的 `context_token` 时效与额度在社区实测中差异很大，详见下文）；
  **送达确认**（接口返回成功不代表用户真的收到）。
- 对 im-bot 的意义：可以作为"把个人微信消息收进思源收集箱"的通道，参考现有
  QQ 机器人网关（`src/qq/gateway.ts`）的接入方式；但不要在此通道上复刻 QQ 侧
  的上下线通知功能，大概率不可靠。

## 一、总体架构

| 项目         | 值                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| API Base URL | `https://ilinkai.weixin.qq.com`（扫码确认后，后续请求改用服务端返回的 `baseurl`，可能因网络环境、IDC 调度而变化） |
| CDN Base URL | `https://novac2c.cdn.weixin.qq.com/c2c`                                                                           |
| 传输协议     | HTTPS + JSON；二维码状态轮询用 `GET`，其余接口用 `POST`                                                           |
| 二进制字段   | JSON 中以 base64 字符串表示                                                                                       |
| 长连接       | 无。消息接收靠客户端对 `getupdates` 发起长轮询（服务端最多 hold 住请求约 35 秒）                                  |

与企业微信「智能机器人」的 WebSocket 长连接（`wss://openws.work.weixin.qq.com`，
见[企业微信开发者文档](https://developer.work.weixin.qq.com/document/path/101463)）
不同，iLink 没有真正的长连接，是"更慢但更简单"的 HTTP 长轮询模型，优点是无需处理
连接保活、断线重连等状态机。

## 二、鉴权与公共字段

### 请求头

| Header                    | 值                                                                                                                | 适用范围                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `Content-Type`            | `application/json`                                                                                                | 所有 JSON POST 请求                               |
| `AuthorizationType`       | `ilink_bot_token`                                                                                                 | 除二维码状态轮询（GET）外的全部请求               |
| `Authorization`           | `Bearer <bot_token>`                                                                                              | 需要鉴权的 Bot API（`get_bot_qrcode` 本身不需要） |
| `X-WECHAT-UIN`            | 随机 uint32 的十进制字符串，再做 base64 编码；**每次请求都应重新生成**                                            | 除二维码状态轮询外的全部请求                      |
| `iLink-App-Id`            | 官方插件固定为 `bot`                                                                                              | 全部请求                                          |
| `iLink-App-ClientVersion` | 客户端版本号，按 `0x00MMNNPP`（主版本.次版本.修订号）编码后转十进制字符串，例如 `2.4.9` → `0x00020409` = `132617` | 全部请求                                          |
| `SKRouteTag`              | 可选，部署侧配置的路由标签                                                                                        | 全部请求                                          |

二维码状态轮询（`GET /ilink/bot/get_qrcode_status`）只带 `iLink-App-Id`、
`iLink-App-ClientVersion`、可选的 `SKRouteTag`，不带 `AuthorizationType`、
`Authorization`、`X-WECHAT-UIN`。获取二维码（`POST /ilink/bot/get_bot_qrcode`）
带 `AuthorizationType` 与 `X-WECHAT-UIN`，但不带 `Authorization` 和 `base_info`
（此时还没有 bot_token）。

### `base_info`

鉴权后的 POST 请求体都带一个 `base_info` 字段：

```json
{
    "base_info": {
        "channel_version": "2.4.9",
        "bot_agent": "im-bot/1.0.0"
    }
}
```

- `channel_version`：客户端（本插件）的版本号，纯信息字段。
- `bot_agent`：可选的自定义标识，类似 HTTP `User-Agent`，仅用于服务端侧的日志
  和监控归因，不参与鉴权或路由。格式是 UA 风格的 `Name/Version` token，可带
  `(comment)`，多个 token 用空格分隔，整体 ASCII 且 ≤256 字节；不合法时应回退
  为一个默认值（官方插件回退为 `"OpenClaw"`）。

### 响应约定（`ret` / `errcode` / `errmsg`）

响应体可能包含 `ret`、`errcode`、`errmsg`，但不是每个接口都用得上全部字段，
以 `ret: 0` 表示成功。**没有统一的错误处理约定**，各接口的事实行为（转述自官方
插件源码，不代表服务端承诺）：

| 接口                         | 事实行为                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `getupdates`                 | 非零 `ret` 或 `errcode` 视为失败；值为 `-14` 时触发限流冷却（见下文「限制」），其余按退避重试处理 |
| `sendmessage`                | 非零 `ret` 抛错；**但没有 `ret` 字段也不代表发送成功**，见「静默丢失」                            |
| `getuploadurl`               | 以是否返回非空的 `upload_full_url` 或 `upload_param` 判断成功，不检查 `ret`                       |
| `getconfig`                  | 只在 `ret === 0` 时采用返回的配置，否则沿用缓存或默认值并稍后重试                                 |
| `sendtyping`                 | 不解析响应体，不检查业务返回码                                                                    |
| `notifystart` / `notifystop` | 非零 `ret` 或请求失败只记日志，不阻断启动/停止流程                                                |

### 实测的错误响应形态（2026-10-01，对真实服务用无效凭证探测）

```jsonc
// POST /ilink/bot/getupdates、/ilink/bot/sendmessage，Authorization 为无效 token 或缺失
// HTTP 状态码 200（不是 401！）
{ "errcode": -14, "errmsg": "session timeout" }
```

```jsonc
// POST /ilink/bot/get_bot_qrcode?bot_type=3，无需任何鉴权
// HTTP 200
{ "ret": 0, "qrcode": "...", "qrcode_img_content": "https://liteapp.weixin.qq.com/q/..." }
```

**实现要点**：不要用 HTTP 状态码判断成功失败，必须解析 body 里的 `ret` /
`errcode`。

## 三、登录（扫码）

### 1. 获取二维码

```http
POST /ilink/bot/get_bot_qrcode?bot_type=3
```

请求体：

```json
{ "local_token_list": [] }
```

`local_token_list` 可以为空数组；官方插件会带上本地已保存的最近 10 个
`bot_token`，服务端据此识别"已经绑定过本端"，在扫码后直接返回
`binded_redirect`（见下）而不是发一个新会话。

响应体：

```json
{
    "ret": 0,
    "qrcode": "<二维码值，用于轮询>",
    "qrcode_img_content": "https://liteapp.weixin.qq.com/q/<...>"
}
```

`qrcode_img_content` **不是图片**，而是要编码成二维码的链接：2026-10-02 实测它返回
`text/html` 页面，官方插件用 `qrcode-terminal` 把它画在终端里。扫码确认后，持有
`qrcode` 的一方就能取得 `bot_token`，所以二维码应在本地生成，不要交给在线二维码服务，
`qrcode` 也不要写进日志。

### 2. 轮询二维码状态

```http
GET /ilink/bot/get_qrcode_status?qrcode=<编码后的 qrcode>
```

服务端要求二次验证时，追加 `&verify_code=<编码后的验证码>`（手机微信上会显示
一个数字，用户输入后由调用方回传）。建议客户端超时时间约 35 秒（服务端可能
长时间 hold 住请求，超时按"继续等待"处理，不代表失败）。

响应体：

```json
{
    "status": "confirmed",
    "bot_token": "<后续调用 Bot API 用的凭证>",
    "ilink_bot_id": "<Bot 的 ID，形如 xxx@im.bot>",
    "baseurl": "https://<后续请求使用的 API 地址>",
    "ilink_user_id": "<扫码用户的 ID，形如 xxx@im.wechat>"
}
```

`status` 状态机：

| 状态                  | 含义                                            | 处理建议                                                     |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `wait`                | 等待扫码或状态变化                              | 继续轮询                                                     |
| `scaned`              | 已扫码，等待用户在手机上确认                    | 继续轮询                                                     |
| `need_verifycode`     | 需要用户输入手机上显示的验证码                  | 提示用户输入，追加 `verify_code` 参数重新请求                |
| `verify_code_blocked` | 验证码连续输错次数过多                          | 刷新二维码后重试，设置重试上限                               |
| `scaned_but_redirect` | 需要切换到 `redirect_host` 指定的新地址继续轮询 | 更新后续请求使用的 base URL                                  |
| `confirmed`           | 登录成功                                        | 保存 `bot_token`、`baseurl`、`ilink_bot_id`、`ilink_user_id` |
| `expired`             | 二维码过期                                      | 重新获取二维码；建议限制一次登录的二维码数（如 3 个）        |
| `binded_redirect`     | 该 Bot 已绑定到当前客户端实例，无需重复登录     | 视为成功，继续使用已保存的本地凭证                           |

**建议的客户端参数**（参考官方插件行为，非官方承诺的硬限制）：二维码过期或验证码
被锁定时自动换新的二维码，一次登录最多用 3 个二维码（官方插件的
`MAX_QR_REFRESH_COUNT`）；整个登录流程设置一个总超时（官方 CLI 用 480 秒）。

二维码的有效期由服务端决定：2026-10-02 实测连续 3 个二维码都在发出约 2 分钟后
返回 `expired`，所以一次登录实际最长约 6 分钟。官方插件里的 5 分钟（`ACTIVE_LOGIN_TTL_MS`）
是它本地登录会话记录的有效期，不是二维码的有效期。

## 四、Bot API

### 接口总览

| 操作           | 方法与路径                        | 用途                                       |
| -------------- | --------------------------------- | ------------------------------------------ |
| `getupdates`   | `POST /ilink/bot/getupdates`      | 长轮询获取新消息                           |
| `sendmessage`  | `POST /ilink/bot/sendmessage`     | 发送消息                                   |
| `getuploadurl` | `POST /ilink/bot/getuploadurl`    | 获取媒体上传参数                           |
| `getconfig`    | `POST /ilink/bot/getconfig`       | 获取账号配置与 typing ticket               |
| `sendtyping`   | `POST /ilink/bot/sendtyping`      | 设置或取消"正在输入"                       |
| `notifystart`  | `POST /ilink/bot/msg/notifystart` | 通知服务端客户端已启动（用于在线状态对账） |
| `notifystop`   | `POST /ilink/bot/msg/notifystop`  | 通知服务端客户端已停止                     |

以下接口默认都携带「二、鉴权与公共字段」中的公共请求头与 `base_info`。

### `getupdates`：长轮询收消息

```http
POST /ilink/bot/getupdates
```

请求体：

```json
{
    "get_updates_buf": "",
    "base_info": { "channel_version": "2.4.9", "bot_agent": "im-bot/1.0.0" }
}
```

`get_updates_buf` 是服务端下发的游标，首次请求或需要重置时传空字符串，其余时候
原样回传上一次响应中的 `get_updates_buf`。

响应体：

```json
{
    "ret": 0,
    "msgs": [],
    "get_updates_buf": "<下次请求使用的游标>",
    "longpolling_timeout_ms": 35000
}
```

- `longpolling_timeout_ms`：服务端建议的下一次长轮询超时时间（毫秒），客户端
  应据此调整，而不是固定写死 35 秒。
- 只有响应中的 `get_updates_buf` 非空时才更新本地保存的游标；为空时沿用上一个
  游标重试。**建议把游标持久化到磁盘**，否则进程重启后只能从空游标开始，可能
  丢失离线期间的消息（取决于服务端的保留策略，未知）。
- 客户端侧的请求超时应略大于服务端的 `longpolling_timeout_ms`（官方插件默认
  用 35 秒做客户端超时，超时按"返回空结果，继续下一轮"处理，不是错误）。

### `sendmessage`：发送消息

```http
POST /ilink/bot/sendmessage
```

请求体（文本消息示例）：

```json
{
    "msg": {
        "from_user_id": "",
        "to_user_id": "<目标用户 ID，形如 xxx@im.wechat>",
        "client_id": "<客户端生成的幂等 ID>",
        "message_type": 2,
        "message_state": 2,
        "context_token": "<回复时原样回传入站消息里的 context_token>",
        "item_list": [
            { "type": 1, "text_item": { "text": "你好" } }
        ]
    },
    "base_info": { "channel_version": "2.4.9" }
}
```

- `message_type`：`1` 表示用户发送、`2` 表示 Bot 发送，回复时固定填 `2`。
- `message_state`：`0` 新消息、`1` 生成中、`2` 完成；回复时固定填 `2`
  （FINISH）——协议里虽然定义了"生成中"状态，但没有编辑已发送消息的接口，
  所谓"流式回复"目前只能靠拆成多条独立消息实现，不是真正的增量编辑。
- `context_token`：**强烈建议携带**，取自触发这次回复的入站消息。不带也可能
  被接受（服务端行为未知），但不利于服务端把消息关联到正确的会话上下文；
  其时效也直接决定了「能不能回复」，见「六、限制」。
- `item_list`：建议每次只放一项（文本和媒体分别发送两条请求），避免遇到
  服务端对多项消息的未知限制。

响应体：

```json
{ "ret": 0, "errmsg": "", "message_id": "<服务端分配的消息 ID，uint64>" }
```

**关键坑**：`ret: 0` 不代表用户一定收到了消息。社区大量实测显示，部分账号或
部分时段会出现 `ret: 0` 但响应体里**没有 `message_id`** 的情况，此时消息实际
没有被投递；`message_id` 存在才能较可靠地认为消息进入了投递流程（仍不是送达
确认）。`message_id` 是 uint64，直接 `JSON.parse` 在 JS 里可能丢精度，需要在
解析前把这类字段当字符串处理（无损解析）。

### `getuploadurl`：获取媒体上传参数

```http
POST /ilink/bot/getuploadurl
```

请求体：

```json
{
    "filekey": "<客户端生成的文件 key，建议用随机 hex 串>",
    "media_type": 1,
    "to_user_id": "<目标用户 ID>",
    "rawsize": 12345,
    "rawfilemd5": "<明文内容的 MD5，hex>",
    "filesize": 12352,
    "no_need_thumb": true,
    "aeskey": "<16 字节 AES 密钥，hex 编码>",
    "base_info": { "channel_version": "2.4.9" }
}
```

| 字段                     | 说明                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `media_type`             | `1` 图片、`2` 视频、`3` 文件、`4` 语音                                                 |
| `rawsize` / `rawfilemd5` | 明文文件的大小（字节）与 MD5                                                           |
| `filesize`               | **密文**大小，即明文经 AES-128-ECB + PKCS#7 填充后的字节数                             |
| `no_need_thumb`          | 设为 `true` 跳过缩略图上传（协议定义了缩略图相关字段，但没有证据表明有客户端真正用到） |
| `aeskey`                 | 随机生成的 16 字节 AES 密钥，hex 字符串                                                |

响应体：

```json
{
    "upload_param": "<加密的上传参数，与 filekey 一起拼接上传 URL 时使用>",
    "upload_full_url": "<可选，服务端直接给出的完整上传 URL，优先使用>"
}
```

拿到上传 URL 后，用 `Content-Type: application/octet-stream` 把 AES-128-ECB
加密后的密文 POST 过去；成功时响应头会带 `x-encrypted-param`，这就是后续
`sendmessage` 里 `media.encrypt_query_param` 的值。详细流程见「五、消息模型」
中的 CDN 媒体流程。

### `getconfig` 与 `sendtyping`："正在输入"指示器

```http
POST /ilink/bot/getconfig
```

请求体：

```json
{
    "ilink_user_id": "<目标用户 ID>",
    "context_token": "<可选>",
    "base_info": { "channel_version": "2.4.9" }
}
```

响应体：

```json
{ "ret": 0, "typing_ticket": "<base64 编码的凭证，sendtyping 要用>" }
```

`typing_ticket` 可以按用户缓存一段时间后重新获取（官方插件缓存 24 小时内随机
刷新一次），不需要每次发 typing 前都调一次 `getconfig`。

```http
POST /ilink/bot/sendtyping
```

请求体：

```json
{
    "ilink_user_id": "<目标用户 ID>",
    "typing_ticket": "<getconfig 返回的 ticket>",
    "status": 1,
    "base_info": { "channel_version": "2.4.9" }
}
```

`status`：`1` 显示"正在输入"，`2` 取消。微信客户端上的"正在输入"提示会在
几秒后自动消失，需要持续展示的话应每 5–8 秒重发一次 `status: 1`。

### `notifystart` / `notifystop`：在线状态对账

```http
POST /ilink/bot/msg/notifystart
POST /ilink/bot/msg/notifystop
```

请求体只有 `base_info`，响应体为 `{ "ret": 0, "errmsg": "" }`。客户端启动时发
`notifystart`，正常停止（卸载、禁用、进程退出）时发 `notifystop`。**这不是发给
用户的消息**，只是服务端侧的在线状态标记，不要和「上线/下线通知」功能混淆——
后者如果要做，必须走 `sendmessage` 主动发一条文本消息给用户，且受「六、限制」
中主动推送配额的约束。

## 五、消息模型

### `WeixinMessage`

```ts
interface WeixinMessage {
    seq?: number;
    message_id?: string; // uint64，无损解析为字符串
    from_user_id?: string;
    to_user_id?: string;
    client_id?: string;
    create_time_ms?: number;
    update_time_ms?: number;
    delete_time_ms?: number;
    session_id?: string;
    group_id?: string; // 类型定义里有，但协议不支持群聊，实际意义未知
    message_type?: number; // 1 用户 / 2 Bot
    message_state?: number; // 0 新消息 / 1 生成中 / 2 完成
    item_list?: MessageItem[];
    context_token?: string;
    run_id?: string;
}
```

### `MessageItem`

| `type`      | 字段                                             | 内容                                                                             |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `1`         | `text_item.text`                                 | 纯文本                                                                           |
| `2`         | `image_item`                                     | 图片，含缩略图与原图的 CDN 引用                                                  |
| `3`         | `voice_item`                                     | 语音；`voice_item.text` 可能带微信侧的转写文本；实测 `encode_type` 为 4（speex） |
| `4`         | `file_item`                                      | 文件；`file_name`、`len`（明文字节数的字符串）                                   |
| `5`         | `video_item`                                     | 视频，含缩略图                                                                   |
| `11` / `12` | `tool_call_start_item` / `tool_call_result_item` | 工具调用进度（用于向用户展示 Agent 执行中间状态，可选）                          |

每个 `MessageItem` 还可能带 `ref_msg`（引用/回复的消息），新版微信客户端的引用
可能只给出被引用消息的 `svr_id`，拿不到引用内容本身，需要客户端自行维护一份
"最近消息"的本地缓存才能还原引用上下文（官方插件用 SQLite 做了按账号、按会话
隔离的缓存，见其仓库 `docs/quote-cache_zh_CN.md`）。

### 实测的入站消息（2026-10-02，真实微信私聊）

用本插件扫码登录后收到的 5 条消息（文本、引用、语音、图片、带网址的文本）与上面的
类型定义有几处不同：

- 消息项的 `msg_id` 是 `v1:<数字>` 形式的字符串，与顶层的 `message_id`（uint64）不同。
  识别一条消息应优先用 `message_id`。
- 引用消息的 `ref_msg` 没有 `svr_id`、`title`，也没有被引用的文本，只有
  `message_item: { type: 0, msg_id: "<被引用消息的 message_id>" }`。被引用的内容只能从
  客户端自己保存的消息里找。
- 多出来的字段：消息项上有 `button_item_list`、`at_bot_username_list`（都是空数组），消息上有
  `root_id`、`parent_id`（都是 0）。`session_id` 与 `group_id` 为空字符串。
- 语音：`encode_type: 4`（speex）、`sample_rate: 16000`、`playtime` 以毫秒计，`text` 带转写文本。
- 图片：`image_item` 同时有 `aeskey`（32 位 hex）与 `media.aes_key`（base64）、
  `media.encrypt_query_param`、`media.full_url`，以及 `mid_size`、`hd_size`、缩略图尺寸。
- 5 条回复（`sendmessage`，带各自的 `context_token`）都返回了 `message_id`。

### CDN 媒体引用结构

```ts
interface CDNMedia {
    encrypt_query_param?: string; // 下载参数
    aes_key?: string; // base64 编码的 AES 密钥
    encrypt_type?: number; // 0 只加密 fileid，1 打包缩略图等信息
    full_url?: string; // 服务端直接给出的完整下载 URL，优先使用
}
```

部分消息类型（如图片）还单独带 `aeskey`（hex 字符串），应优先于
`media.aes_key` 使用。

### CDN 媒体上传流程

1. 读取明文文件，计算 `rawsize` 与 `rawfilemd5`。
2. 生成随机 16 字节 AES 密钥 `aeskey` 与随机 `filekey`。
3. 用 AES-128-ECB + PKCS#7 填充加密文件内容，得到密文与 `filesize`。
4. 调 `getuploadurl` 拿 `upload_full_url`（优先）或 `upload_param`。
5. 用 `Content-Type: application/octet-stream` 把密文 POST 到上传 URL。
6. 从响应头 `x-encrypted-param` 取下载参数，连同 `aeskey` 一起填入对应
   `MessageItem` 的 `media` 字段，再调 `sendmessage` 发出。

### CDN 媒体下载流程

1. 优先使用 `full_url`；没有则用 `encrypt_query_param` 拼接
   `<cdn_base_url>/download?encrypted_query_param=<URL 编码后的值>`。
2. `GET` 下载密文字节。
3. 取 `aeskey`（优先用条目自带的 hex 字符串形式，否则用 `media.aes_key` 的
   base64 形式解出相同的 16 字节密钥），用 AES-128-ECB + PKCS#7 填充解密。
4. 没有任何可用密钥时，把下载内容当明文直接使用（兜底，理论上不应该发生）。

**加密算法注意**：AES-128-ECB **不需要 IV**，但安全性弱于 CBC/GCM——这是微信
侧的既定协议，客户端没有选择空间；在实现时不要和企业微信智能机器人用的
AES-256-CBC（见「六」之外的企业微信文档）混淆。

## 六、限制与已知问题

本节大部分内容来自腾讯官方 `Tencent/openclaw-weixin` 仓库的 issue 区与第三方
技术文章，**不是官方承诺的参数**，不同来源的数字甚至互相矛盾，列出时会标注
来源以便区分可信度。

### 1. 不支持群聊

协议和官方插件都把聊天类型限定为一对一私聊；其他用户也无法添加你的 Bot。
`WeixinMessage.group_id` 字段存在于类型定义里，但没有已知的使用方式。

### 2. 回复条数配额

社区报告：针对同一条用户入站消息，机器人最多能连续回复约 **10 条**，第 11 条
起 `sendmessage` 返回 `ret: -2`（来源：腾讯云开发者社区文章、`openclaw-weixin`
issue #81，2026-04）。用户再发一条新消息会重置该配额。

### 3. `context_token` 时效（说法互相矛盾，**这是主动推送不可靠的根因**）

| 来源                                              | 说法                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 腾讯云开发者社区技术文章（2026-03）               | 24 小时内有效                                                                                                                |
| `openclaw-weixin` issue #309（2026-09，闭环实验） | 距用户上次互动 ≤11 小时稳定成功，≥15 小时大概率被拒（`ret: -2 prepare failed`）；机器人自己的出站消息**不会**刷新 token 时效 |
| `openclaw-weixin` issue #286（2026-09，计时实验） | 同一 token 在 Agent 回合开始后约 **1.5–2 分钟**失效：t+18s 成功、t+73s 成功、t+135s 失败                                     |

三者口径不同（有效期从 2 分钟到 24 小时），但方向一致：**超过某个时间窗口后，
不带新鲜 `context_token` 的回复会大概率失败，且没有客户端侧的解决办法**（不带
token 裸调同样被服务端拒绝）。`openclaw-weixin` issue #202（2026-06）向官方
申请放宽此限制，官方回复"已催促产品同事重新评估"，截至 2026-10 没有后续更新。

**结论：不要在这个通道上做定时提醒、上线/下线通知等不依赖用户先发消息的主动
推送功能**，大概率会在用户几小时未互动后失败。

### 4. 静默丢失：`ret: 0` 但消息未送达

多个 issue（`openclaw-weixin` #268、#280、#264，2026-08~09）报告同一现象：
`sendmessage` 返回 `ret: 0`，但响应体里**没有 `message_id`**，用户的微信客户端
实际没有收到消息，而且没有任何错误提示。观察到的规律：

- 新绑定（刚扫码）的账号更容易出现这种情况。
- 同一套代码、同一时间，换一个微信号绑定可能立刻恢复正常。
- 部分账号在静默约 3 天后"自愈"。

**实现建议**：把"`ret: 0` 且有 `message_id`"作为发送成功的判定标准（而不是只看
`ret`），没有 `message_id` 时应告警并避免无限重试刷量。

### 5. 账号与绑定

- 同一个 `bot_token` 只能绑定一个客户端实例；换绑、重新扫码、多设备同时登录
  的具体行为未经系统验证，仓库 issue #212、#252 中有相关提问但未获官方正面
  答复。
- 个人开发者能否绕开 OpenClaw、用自己的客户端直接接入 iLink：有人在
  issue #265（2026-08）详细说明了封闭内测场景并提出 6 个问题（是否需要申请、
  是否有地域/频率限制等），截至 2026-10 **没有收到官方回复**。
- 《微信 ClawBot 功能使用条款》的原文链接未找到，只在技术文章中看到转述片段
  （"仅提供信息收发，不存储输入输出内容"）。

## 七、对 im-bot 落地的技术约束

如果要在 im-bot 中实现一个与 `src/qq/` 并列的 `src/weixin/` 模块，需要注意以下
与 QQ 侧实现不同的地方：

### 1. 长轮询与内核 fetch 超时

`getupdates` 的服务端 hold 时间约 35 秒，小于思源内核 `siyuan.client.fetch`
固定的 1 分钟超时，可以直接走现有的 `/api/network/proxy` 转发（参考
`src/qq/proxy.ts` 的 `proxyFetch`），不需要额外处理。和 QQ 侧的 WebSocket 网关
（`src/qq/gateway.ts`，经 `/ws/network/proxy`）相比，iLink 不需要维护连接状态
机、心跳、重连退避，实现上更简单。

### 2. goja 运行时没有 crypto 模块

思源内核的 goja 沙箱只启用了 `url`、`buffer`、`console` 三个扩展模块
（`kernel/plugin/sandbox.go` 的 `EnableExtendModules`），**没有 `crypto` 或
`node:crypto`**。而 iLink 的媒体收发强制要求 AES-128-ECB 加解密与 MD5 校验，
这意味着：

- 需要引入或手写纯 JS 实现的 AES-128-ECB（例如移植 `aes-js` 之类的无依赖实现，
  打包进 `kernel.ts` 的产物）和 MD5。
- 生成随机 AES 密钥不能用 `crypto.getRandomValues`，只能退化为 `Math.random`
  （非 CSPRNG，对这个场景风险可接受，但要在代码注释里写清楚原因）。
- 文本收发（不涉及媒体）完全不受此限制，可以先只实现文本通道。

### 3. 现有 proxy 辅助函数只处理 JSON 文本

`src/qq/proxy.ts` 的 `proxyFetch` 假定目标的响应是 JSON（通过
`Content-Type: application/octet-stream` 判断是否为目标的真实响应，再
`response.text()` 读取），媒体上传/下载需要传输二进制。petal 的
`IRequestInit.body` 支持 `ArrayBuffer`，响应对象也有 `arrayBuffer()`，内核转发
层本身没有障碍，但 `proxyFetch` 需要扩展一个二进制版本（`request.body` 支持
`ArrayBuffer`，返回值也用 `arrayBuffer()` 而不是 `text()`）。

### 4. 配置模型

现有 `IConfig.qq` 是单通道、单凭证结构（`appid`/`secret` + 群绑定数组）。接入
第二个平台前，需要先把配置结构从"QQ 专属字段"重构为"按平台分组"，参考
`IQQBotConfig`、`IQQInboxConfig` 的现有写法新增一个 `IWeixinBotConfig`，而不是
在 `IConfig` 顶层堆叠平行字段。

### 5. 功能对照：哪些 QQ 侧功能不该照搬

| QQ 侧功能                  | 能否照搬到 iLink 通道 | 原因                                                       |
| -------------------------- | --------------------- | ---------------------------------------------------------- |
| 收集箱（消息写入思源文档） | ✅ 可以               | 被动的"收到消息就写入"场景不受配额和 token 时效影响        |
| `/openid` 式指令           | ✅ 可以               | 同上，是对入站消息的即时回复                               |
| 上线/下线通知              | ❌ 不建议             | 依赖主动推送，参考「六之 3」，大概率在用户离线数小时后失败 |
| 指令面板                   | ❌ 协议未提供         | iLink 没有类似 QQ 指令面板的接口                           |
| 群聊相关的一切功能         | ❌ 不适用             | iLink 不支持群聊                                           |

## 八、未解决的问题

实现前如果能找到更权威的来源，应优先确认以下几点：

1. 个人开发者用自研客户端（不经 OpenClaw）接入 iLink 是否被官方允许、是否需要
   申请——`openclaw-weixin` issue #265 没有得到回复。
2. `context_token` 的真实时效和回复条数上限的官方数值——目前只有互相矛盾的社区
   实测。
3. 《微信 ClawBot 功能使用条款》的原文及完整条款。
4. `bot_token` 的有效期、换绑/多设备登录的确切行为。
5. 是否存在官方的频率限制数字（issue #142 提到过 `rate limited`，但没有具体
   阈值）。

## 参考来源

- 腾讯官方仓库 [`Tencent/openclaw-weixin`](https://github.com/Tencent/openclaw-weixin)
  （npm 包 `@tencent-weixin/openclaw-weixin`）—— 本文档大部分协议字段的转述
  来源，其随附的
  [`docs/protocol_zh_CN.md`](https://github.com/Tencent/openclaw-weixin/blob/main/docs/protocol_zh_CN.md)
  是目前能找到的最接近"文档"的材料，但该文件自称仅依据客户端代码编写，不代表
  完整的服务端契约。
- 该仓库的 Issues，尤其：
  [#81](https://github.com/Tencent/openclaw-weixin/issues/81)（回复条数配额）、
  [#202](https://github.com/Tencent/openclaw-weixin/issues/202)（放宽配额的功能请求）、
  [#265](https://github.com/Tencent/openclaw-weixin/issues/265)（自研客户端接入咨询）、
  [#268](https://github.com/Tencent/openclaw-weixin/issues/268)、
  [#280](https://github.com/Tencent/openclaw-weixin/issues/280)（静默丢失排查记录）、
  [#286](https://github.com/Tencent/openclaw-weixin/issues/286)、
  [#309](https://github.com/Tencent/openclaw-weixin/issues/309)（context_token 时效实验）。
- 腾讯云开发者社区文章[《微信 ClawBot 只能接入 Claw 应用?不，看明白协议，你可以随便玩坏它》](https://cloud.tencent.com/developer/article/2646635)（社区文章，非官方）。
- 2026-10-01 对真实服务（`https://ilinkai.weixin.qq.com`）用无效凭证的现场探测（见「二、鉴权与公共字段」）。
