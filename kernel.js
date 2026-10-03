//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = /* @__PURE__ */ ((n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)))((/* @__PURE__ */ o(((e, t) => {
	var n = function(e) {
		return r(e) && !i(e);
	};
	function r(e) {
		return !!e && typeof e == "object";
	}
	function i(e) {
		var t = Object.prototype.toString.call(e);
		return t === "[object RegExp]" || t === "[object Date]" || o(e);
	}
	var a = typeof Symbol == "function" && Symbol.for ? Symbol.for("react.element") : 60103;
	function o(e) {
		return e.$$typeof === a;
	}
	function s(e) {
		return Array.isArray(e) ? [] : {};
	}
	function c(e, t) {
		return t.clone !== !1 && t.isMergeableObject(e) ? h(s(e), e, t) : e;
	}
	function l(e, t, n) {
		return e.concat(t).map(function(e) {
			return c(e, n);
		});
	}
	function u(e, t) {
		if (!t.customMerge) return h;
		var n = t.customMerge(e);
		return typeof n == "function" ? n : h;
	}
	function d(e) {
		return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(e).filter(function(t) {
			return Object.propertyIsEnumerable.call(e, t);
		}) : [];
	}
	function f(e) {
		return Object.keys(e).concat(d(e));
	}
	function p(e, t) {
		try {
			return t in e;
		} catch {
			return !1;
		}
	}
	function m(e, t) {
		return p(e, t) && !(Object.hasOwnProperty.call(e, t) && Object.propertyIsEnumerable.call(e, t));
	}
	function ee(e, t, n) {
		var r = {};
		return n.isMergeableObject(e) && f(e).forEach(function(t) {
			r[t] = c(e[t], n);
		}), f(t).forEach(function(i) {
			m(e, i) || (r[i] = p(e, i) && n.isMergeableObject(t[i]) ? u(i, n)(e[i], t[i], n) : c(t[i], n));
		}), r;
	}
	function h(e, t, r) {
		r ||= {}, r.arrayMerge = r.arrayMerge || l, r.isMergeableObject = r.isMergeableObject || n, r.cloneUnlessOtherwiseSpecified = c;
		var i = Array.isArray(t);
		return i === Array.isArray(e) ? i ? r.arrayMerge(e, t, r) : ee(e, t, r) : c(t, r);
	}
	h.all = function(e, t) {
		if (!Array.isArray(e)) throw Error("first argument should be an array");
		return e.reduce(function(e, n) {
			return h(e, n, t);
		}, {});
	}, t.exports = h;
})))(), 1);
function l(...e) {
	return c.default.all(e, { arrayMerge: (e, t, n) => t });
}
//#endregion
//#region src/configs/default.ts
var u = {
	qq: {
		appid: "",
		secret: "",
		online: !1,
		intents: {
			GUILDS: !1,
			GUILD_MEMBERS: !1,
			GUILD_MESSAGES: !1,
			GUILD_MESSAGE_REACTIONS: !1,
			DIRECT_MESSAGE: !1,
			GROUP_AND_C2C_EVENT: !0,
			INTERACTION: !1,
			MESSAGE_AUDIT: !1,
			FORUMS_EVENT: !1,
			AUDIO_ACTION: !1,
			PUBLIC_GUILD_MESSAGES: !0
		},
		eventLog: !0,
		device: "",
		inbox: {
			bindings: [],
			downloadAssets: !0
		},
		panels: {
			c2c: {
				scope: "c2c",
				target_type: "all",
				panel: {
					items: [{
						type: "command",
						name: "openid",
						desc: "查询当前用户的 OpenID"
					}],
					remark: "siyuan-plugin-im-bot-c2c"
				}
			},
			group: {
				scope: "group",
				target_type: "all",
				panel: {
					items: [{
						type: "command",
						name: "openid",
						desc: "查询当前用户与群组的 OpenID",
						only_admin: !0
					}],
					remark: "siyuan-plugin-im-bot-group"
				}
			}
		}
	},
	weixin: {
		online: !1,
		eventLog: !0,
		inbox: {
			doc: "",
			enabled: !0,
			reply: !1,
			downloadAssets: !0
		}
	},
	telegram: {
		token: "",
		apiBaseUrl: "",
		online: !1,
		eventLog: !0,
		device: "",
		inbox: {
			bindings: [],
			downloadAssets: !0
		}
	}
}, d = {
	group: "",
	doc: "",
	enabled: !0,
	reply: !1,
	notify: !1
}, f = {
	chat: "",
	doc: "",
	enabled: !0,
	reply: !1,
	notify: !1
};
function p(...e) {
	let t = l(u, ...e);
	return t.qq.inbox.bindings = t.qq.inbox.bindings.map((e) => ({
		...d,
		...e
	})), t.telegram.inbox.bindings = t.telegram.inbox.bindings.map((e) => ({
		...f,
		...e
	})), t;
}
//#endregion
//#region src/constants.ts
var m = {
	GLOBAL_CONFIG_NAME: "config.json",
	USERS_FILE_NAME: "users.json",
	WEIXIN_ACCOUNT_FILE_NAME: "weixin.json",
	KERNEL_RPC_METHOD: {
		UPDATE_CONFIG: "update-config",
		CALL_QQ_API: "call-qq-api",
		GET_USERS: "get-users",
		QQ_GET_STATE: "qq-get-state",
		WEIXIN_GET_ACCOUNT: "weixin-get-account",
		WEIXIN_LOGIN_START: "weixin-login-start",
		WEIXIN_LOGIN_STATE: "weixin-login-state",
		WEIXIN_LOGIN_VERIFY: "weixin-login-verify",
		WEIXIN_LOGIN_CANCEL: "weixin-login-cancel",
		WEIXIN_LOGOUT: "weixin-logout",
		TELEGRAM_GET_STATE: "telegram-get-state"
	}
}, ee = "https://api.bot.qq.com/app/getAppAccessToken", h = "https://api.bot.qq.com", te = 45e3, ne = 1e3, re = 6e4, ie = /* @__PURE__ */ new Set([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
]), g = /* @__PURE__ */ function(e) {
	return e[e.DISPATCH = 0] = "DISPATCH", e[e.HEARTBEAT = 1] = "HEARTBEAT", e[e.IDENTIFY = 2] = "IDENTIFY", e[e.RESUME = 6] = "RESUME", e[e.RECONNECT = 7] = "RECONNECT", e[e.INVALID_SESSION = 9] = "INVALID_SESSION", e[e.HELLO = 10] = "HELLO", e[e.HEARTBEAT_ACK = 11] = "HEARTBEAT_ACK", e;
}({}), ae = /* @__PURE__ */ function(e) {
	return e[e.NORMAL = 0] = "NORMAL", e[e.ARK = 3] = "ARK", e[e.CHAT_RECORD = 102] = "CHAT_RECORD", e[e.REFERENCE = 103] = "REFERENCE", e;
}({}), oe = { OPENID: "openid" }, se = /* @__PURE__ */ new Set(["GROUP_AT_MESSAGE_CREATE", "GROUP_MESSAGE_CREATE"]), ce = {
	GUILDS: 1,
	GUILD_MEMBERS: 2,
	GUILD_MESSAGES: 512,
	GUILD_MESSAGE_REACTIONS: 1024,
	DIRECT_MESSAGE: 4096,
	GROUP_AND_C2C_EVENT: 1 << 25,
	INTERACTION: 1 << 26,
	MESSAGE_AUDIT: 1 << 27,
	FORUMS_EVENT: 1 << 28,
	AUDIO_ACTION: 1 << 29,
	PUBLIC_GUILD_MESSAGES: 1 << 30
}, le = /* @__PURE__ */ new Map([
	[4001, "invalid opcode"],
	[4002, "invalid payload"],
	[4010, "invalid shard"],
	[4011, "too many guilds, sharding required"],
	[4012, "invalid version"],
	[4013, "invalid intent"],
	[4014, "intent not permitted"],
	[4914, "bot is offline, only the sandbox environment is allowed"],
	[4915, "bot is banned"]
]), ue = /* @__PURE__ */ new Set([
	4006,
	4007,
	...Array.from({ length: 14 }, (e, t) => 4900 + t)
]);
//#endregion
//#region src/utils/kramdown.ts
function _(e) {
	return e.replace(/[\\`*_{}[\]()#+\-.!|~=^$<>:&"]/g, "\\$&").replace(/\r\n?|\n/g, "<br>");
}
function de(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\r\n?|\n/g, "_esc_newline_").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}
function fe(e) {
	let t = Object.entries(e).filter((e) => !!e[1]).map(([e, t]) => `${e}="${de(t)}"`);
	return t.length > 0 ? `{: ${t.join(" ")}}` : "";
}
function v(e, t = {}) {
	let n = e.filter(Boolean);
	return n.length === 0 ? "" : [
		"{{{row",
		n.join("\n\n"),
		"}}}",
		fe(t)
	].filter(Boolean).join("\n");
}
function y(e) {
	return e.replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, "");
}
function b(e) {
	return e.filter(Boolean).join("\n\n").split("\n").map((e) => e ? `> ${e}` : ">").join("\n");
}
function pe(e) {
	return e.replace(/[\s<>]/g, (e) => encodeURIComponent(e)).replace(/\(/g, "%28").replace(/\)/g, "%29");
}
function x(e, t = "") {
	return `![${t.replace(/[[\]\\\r\n]/g, "")}](${pe(e)})`;
}
function S(e, t) {
	return `[${e}](${pe(t)})`;
}
function C(e, t) {
	return S(_(e), t);
}
var me = /[.,;:!?'*]+$/, he = /https?:\/\/[\w\-.~:/?#[\]@!&'()*+,;=%$]+/g;
function ge(e, t) {
	return e.split(t).length - 1;
}
function _e(e) {
	let t = e.replace(me, "");
	for (; t.endsWith(")") && ge(t, ")") > ge(t, "(");) t = t.slice(0, -1).replace(me, "");
	return t;
}
function ve(e, t = _) {
	let n = "", r = 0;
	for (let i of e.matchAll(he)) {
		let a = _e(i[0]);
		n += t(e.slice(r, i.index)) + S(t(a), a), r = i.index + a.length;
	}
	return n + t(e.slice(r));
}
var ye = /[*_~`#[\]$^]|==|\(\(|:[\w+-]+:/;
function be(e) {
	return ye.test(e) ? _(e) : `<u>${e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\/g, "&#92;")}</u>`;
}
function xe(e) {
	let t = Math.max(0, ...Array.from(e.matchAll(/`+/g), (e) => e[0].length)), n = "`".repeat(t + 1), r = /^`|`$/.test(e) || e.startsWith(" ") && e.endsWith(" ") && e.trim() !== "" ? " " : "";
	return `${n}${r}${e}${r}${n}`;
}
function Se(e, t = "") {
	let n = Math.max(2, ...Array.from(e.matchAll(/`+/g), (e) => e[0].length)), r = "`".repeat(n + 1), i = e.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n").map((e) => e.replace(/^\s*(?=\}\}\}\s*$)/, (e) => `${e}\u200D`));
	return [
		`${r}${t.replace(/[^\w#+.-]/g, "")}`,
		...i,
		r
	].join("\n");
}
function Ce(e) {
	return `<audio controls="controls" src="${e.replace(/"/g, "%22")}"></audio>`;
}
function w(e) {
	return `<video controls="controls" src="${e.replace(/"/g, "%22")}"></video>`;
}
function we(e) {
	return `<kbd>${e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</kbd>`;
}
function Te(e, t) {
	let n = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return `<span data-type="inline-memo" data-inline-memo-content="${n(t).replace(/"/g, "&quot;")}">${n(e)}</span>`;
}
function Ee(e, t) {
	return `((${e} '${t.replace(/\s+/g, " ").trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/\\/g, "&#92;")}'))`;
}
//#endregion
//#region src/qq/chat-record.ts
var De = /^\[.+\]$/, Oe = /^=== 消息 \d+ ===$/, ke = /^--- 第\d+条 ---$/, Ae = /^\[(消息内容|发送者|消息类型|关联消息|附件\d+)\] ?(.*)$/, je = 4;
function Me() {
	return {
		content: [],
		attachments: [],
		related: []
	};
}
function Ne(e, t) {
	for (let n = e.length - 1; n >= 0; n--) if (e[n].indent === t) return n;
	return -1;
}
function Pe(e) {
	return {
		type: /(?:^| )类型:(\S+)/.exec(e)?.[1],
		filename: /(?:^| )文件名:(\S+)/.exec(e)?.[1],
		url: /(?:^| )URL:(\S+)/.exec(e)?.[1]
	};
}
function Fe(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = t.findIndex((e) => e.trim() !== "");
	if (n < 0 || !De.test(t[n].trim())) return;
	let r = [], i = [], a;
	for (let e of t.slice(n + 1)) {
		let t = e.trim();
		if (!t) continue;
		let n = e.length - e.trimStart().length;
		if (n === 0 && Oe.test(t)) {
			let e = Me();
			r.push(e), i = [{
				message: e,
				indent: 0
			}], a = void 0;
			continue;
		}
		if (ke.test(t)) {
			let e = Ne(i, n);
			if (e < 0) return;
			let t = Me();
			i[e].message.related.push(t), i = [...i.slice(0, e + 1), {
				message: t,
				indent: n + je
			}], a = void 0;
			continue;
		}
		let o = Ae.exec(t);
		if (o) {
			let e = Ne(i, n);
			if (e < 0) return;
			i = i.slice(0, e + 1);
			let t = i[e], [, r, s = ""] = o;
			switch (a = void 0, r) {
				case "消息内容":
					t.message.content.push(s), a = t;
					break;
				case "发送者":
					t.message.sender = s;
					break;
				case "消息类型":
					t.message.type = s;
					break;
				case "关联消息": break;
				default: t.message.attachments.push(Pe(s));
			}
			continue;
		}
		if (!a || n < a.indent) return;
		a.message.content.push(e.slice(a.indent));
	}
	return r.length > 0 ? r : void 0;
}
//#endregion
//#region src/qq/message.ts
var T = /<@all>|<@!?(\w+)>|<faceType=\d+,faceId="[^"]*",ext="([^"]*)">|(https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+)/g, Ie = /^\[.+的聊天记录\]$/, Le = 32;
function E(e, t) {
	let n = `${t}=`;
	return e.message_scene?.ext?.find((e) => e.startsWith(n))?.slice(n.length);
}
function Re(e, t) {
	let n = t.mentions ?? [];
	return n.some((e) => e.scope === "all") || (t.content ?? "").includes("<@all>") ? !1 : e === "GROUP_AT_MESSAGE_CREATE" || n.some((e) => e.is_you === !0);
}
function ze(e) {
	try {
		let t = JSON.parse(Buffer.from(e, "base64").toString("utf8"));
		return t.text ? `[${t.text}]` : "";
	} catch {
		return "";
	}
}
function Be(e, t) {
	return `@${(e ? t?.find((t) => t.id === e || t.member_openid === e) : t?.find((e) => e.scope === "all"))?.username || e || "all"}`;
}
function Ve(e, t, n, r, i) {
	let a = "", o = 0;
	T.lastIndex = 0;
	for (let s = T.exec(e); s; s = T.exec(e)) {
		let [c, l, u, d] = s;
		if (a += n(e.slice(o, s.index)), o = s.index + c.length, d) {
			let e = _e(d);
			a += r(e) + n(d.slice(e.length));
		} else a += u === void 0 ? i(Be(l, t)) : n(ze(u));
	}
	return a + n(e.slice(o));
}
function He(e, t) {
	return Ve(e, t, _, (e) => C(e, e), we);
}
function Ue(e, t) {
	let n = (e) => e, r = Ve(e, t, n, n, n).replace(/\s+/g, " ").trim();
	return r.length > Le ? `${r.slice(0, Le)}...` : r;
}
function D(e) {
	let t = e.content_type;
	return t.startsWith("image/") ? {
		kind: "image",
		url: e.url,
		name: e.filename
	} : t.startsWith("video/") ? {
		kind: "video",
		url: e.url,
		name: e.filename
	} : t === "voice" ? {
		kind: "voice",
		url: e.voice_wav_url || e.url,
		name: e.filename,
		asr: e.asr_refer_text
	} : {
		kind: "file",
		url: e.url,
		name: e.filename
	};
}
function O(e, t, n, r) {
	e.media += r.length;
	let i = [y(r.filter((e) => e.kind === "image").map((e) => x(e.url, e.name)).join("") + He(t, n))];
	for (let e of r) switch (e.kind) {
		case "voice":
			i.push(Ce(e.url)), e.asr && i.push(y(_(e.asr)));
			break;
		case "video":
			i.push(w(e.url));
			break;
		case "file": i.push(y(C(e.name || e.url, e.url)));
	}
	return i.filter(Boolean);
}
function We(e, t, n) {
	let r = E(t, "ref_msg_idx"), i = t.msg_elements?.find((e) => e.msg_idx === r) ?? t.msg_elements?.[0], a = (t.attachments ?? []).map(D);
	if (n) return [b([Ee(n, Ue(i?.content ?? "", t.mentions) || e.labels.quote)]), ...O(e, t.content.trim(), t.mentions, a)];
	let o = i ? O(e, i.content ?? "", t.mentions, (i.attachments ?? []).map(D)) : [];
	return [b(o.length > 0 ? o : [_(e.labels.quote)]), ...O(e, t.content.trim(), t.mentions, a)];
}
function Ge(e, t) {
	let n = [...O(e, t.related.length > 0 && t.content.length === 1 && Ie.test(t.content[0]) ? "" : t.content.join("\n"), void 0, t.attachments.filter((e) => e.url).map((e) => ({
		kind: e.type === "图片" ? "image" : e.type === "视频" ? "video" : "file",
		url: e.url,
		name: e.filename
	}))), ...t.related.map((t) => Ge(e, t))].filter(Boolean);
	return v(n.length > 0 ? n : [_(e.labels.unavailable)], { "custom-author-username": t.sender });
}
function Ke(e, t) {
	let n = {
		labels: t.labels,
		media: 0
	}, r;
	switch (e.message_type) {
		case ae.CHAT_RECORD: {
			let t = Fe(e.content);
			r = t ? t.map((e) => Ge(n, e)) : O(n, e.content, e.mentions, (e.attachments ?? []).map(D));
			break;
		}
		case ae.REFERENCE:
			r = We(n, e, t.reference);
			break;
		default: r = O(n, e.content, e.mentions, (e.attachments ?? []).map(D));
	}
	return {
		kramdown: v(r.length > 0 ? r : [_(t.labels.unavailable)], {
			"custom-event-id": t.eventId,
			"custom-author-id": e.author?.id,
			"custom-author-username": e.author?.username,
			"custom-msg-idx": E(e, "msg_idx")
		}),
		media: n.media
	};
}
//#endregion
//#region src/utils/proxy.ts
var qe = 1e4, Je = "siyuan-proxy-";
function k(e) {
	try {
		return JSON.parse(e);
	} catch {
		return;
	}
}
function Ye(e) {
	return Buffer.from(e, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Xe(e, t) {
	let n = t.headers ? `&h=${Ye(JSON.stringify(t.headers))}` : "";
	return e.client.fetch(`/api/network/proxy?u=${Ye(t.url)}&t=${qe}ms${n}`, t.json === void 0 ? { method: t.method } : {
		method: t.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t.json)
	});
}
function Ze(e, t, n) {
	if (!t.headers["Content-Type"]?.startsWith("application/octet-stream")) {
		let r = n(), i = k(r);
		throw Error(`proxy ${e.method} ${e.url} failed: ${t.status} ${i?.msg ?? r}`);
	}
	let r = {};
	for (let [e, n] of Object.entries(t.headers)) e.toLowerCase().startsWith(Je) && (r[e.slice(13)] = n);
	return r;
}
async function A(e, t) {
	let n = await Xe(e, t), r = await n.text();
	return {
		status: n.status,
		headers: Ze(t, n, () => r),
		body: r
	};
}
async function Qe(e, t) {
	let n = await Xe(e, t), r = await n.arrayBuffer();
	return {
		status: n.status,
		headers: Ze(t, n, () => Buffer.from(r).toString("utf8")),
		body: r
	};
}
//#endregion
//#region src/qq/openapi.ts
var $e = class extends Error {};
function et(e, t, n) {
	if (typeof e != "string" || !e.startsWith("/")) throw TypeError(`url must be a path starting with "/", got ${JSON.stringify(e)}`);
	let r = typeof t == "string" ? t.toUpperCase() : "";
	if (!ie.has(r)) throw TypeError(`method must be one of ${[...ie].join(", ")}, got ${JSON.stringify(t)}`);
	return {
		url: e,
		method: r,
		body: n ?? void 0
	};
}
function j(e) {
	let t = e.appid.trim(), n = e.secret.trim();
	return t && n ? {
		appid: t,
		secret: n
	} : void 0;
}
function tt(e) {
	if (!e) return null;
	let t = k(e);
	return t === void 0 ? e : t;
}
var nt = class {
	siyuan;
	token;
	tokenRequest;
	constructor(e) {
		this.siyuan = e;
	}
	async accessToken(e) {
		let { appid: t, secret: n } = e, r = this.token;
		if (r?.appid === t && r.secret === n && Date.now() < r.expires - 6e4) return r.value;
		let i = this.tokenRequest;
		if (i?.appid === t && i.secret === n) return i.promise;
		let a = this.fetchAccessToken(t, n);
		this.tokenRequest = {
			appid: t,
			secret: n,
			promise: a
		};
		try {
			return await a;
		} finally {
			this.tokenRequest?.promise === a && (this.tokenRequest = void 0);
		}
	}
	async request(e, t) {
		let n = await this.accessToken(e), r = await A(this.siyuan, {
			url: `${h}${t.url}`,
			method: t.method,
			headers: { Authorization: [`QQBot ${n}`] },
			json: t.body
		});
		return r.status === 401 && this.token?.value === n && (this.token = void 0), {
			status: r.status,
			headers: r.headers,
			body: tt(r.body)
		};
	}
	async fetchAccessToken(e, t) {
		let n = await A(this.siyuan, {
			url: ee,
			method: "POST",
			json: {
				appId: e,
				clientSecret: t
			}
		}), r = k(n.body);
		if (r?.access_token) {
			let n = Number(r.expires_in);
			return this.token = {
				appid: e,
				secret: t,
				value: r.access_token,
				expires: Date.now() + (Number.isFinite(n) ? n * 1e3 : 0)
			}, r.access_token;
		}
		let i = `get access token failed: ${n.status} ${n.body}`;
		throw n.status === 429 || n.status >= 500 || r?.code === 100001 ? Error(i) : new $e(`${i}, check QQ_BOT_APPID and QQ_BOT_SECRET`);
	}
}, rt = /^\/(\S+)/, it = "owner", at = /<@!?(\w+)>/g, ot = 1024;
function st(e) {
	return e instanceof Error ? e.message : String(e);
}
function ct(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.mentions ?? []) if (n.is_you) for (let e of [n.id, n.member_openid]) e && t.add(e);
	return (e.content ?? "").replace(at, (e, n) => t.has(n) ? "" : e);
}
var lt = class {
	siyuan;
	openapi;
	config;
	answered = /* @__PURE__ */ new Set();
	constructor(e, t, n) {
		this.siyuan = e, this.openapi = t, this.config = n;
	}
	handle(e) {
		let t, n, r;
		if (e.t === "C2C_MESSAGE_CREATE") {
			t = e.d;
			let i = t.author?.user_openid || t.author?.id;
			if (!i) return;
			n = t.content ?? "", r = {
				path: `/v2/users/${encodeURIComponent(i)}/messages`,
				user: i
			};
		} else if (e.t && se.has(e.t)) {
			let i = e.d, a = i.author?.member_openid || i.author?.id;
			if (!a || !i.group_openid || !Re(e.t, i)) return;
			t = i, n = ct(i), r = {
				path: `/v2/groups/${encodeURIComponent(i.group_openid)}/messages`,
				user: a,
				group: i.group_openid
			};
		} else return;
		let i = rt.exec(n.trim())?.[1];
		if (i !== oe.OPENID || this.isAnswered(t)) return;
		let a = t.author?.member_role;
		if (r.group && a !== it) {
			this.siyuan.logger.info(`[qq] [commands] ignore /${i} from ${r.user} in group ${r.group}: only the group owner can send commands, and the member_role is ${a || "empty"}`);
			return;
		}
		this.remember(t), this.siyuan.logger.info(`[qq] [commands] /${i} from ${r.user}${r.group ? ` in group ${r.group}` : ""}`), this.reply(t, r, this.openIdText(r));
	}
	keys(e) {
		let t = E(e, "msg_idx");
		return [`id:${e.id}`, ...t ? [`idx:${t}`] : []];
	}
	isAnswered(e) {
		return this.keys(e).some((e) => this.answered.has(e)) ? (this.siyuan.logger.debug(`[qq] [commands] the message ${e.id} is already answered, skip it`), !0) : !1;
	}
	remember(e) {
		for (let t of this.keys(e)) this.answered.add(t);
		for (; this.answered.size > ot * 2;) this.answered.delete(this.answered.values().next().value);
	}
	openIdText(e) {
		let t = this.openIdLabels(), n = [t.user.replaceAll("{{1}}", e.user)];
		return e.group && n.push(t.group.replaceAll("{{1}}", e.group)), n.join("\n");
	}
	async reply(e, t, n) {
		let r = j(this.config());
		if (r) try {
			let i = await this.openapi.request(r, {
				url: t.path,
				method: "POST",
				body: {
					msg_type: 0,
					content: n,
					msg_id: e.id,
					msg_seq: 1
				}
			});
			if (i.status < 200 || i.status >= 300) throw Error(`${i.status} ${JSON.stringify(i.body)}`);
		} catch (t) {
			this.siyuan.logger.warn(`[qq] [commands] reply to the message ${e.id} failed:`, st(t));
		}
	}
	openIdLabels() {
		let e = this.siyuan.plugin.i18n?.commands?.openid;
		return {
			user: e?.user || "User OpenID: {{1}}",
			group: e?.group || "Group OpenID: {{1}}"
		};
	}
}, ut = "logs/events";
function dt(e) {
	return e.replace(/[^\w-]/g, "_");
}
function ft(e) {
	let t = e.t, n = `${t}:`, r = e.id?.startsWith(n) ? e.id.slice(n.length) : e.id;
	if (t && r) return `${ut}/${dt(t)}/${dt(r)}.json`;
}
//#endregion
//#region src/qq/intents.ts
function pt(e) {
	let t = 0;
	for (let [n, r] of Object.entries(ce)) e[n] === !0 && (t |= r);
	return t;
}
function mt(e) {
	return `${Object.entries(ce).filter(([, t]) => e & t).map(([e]) => e).join("|")} (${e})`;
}
//#endregion
//#region src/qq/gateway.ts
function ht(e) {
	return e instanceof Error ? e.message : String(e);
}
var gt = class {
	siyuan;
	openapi;
	onDispatch;
	options;
	socket;
	connection = 0;
	token = "";
	sessionId = "";
	seq = 0;
	heartbeatInterval = te;
	heartbeatTimer;
	heartbeatAcked = !0;
	reconnectTimer;
	reconnectAttempts = 0;
	current = { status: "stopped" };
	username = "";
	constructor(e, t, n) {
		this.siyuan = e, this.openapi = t, this.onDispatch = n;
	}
	get state() {
		return { ...this.current };
	}
	async update(e) {
		let t = this.resolveOptions(e);
		if (!(typeof t == "object" && this.options && t.appid === this.options.appid && t.secret === this.options.secret && t.intents === this.options.intents)) {
			if (await this.stop(), typeof t == "string") {
				this.setState(t);
				return;
			}
			this.options = t, this.siyuan.logger.info(`[qq] connecting, intents: ${mt(t.intents)}`), this.connect();
		}
	}
	async stop() {
		this.options = void 0, this.clearReconnect(), this.resetSession(), this.setState("stopped"), await this.detach(1e3, "stop");
	}
	resolveOptions(e) {
		let t = e.appid.trim(), n = e.secret.trim();
		if (!t || !n) return this.siyuan.logger.info("[qq] QQ_BOT_APPID or QQ_BOT_SECRET is not configured, skip connecting"), "unconfigured";
		let r = pt(e.intents);
		return r === 0 ? (this.siyuan.logger.warn("[qq] no event is subscribed in QQ_BOT_INTENTS, skip connecting"), "no-intents") : {
			appid: t,
			secret: n,
			intents: r
		};
	}
	async connect() {
		let e = this.options;
		if (!e) return;
		let t = ++this.connection;
		this.setState("connecting");
		try {
			let n = await this.openapi.accessToken(e), r = await this.fetchGateway(e);
			if (t !== this.connection) return;
			this.token = n;
			let i = r.session_start_limit;
			if (this.siyuan.logger.debug(`[qq] gateway: ${r.url}, session start limit: ${JSON.stringify(i)}`), !this.sessionId && i && i.remaining <= 0) {
				this.siyuan.logger.warn(`[qq] no session starts remaining, retry in ${i.reset_after} ms`), this.scheduleReconnect("no session starts remaining", i.reset_after);
				return;
			}
			let a = await this.siyuan.client.socket(`/ws/network/proxy?u=${Ye(r.url)}`);
			if (t !== this.connection) {
				a.close().catch(() => {});
				return;
			}
			this.socket = a, a.onmessage = (e) => this.onMessage(t, e), a.onclose = (e) => this.onDisconnect(t, `closed ${e.code} ${e.reason}`, e.code), a.onerror = (e) => {
				setTimeout(() => this.onDisconnect(t, `error ${ht(e.error)}`), 0);
			}, await a.open();
		} catch (e) {
			if (t !== this.connection) return;
			if (e instanceof $e) {
				this.siyuan.logger.error(`[qq] ${e.message}, stop connecting`), this.options = void 0, this.setState("failed", { error: e.message });
				return;
			}
			this.onDisconnect(t, `connect failed: ${ht(e)}`);
		}
	}
	onMessage(e, t) {
		if (e !== this.connection || typeof t.data != "string") return;
		let n;
		try {
			n = JSON.parse(t.data);
		} catch {
			this.siyuan.logger.warn(`[qq] invalid payload: ${t.data}`);
			return;
		}
		switch (n.op) {
			case g.HELLO:
				this.heartbeatInterval = n.d?.heartbeat_interval || 45e3, this.siyuan.logger.debug(`[qq] hello, heartbeat interval: ${this.heartbeatInterval} ms`), this.sessionId ? this.resume(e) : this.identify(e);
				break;
			case g.DISPATCH:
				if (typeof n.s == "number" && (this.seq = n.s), n.t === "READY") {
					let t = n.d;
					this.sessionId = t.session_id, this.username = t.user?.username ?? "", this.onSessionReady(e);
				} else n.t === "RESUMED" && this.onSessionReady(e);
				this.onDispatch(n);
				break;
			case g.HEARTBEAT:
				this.sendHeartbeat(e);
				break;
			case g.HEARTBEAT_ACK:
				this.heartbeatAcked = !0, this.siyuan.logger.trace("[qq] heartbeat ACK");
				break;
			case g.RECONNECT:
				this.onDisconnect(e, "the gateway requests a reconnect");
				break;
			case g.INVALID_SESSION:
				this.resetSession(), this.onDisconnect(e, "invalid session");
				break;
			default: this.siyuan.logger.debug(`[qq] unhandled payload: ${t.data}`);
		}
	}
	onSessionReady(e) {
		this.reconnectAttempts = 0, this.setState("connected", this.username ? { username: this.username } : {}), this.stopHeartbeat(), this.sendHeartbeat(e), this.heartbeatTimer = setInterval(() => {
			if (!this.heartbeatAcked) {
				this.onDisconnect(e, "no heartbeat ACK within the heartbeat interval");
				return;
			}
			this.sendHeartbeat(e);
		}, this.heartbeatInterval);
	}
	onDisconnect(e, t, n) {
		if (e === this.connection) {
			if (this.detach(4e3, "reconnect"), n !== void 0 && le.has(n)) {
				this.siyuan.logger.error(`[qq] disconnected (${t}): ${le.get(n)}, stop reconnecting`), this.options = void 0, this.resetSession(), this.setState("failed", { error: `${le.get(n)} (${t})` });
				return;
			}
			n !== void 0 && ue.has(n) && this.resetSession(), this.siyuan.logger.warn(`[qq] disconnected (${t}), will ${this.sessionId ? "resume" : "identify"}`), this.scheduleReconnect(t);
		}
	}
	async detach(e, t) {
		this.connection++, this.stopHeartbeat();
		let n = this.socket;
		this.socket = void 0, await n?.close(e, t).catch(() => {});
	}
	scheduleReconnect(e, t = this.nextReconnectDelay()) {
		this.options && (this.clearReconnect(), this.setState("reconnecting", {
			error: e,
			retryAt: new Date(Date.now() + t).toISOString()
		}), this.siyuan.logger.info(`[qq] reconnect in ${t} ms`), this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = void 0, this.connect();
		}, t));
	}
	nextReconnectDelay() {
		let e = Math.min(ne * 2 ** this.reconnectAttempts, re);
		return this.reconnectAttempts++, e;
	}
	clearReconnect() {
		this.reconnectTimer !== void 0 && (clearTimeout(this.reconnectTimer), this.reconnectTimer = void 0);
	}
	resetSession() {
		this.sessionId = "", this.seq = 0;
	}
	setState(e, t = {}) {
		this.current = {
			status: e,
			since: (/* @__PURE__ */ new Date()).toISOString(),
			...t
		};
	}
	identify(e) {
		this.send(e, {
			op: g.IDENTIFY,
			d: {
				token: `QQBot ${this.token}`,
				intents: this.options?.intents,
				shard: [0, 1]
			}
		});
	}
	resume(e) {
		this.send(e, {
			op: g.RESUME,
			d: {
				token: `QQBot ${this.token}`,
				session_id: this.sessionId,
				seq: this.seq
			}
		});
	}
	sendHeartbeat(e) {
		this.heartbeatAcked = !1, this.siyuan.logger.trace(`[qq] heartbeat, seq: ${this.seq}`), this.send(e, {
			op: g.HEARTBEAT,
			d: this.seq || null
		});
	}
	stopHeartbeat() {
		this.heartbeatTimer !== void 0 && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = void 0);
	}
	async send(e, t) {
		let n = this.socket;
		if (e === this.connection && n) try {
			await n.send(JSON.stringify(t));
		} catch (e) {
			this.siyuan.logger.warn(`[qq] send op ${t.op} failed: ${ht(e)}`);
		}
	}
	async fetchGateway(e) {
		let t = await this.openapi.request(e, {
			url: "/gateway/bot",
			method: "GET"
		}), n = t.body;
		if (typeof n == "object" && n?.url) return n;
		throw Error(`get gateway failed: ${t.status} ${JSON.stringify(n)}`);
	}
}, M = ".temp", _t = /^\d{14}-[0-9a-z]{7}$/, vt = 1024, yt = 2e3, bt = 18e5, xt = ["custom-event-id", "custom-msg-id"];
function St(e) {
	return new Promise((t) => setTimeout(t, e));
}
function N(e) {
	return e instanceof Error ? e.message : String(e);
}
function Ct(e) {
	let t = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0");
	return `${e.getFullYear()}-${t}-${n}`;
}
function wt(e) {
	let t = new Date(e ?? NaN);
	return Ct(Number.isNaN(t.getTime()) ? /* @__PURE__ */ new Date() : t);
}
function Tt(e) {
	return `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}`;
}
var Et = class {
	siyuan;
	downloadAssetsEnabled;
	queue = Promise.resolve();
	messages = /* @__PURE__ */ new Map();
	children = /* @__PURE__ */ new Map();
	recovered = /* @__PURE__ */ new Set();
	constructor(e, t) {
		this.siyuan = e, this.downloadAssetsEnabled = t;
	}
	enqueue(e) {
		this.queue = this.queue.then(e).catch((e) => {
			this.siyuan.logger.warn("[inbox] an inbox task failed:", N(e));
		});
	}
	async prepare(e) {
		if (!_t.test(e)) throw Error(`invalid document ID ${e}`);
		await this.waitForSync(await this.childDoc(e, M)), await this.recover(e);
	}
	async findMessage(e, t, n) {
		let r = this.messages.get(`${e} ${t} ${n}`);
		if (r) return r;
		let i = (e) => e.replace(/'/g, "''");
		return (await this.request("/api/query/sql", { stmt: `SELECT block_id FROM attributes WHERE name = '${i(t)}' AND value = '${i(n)}' AND path LIKE '%/${e}/%' LIMIT 1` }))[0]?.block_id;
	}
	async blockText(e) {
		return (await this.request("/api/query/sql", { stmt: `SELECT content FROM blocks WHERE id = '${e.replace(/'/g, "''")}' LIMIT 1` }))[0]?.content?.trim() ?? "";
	}
	remember(e, t, n, r) {
		this.messages.set(`${e} ${t} ${n}`, r), this.messages.size > vt && this.messages.delete(this.messages.keys().next().value);
	}
	async appendToTemp(e, t) {
		let n = await this.childDoc(e, M);
		try {
			return {
				block: await this.append(n, t),
				temp: n
			};
		} catch (r) {
			this.siyuan.logger.debug(`[inbox] append to ${n} failed, retry after refreshing the documents:`, N(r)), this.children.clear();
			let i = await this.childDoc(e, M);
			return {
				block: await this.append(i, t),
				temp: i
			};
		}
	}
	async downloadAssets(e) {
		try {
			await this.request("/api/format/netAssets2LocalAssets", { id: e });
			return;
		} catch (t) {
			this.siyuan.logger.warn(`[inbox] download the assets of ${e} failed, wait for the kernel to finish:`, N(t));
		}
		await this.waitForSync(e);
	}
	async updateBlock(e, t) {
		await this.request("/api/block/updateBlock", {
			id: e,
			dataType: "markdown",
			data: t
		});
	}
	async moveToDate(e, t, n) {
		try {
			await this.moveToEnd(t, await this.dateDoc(e, n));
		} catch (r) {
			this.siyuan.logger.debug(`[inbox] move ${t} failed, retry after refreshing the documents:`, N(r)), this.children.clear(), await this.moveToEnd(t, await this.dateDoc(e, n));
		}
	}
	async locate(e) {
		let { notebook: t, path: n } = await this.request("/api/filetree/getPathByID", { id: e });
		if (!n.endsWith(`/${e}.sy`)) throw Error(`${e} is not a document`);
		return {
			box: t,
			path: n,
			hpath: await this.request("/api/filetree/getHPathByID", { id: e })
		};
	}
	async childDoc(e, t) {
		let n = `${e} ${t}`, r = this.children.get(n);
		if (r) return r;
		let i = await this.locate(e), { files: a } = await this.request("/api/filetree/listDocsByPath", {
			notebook: i.box,
			path: i.path
		}), o = a.find((e) => e.name === t)?.id ?? await this.request("/api/filetree/createDocWithMd", {
			notebook: i.box,
			path: `${i.hpath}/${t}`,
			parentID: e,
			markdown: ""
		});
		return this.children.set(n, o), o;
	}
	async dateDoc(e, t) {
		let n = await this.childDoc(e, t.slice(0, 4)), r = await this.childDoc(n, t.slice(5, 7));
		return this.childDoc(r, t);
	}
	async moveToEnd(e, t) {
		let n = await this.request("/api/block/getChildBlocks", { id: t }), r = n[n.length - 1];
		if (!r) {
			await this.request("/api/block/moveBlock", {
				id: e,
				parentID: t
			});
			return;
		}
		await this.request("/api/block/moveBlock", {
			id: e,
			previousID: r.id
		}), n.length === 1 && r.type === "p" && !r.markdown && await this.request("/api/block/deleteBlock", { id: r.id });
	}
	async waitForSync(e) {
		let t = Date.now() + bt;
		for (; await this.isSyncing(e);) {
			if (Date.now() > t) throw Error(`${e} is still syncing after ${bt} ms`);
			await St(yt);
		}
	}
	async isSyncing(e) {
		try {
			return (await this.request("/api/filetree/getDoc", { id: e })).isSyncing === !0;
		} catch {
			return !1;
		}
	}
	async recover(e) {
		if (!this.recovered.has(e)) {
			this.recovered.add(e);
			try {
				let t = await this.childDoc(e, M), n = [];
				for (let e of await this.request("/api/block/getChildBlocks", { id: t })) {
					if (e.type !== "s") continue;
					let t = await this.request("/api/attr/getBlockAttrs", { id: e.id });
					xt.some((e) => t[e]) && n.push(e.id);
				}
				if (n.length === 0) return;
				this.siyuan.logger.info(`[inbox] move ${n.length} leftover message(s) out of ${t}`), this.downloadAssetsEnabled() && await this.downloadAssets(t);
				for (let t of n) await this.moveToDate(e, t, Tt(t));
			} catch (t) {
				this.siyuan.logger.warn(`[inbox] move the leftover messages of ${e} failed:`, N(t));
			}
		}
	}
	async append(e, t) {
		let n = (await this.request("/api/block/appendBlock", {
			parentID: e,
			dataType: "markdown",
			data: t
		}))[0]?.doOperations[0]?.id;
		if (!n) throw Error("appendBlock returned no block");
		return n;
	}
	async request(e, t) {
		let n = await (await this.siyuan.client.fetch(e, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(t)
		})).json();
		if (n.code !== 0) throw Error(`${e} failed: ${n.code} ${n.msg}`);
		return n.data;
	}
}, Dt = "custom-msg-idx";
function Ot(e) {
	return e instanceof Error ? e.message : String(e);
}
function kt(e) {
	return e.bindings.filter((e) => e.enabled && e.group && e.doc);
}
var At = class {
	siyuan;
	openapi;
	writer;
	config;
	constructor(e, t, n, r) {
		this.siyuan = e, this.openapi = t, this.writer = n, this.config = r;
	}
	handle(e) {
		if (!e.t || !se.has(e.t)) return;
		let t = e.d;
		if (Re(e.t, t)) return;
		let n = kt(this.config().inbox).filter((e) => e.group === t.group_openid);
		n.length !== 0 && this.writer.enqueue(async () => {
			for (let [r, i] of n.entries()) try {
				await this.write(i, e.id ?? "", t, r + 1);
			} catch (e) {
				this.siyuan.logger.warn(`[qq] [inbox] write the message ${t.id} of group ${i.group} to ${i.doc} failed:`, Ot(e));
			}
		});
	}
	async write(e, t, n, r) {
		let i = e.doc;
		await this.writer.prepare(i);
		let a = E(n, "msg_idx");
		if (a && await this.writer.findMessage(i, Dt, a)) {
			this.siyuan.logger.debug(`[qq] [inbox] the message ${a} is already in ${i}, skip it`);
			return;
		}
		let o = n.message_type === ae.REFERENCE ? E(n, "ref_msg_idx") : void 0, s = Ke(n, {
			eventId: t,
			reference: o ? await this.writer.findMessage(i, Dt, o) : void 0,
			labels: this.labels()
		}), { block: c, temp: l } = await this.writer.appendToTemp(i, s.kramdown);
		a && this.writer.remember(i, Dt, a, c), e.reply && this.reply(n, c, r), s.media > 0 && this.config().inbox.downloadAssets && await this.writer.downloadAssets(l), await this.writer.moveToDate(i, c, wt(n.timestamp));
	}
	async reply(e, t, n) {
		let r = j(this.config());
		if (!r) return;
		let i = E(e, "msg_idx");
		try {
			let a = await this.openapi.request(r, {
				url: `/v2/groups/${encodeURIComponent(e.group_openid)}/messages`,
				method: "POST",
				body: {
					msg_type: 0,
					content: `siyuan://blocks/${t}`,
					msg_id: e.id,
					msg_seq: n,
					message_reference: i ? { message_id: i } : void 0
				}
			});
			if (a.status < 200 || a.status >= 300) throw Error(`${a.status} ${JSON.stringify(a.body)}`);
			this.siyuan.logger.debug(`[qq] [inbox] replied to the message ${e.id} with the block ${t}`);
		} catch (n) {
			this.siyuan.logger.warn(`[qq] [inbox] reply to the message ${e.id} with the block ${t} failed:`, Ot(n));
		}
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.inbox;
		return {
			quote: e?.quote || "Quoted message",
			unavailable: e?.unavailable || "[Message not available]"
		};
	}
}, jt = {
	offline: "Inbox offline: messages of this group are not recorded for now (device: {{1}})",
	online: "Inbox online: messages of this group are recorded in SiYuan (device: {{1}})"
};
function Mt(e) {
	return e instanceof Error ? e.message : String(e);
}
var Nt = class {
	siyuan;
	openapi;
	constructor(e, t) {
		this.siyuan = e, this.openapi = t;
	}
	async send(e, t, n, r) {
		let i = this.text(n).replaceAll("{{1}}", r);
		await Promise.all([...new Set(t)].map((t) => this.sendTo(e, t, n, i)));
	}
	async sendTo(e, t, n, r) {
		try {
			let i = await this.openapi.request(e, {
				url: `/v2/groups/${encodeURIComponent(t)}/messages`,
				method: "POST",
				body: {
					msg_type: 0,
					content: r
				}
			});
			if (i.status < 200 || i.status >= 300) throw Error(`${i.status} ${JSON.stringify(i.body)}`);
			this.siyuan.logger.info(`[qq] [notices] sent the ${n} notice to group ${t}`);
		} catch (e) {
			this.siyuan.logger.warn(`[qq] [notices] send the ${n} notice to group ${t} failed:`, Mt(e));
		}
	}
	text(e) {
		return this.siyuan.plugin.i18n?.notices?.[e] || jt[e];
	}
}, Pt = 50, Ft = 10;
function It(e) {
	return e instanceof Error ? e.message : String(e);
}
function Lt(e) {
	return {
		type: e.type ?? "command",
		name: e.name ?? "",
		desc: e.desc ?? "",
		only_admin: e.only_admin ?? !1,
		link: e.link ?? ""
	};
}
function Rt(e, t) {
	let n = (e) => JSON.stringify({
		items: (e?.items ?? []).map(Lt),
		remark: e?.remark ?? ""
	});
	return n(e) === n(t);
}
var zt = class {
	siyuan;
	openapi;
	queue = Promise.resolve();
	constructor(e, t) {
		this.siyuan = e, this.openapi = t;
	}
	sync(e, t) {
		let n = this.queue.then(() => this.syncAll(e, t));
		return this.queue = n, n;
	}
	async syncAll(e, t) {
		let n = !0;
		for (let r of t) try {
			await this.syncPanel(e, r);
		} catch (e) {
			n = !1, this.siyuan.logger.warn(`[qq] [panels] sync the ${r?.scope} panel ${JSON.stringify(r?.panel?.remark)} failed:`, It(e));
		}
		return n;
	}
	async syncPanel(e, t) {
		let n = t?.panel?.remark;
		if (!n) throw Error("panel.remark is empty, so the panel cannot be found after it is created");
		let { scope: r, panel: i } = t, a = await this.find(e, r, n);
		if (!a) {
			let i = await this.call(e, "POST", "/v2/panels", t);
			this.siyuan.logger.info(`[qq] [panels] created the ${r} panel "${n}": ${i.panel_id}`);
			return;
		}
		if (t.target_type && a.target_type && t.target_type !== a.target_type && this.siyuan.logger.warn(`[qq] [panels] the ${r} panel "${n}" (${a.panel_id}) has target_type ${a.target_type} instead of ${t.target_type}, which an update cannot change`), Rt(a.panel, i)) {
			this.siyuan.logger.debug(`[qq] [panels] the ${r} panel "${n}" (${a.panel_id}) is up to date`);
			return;
		}
		let o = await this.call(e, "PUT", `/v2/panels/${encodeURIComponent(a.panel_id)}`, { panel: i });
		this.siyuan.logger.info(`[qq] [panels] updated the ${r} panel "${n}" (${a.panel_id}) to version ${o.version}`);
	}
	async find(e, t, n) {
		let r = "";
		for (let i = 0; i < Ft; i++) {
			let i = `scope=${encodeURIComponent(t)}&limit=${Pt}${r ? `&cursor=${encodeURIComponent(r)}` : ""}`, a = await this.call(e, "GET", `/v2/panels?${i}`), o = a.records?.find((e) => e.panel?.remark === n);
			if (o) return o;
			if (a.is_end || !a.next_cursor) return;
			r = a.next_cursor;
		}
		throw Error(`the ${t} panels have more than ${Ft} pages`);
	}
	async call(e, t, n, r) {
		let i = await this.openapi.request(e, {
			url: n,
			method: t,
			body: r
		});
		if (i.status < 200 || i.status >= 300 || typeof i.body != "object" || i.body === null) throw Error(`${t} ${n} failed: ${i.status} ${JSON.stringify(i.body)}`);
		return i.body;
	}
}, Bt = 5e3;
function Vt(e) {
	return e instanceof Error ? e.message : String(e);
}
function P(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function F(e) {
	let t = typeof e == "number" ? e * 1e3 : typeof e == "string" ? Date.parse(e) : NaN, n = new Date(t);
	return (Number.isNaN(n.getTime()) ? /* @__PURE__ */ new Date() : n).toISOString();
}
function I(e) {
	return typeof e == "string" ? Date.parse(e) : NaN;
}
function L(e, t) {
	return t ? e && I(e.time) > I(t.time) ? e : t : e;
}
function Ht(e, t) {
	let n = L(e, t), r = n === t ? e : t;
	return n && !n.username && r?.username && r.openid === n.openid ? {
		...n,
		username: r.username
	} : n;
}
function Ut(e, t) {
	return I(e) < I(t) ? e : t;
}
function Wt(e, ...t) {
	let n = I(e?.time);
	return Number.isNaN(n) || t.some((e) => I(e?.time) > n) ? "added" : "removed";
}
function R(e, t) {
	let n = P(e) ? e[t] : void 0;
	return P(n) ? n : void 0;
}
function Gt(e) {
	let t = {};
	for (let [n, r] of Object.entries(e ?? {})) P(r) && (t[n] = r);
	return t;
}
function Kt(e, t) {
	let n = L(e?.added, t.added), r = L(e?.removed, t.removed), i = L(e?.lastMessage, t.lastMessage);
	return {
		...e,
		status: Wt(r, n, i),
		firstSeen: Ut(e?.firstSeen, t.firstSeen),
		added: n,
		removed: r,
		proactive: L(e?.proactive, t.proactive),
		lastMessage: i,
		owner: Ht(e?.owner, t.owner)
	};
}
function qt(e, t) {
	let n = L(e?.added, t.added), r = L(e?.removed, t.removed), i = Ht(e?.lastMessage, t.lastMessage);
	return {
		...e,
		status: Wt(r, n, i),
		firstSeen: Ut(e?.firstSeen, t.firstSeen),
		unionOpenid: t.unionOpenid || e?.unionOpenid,
		added: n,
		removed: r,
		proactive: L(e?.proactive, t.proactive),
		lastMessage: i
	};
}
function z(e, t) {
	let n = { ...e };
	for (let [r, i] of Object.entries(t)) {
		let t = R(e, r), a = { ...R(t, "groups") };
		for (let [e, t] of Object.entries(i.groups)) a[e] = Kt(R(a, e), t);
		let o = { ...R(t, "users") };
		for (let [e, t] of Object.entries(i.users)) o[e] = qt(R(o, e), t);
		n[r] = {
			...t,
			groups: a,
			users: o
		};
	}
	return n;
}
function Jt(e, t) {
	return {
		groups: { [e]: Kt(void 0, t) },
		users: {}
	};
}
function Yt(e, t) {
	return {
		groups: {},
		users: { [e]: qt(void 0, t) }
	};
}
function Xt(e) {
	switch (e.t) {
		case "GROUP_ADD_ROBOT":
		case "GROUP_DEL_ROBOT":
		case "GROUP_MSG_RECEIVE":
		case "GROUP_MSG_REJECT": {
			let t = e.d;
			if (!t?.group_openid) return;
			let n = F(t.timestamp), r = {
				time: n,
				operator: t.op_member_openid || void 0
			};
			return Jt(t.group_openid, {
				firstSeen: n,
				added: e.t === "GROUP_ADD_ROBOT" ? r : void 0,
				removed: e.t === "GROUP_DEL_ROBOT" ? r : void 0,
				proactive: e.t === "GROUP_MSG_RECEIVE" || e.t === "GROUP_MSG_REJECT" ? {
					allowed: e.t === "GROUP_MSG_RECEIVE",
					...r
				} : void 0
			});
		}
		case "GROUP_AT_MESSAGE_CREATE":
		case "GROUP_MESSAGE_CREATE": {
			let t = e.d;
			if (!t?.group_openid) return;
			let n = F(t.timestamp), r = t.author?.member_openid || t.author?.id;
			return Jt(t.group_openid, {
				firstSeen: n,
				lastMessage: { time: n },
				owner: t.author?.member_role === "owner" && r ? {
					openid: r,
					username: t.author.username || void 0,
					time: n
				} : void 0
			});
		}
		case "FRIEND_ADD":
		case "FRIEND_DEL":
		case "C2C_MSG_RECEIVE":
		case "C2C_MSG_REJECT": {
			let t = e.d;
			if (!t?.openid) return;
			let n = F(t.timestamp);
			return Yt(t.openid, {
				firstSeen: n,
				unionOpenid: t.author?.union_openid || void 0,
				added: e.t === "FRIEND_ADD" ? {
					time: n,
					scene: t.scene,
					sceneParam: t.scene_param || void 0
				} : void 0,
				removed: e.t === "FRIEND_DEL" ? { time: n } : void 0,
				proactive: e.t === "C2C_MSG_RECEIVE" || e.t === "C2C_MSG_REJECT" ? {
					allowed: e.t === "C2C_MSG_RECEIVE",
					time: n
				} : void 0
			});
		}
		case "C2C_MESSAGE_CREATE": {
			let t = e.d, n = t?.author?.user_openid || t?.author?.id;
			if (!t || !n) return;
			let r = F(t.timestamp);
			return Yt(n, {
				firstSeen: r,
				unionOpenid: t.author.union_openid || void 0,
				lastMessage: {
					time: r,
					username: t.author.username || void 0
				}
			});
		}
		default: return;
	}
}
var Zt = class {
	siyuan;
	config;
	pending = {};
	timer;
	queue = Promise.resolve();
	constructor(e, t) {
		this.siyuan = e, this.config = t;
	}
	handle(e) {
		let t = this.config().appid.trim(), n = t ? Xt(e) : void 0;
		n && (this.pending = z(this.pending, { [t]: n }), this.timer === void 0 && (this.timer = setTimeout(() => void this.flush(), Bt)));
	}
	flush() {
		return clearTimeout(this.timer), this.timer = void 0, this.queue = this.queue.then(() => this.write()), this.queue;
	}
	list(e) {
		let t = this.queue.then(async () => {
			let t = R(z(await this.read(), this.pending), e);
			return {
				groups: Gt(R(t, "groups")),
				users: Gt(R(t, "users"))
			};
		});
		return this.queue = t.then(() => void 0, () => void 0), t;
	}
	async write() {
		let e = this.pending;
		if (Object.keys(e).length !== 0) {
			this.pending = {};
			try {
				let t = z(await this.read(), e);
				await this.siyuan.storage.put(m.USERS_FILE_NAME, JSON.stringify(t, void 0, 4)), this.siyuan.logger.debug(`[qq] [users] updated ${m.USERS_FILE_NAME}`);
			} catch (t) {
				this.pending = z(e, this.pending), this.siyuan.logger.warn(`[qq] [users] update ${m.USERS_FILE_NAME} failed, retry with the next change:`, Vt(t));
			}
		}
	}
	async read() {
		let e = m.USERS_FILE_NAME;
		if (!(await this.siyuan.storage.list(".")).some((t) => t.name === e)) return {};
		let t = await (await this.siyuan.storage.get(e)).text(), n;
		try {
			n = JSON.parse(t);
		} catch (t) {
			throw Error(`${e} is not valid JSON, fix or delete it: ${Vt(t)}`);
		}
		if (!P(n)) throw Error(`${e} is not a JSON object, fix or delete it`);
		return n;
	}
}, Qt = /^\d+:[\w-]+$/, $t = [
	"message",
	"channel_post",
	"my_chat_member"
], en = 2e3, tn = 3e4, nn = /* @__PURE__ */ new Set([
	401,
	404,
	409
]), rn = 104857600, an = {
	START: "start",
	CHATID: "chatid"
}, on = /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/;
function sn(e) {
	return e instanceof Error ? e.message : String(e);
}
function cn(e) {
	return new Promise((t) => setTimeout(t, e));
}
function B(e) {
	return e.slice(0, e.indexOf(":"));
}
function V(e, t) {
	return e.replaceAll(t, () => `${B(t)}:***`);
}
function ln(e) {
	let t = e.token.trim();
	if (!t) return;
	if (!Qt.test(t)) throw Error("the token is not in the form <bot ID>:<secret> given by @BotFather");
	let n = (e.apiBaseUrl.trim() || "https://api.telegram.org").replace(/\/+$/, "");
	if (!on.test(n)) throw Error(`the Bot API server ${n} is not an http or https URL without a query or a fragment`);
	return {
		token: t,
		apiBaseUrl: n
	};
}
var H = class extends Error {
	code;
	parameters;
	constructor(e, t, n = {}) {
		super(e), this.name = "TelegramApiError", this.code = t, this.parameters = n;
	}
}, un = class {
	siyuan;
	constructor(e) {
		this.siyuan = e;
	}
	async getMe(e) {
		return this.call(e, "getMe");
	}
	async getUpdates(e, t, n) {
		return this.call(e, "getUpdates", {
			offset: t,
			limit: 100,
			timeout: n,
			allowed_updates: $t
		});
	}
	async sendText(e, t, n, r) {
		return this.callWithRetry(e, "sendMessage", {
			chat_id: t,
			text: n,
			reply_parameters: r === void 0 ? void 0 : {
				message_id: r,
				allow_sending_without_reply: !0
			},
			link_preview_options: { is_disabled: !0 }
		});
	}
	async getChatMember(e, t, n) {
		return this.callWithRetry(e, "getChatMember", {
			chat_id: t,
			user_id: n
		});
	}
	async getFile(e, t) {
		return this.callWithRetry(e, "getFile", { file_id: t });
	}
	async download(e, t) {
		let n = t.split("/").map(encodeURIComponent).join("/"), r;
		try {
			r = await Qe(this.siyuan, {
				url: `${e.apiBaseUrl}/file/bot${e.token}/${n}`,
				method: "GET"
			});
		} catch (n) {
			throw Error(V(`download ${t} failed: ${sn(n)}`, e.token));
		}
		if (r.status < 200 || r.status >= 300) throw Error(`download ${t} failed: HTTP ${r.status}`);
		return r.body;
	}
	async call(e, t, n = {}) {
		let r;
		try {
			r = await A(this.siyuan, {
				url: `${e.apiBaseUrl}/bot${e.token}/${t}`,
				method: "POST",
				json: n
			});
		} catch (n) {
			throw Error(V(`${t} failed: ${sn(n)}`, e.token));
		}
		let i = k(r.body);
		if (typeof i?.ok != "boolean") throw new H(V(`${t} failed: HTTP ${r.status} ${r.body.slice(0, 200)}`, e.token), r.status);
		if (!i.ok) {
			let n = i.error_code ?? r.status;
			throw new H(V(`${t} failed: ${n} ${i.description ?? ""}`.trim(), e.token), n, i.parameters);
		}
		return i.result;
	}
	async callWithRetry(e, t, n) {
		for (let r = 1;; r++) try {
			return await this.call(e, t, n);
		} catch (e) {
			let n = e instanceof H ? e.parameters.retry_after : void 0;
			if (n === void 0 || r >= 3 || n > 60) throw e;
			this.siyuan.logger.info(`[telegram] ${t} is rate limited, retry in ${n} s`), await cn(n * 1e3);
		}
	}
}, dn = /* @__PURE__ */ new Set([
	"blockquote",
	"expandable_blockquote",
	"pre"
]), fn = /* @__PURE__ */ new Set([
	"bold",
	"italic",
	"spoiler",
	"strikethrough",
	"underline"
]), pn = /[\r\n]/, mn = /\s/, hn = /^[a-z][\w+.-]*:\/\//i;
function gn(e) {
	return !e || dn.has(e.type) ? 0 : fn.has(e.type) ? 1 : 2;
}
function _n(e, t) {
	let n = t.offset, r = t.offset + t.length;
	if (!(n >= 0 && r > n && r <= e.length)) return [];
	if (dn.has(t.type)) return [{
		entity: t,
		start: n,
		end: r,
		last: !0,
		children: []
	}];
	let i = [], a = n;
	for (let o = n; o <= r; o++) {
		if (o < r && !pn.test(e.charAt(o))) continue;
		let n = a, s = o;
		if (fn.has(t.type)) {
			for (; n < s && mn.test(e.charAt(n));) n++;
			for (; s > n && mn.test(e.charAt(s - 1));) s--;
		}
		s > n && i.push({
			entity: t,
			start: n,
			end: s,
			last: !1,
			children: []
		}), a = o + 1;
	}
	let o = i[i.length - 1];
	return o && (o.last = !0), i;
}
function vn(e, t) {
	let n = [];
	for (let r of t) n.push(..._n(e, r));
	n.sort((e, t) => e.start - t.start || t.end - e.end || gn(e.entity) - gn(t.entity));
	let r = {
		start: 0,
		end: e.length,
		last: !0,
		children: []
	}, i = [r];
	for (let e of n) {
		for (; i.length > 1 && i[i.length - 1].end <= e.start;) i.pop();
		let t = i[i.length - 1];
		e.end = Math.min(e.end, t.end), !(e.end <= e.start) && (t.children.push(e), i.push(e));
	}
	return r;
}
function yn(e) {
	let t = /* @__PURE__ */ new Date((e ?? NaN) * 1e3);
	return Number.isNaN(t.getTime()) ? "" : t.toISOString();
}
function bn(e) {
	return hn.test(e) ? e : `http://${e}`;
}
function xn(e, t) {
	let n = t.underline ? (e) => e ? be(e) : "" : _;
	return t.link ? n(e) : ve(e, n);
}
function Sn(e, t, n) {
	return Tn(e, t, n, !1).map((e) => "inline" in e ? e.inline : "").join("");
}
function Cn(e, t, n) {
	let r = t.entity;
	if (r.type === "pre") {
		let n = e.slice(t.start, t.end);
		return n.trim() ? Se(n, r.language) : "";
	}
	let i = y(Sn(e, t, n));
	return i ? b([i]) : "";
}
function wn(e, t, n) {
	let r = t.entity, i = e.slice(t.start, t.end), a = (r = n) => Sn(e, t, r), o = (e) => n.link || !e ? a() : S(a({
		...n,
		link: !0
	}), e);
	switch (r.type) {
		case "bold": return `**${a()}**`;
		case "italic": return `*${a()}*`;
		case "strikethrough": return `~~${a()}~~`;
		case "spoiler": return `==${a()}==`;
		case "underline": return a({
			...n,
			underline: !0
		});
		case "code":
		case "pre": return xe(i);
		case "mention":
		case "bot_command": return we(i);
		case "text_mention": return we(`@<${i}>`);
		case "text_link": return o(r.url);
		case "url": return o(bn(i));
		case "email": return o(`mailto:${i}`);
		case "phone_number": return o(`tel:${i.replace(/[^\d+]/g, "")}`);
		case "date_time": {
			let e = t.last ? yn(r.unix_time) : "";
			return e ? Te(i, e) : _(i);
		}
		default: return a();
	}
}
function Tn(e, t, n, r) {
	let i = [], a = "", o = t.start, s = !1;
	for (let c of t.children) c.start > o && (a += xn(e.slice(o, c.start), n), s = !1), r && dn.has(c.entity.type) ? (i.push({ inline: a }, { block: Cn(e, c, n) }), a = "", s = !1) : (a += (s ? "​" : "") + wn(e, c, n), s = !0), o = c.end;
	return t.end > o && (a += xn(e.slice(o, t.end), n)), i.push({ inline: a }), i.filter((e) => "block" in e ? e.block : e.inline);
}
function En(e, t) {
	return Tn(e, vn(e, t ?? []), {
		underline: !1,
		link: !1
	}, !0);
}
//#endregion
//#region src/telegram/message.ts
var Dn = 32, On = /^(?:\/|[a-z]:[\\/])/i;
function U(e) {
	return `${e.chat.id}:${e.message_id}`;
}
function kn(e) {
	return On.test(e);
}
function An(e, t) {
	let n = e.text, r = e.entities?.find((e) => e.type === "bot_command" && e.offset === 0);
	if (!n || !r) return;
	let [i = "", a] = n.slice(1, r.length).split("@");
	if (!(a && a.toLowerCase() !== t?.toLowerCase())) return i.toLowerCase();
}
function jn(e) {
	let t = e.reply_to_message;
	return t && !t.forum_topic_created ? t : void 0;
}
function W(e) {
	if (e.photo?.length) return {
		kind: "image",
		file: e.photo.reduce((e, t) => t.width * t.height > e.width * e.height ? t : e)
	};
	if (e.animation) return {
		kind: "animation",
		file: e.animation,
		name: e.animation.file_name
	};
	if (e.video) return {
		kind: "video",
		file: e.video,
		name: e.video.file_name
	};
	if (e.video_note) return {
		kind: "video",
		file: e.video_note
	};
	if (e.voice) return {
		kind: "voice",
		file: e.voice
	};
	if (e.audio) {
		let t = e.audio, n = [t.performer, t.title].filter(Boolean).join(" - ");
		return {
			kind: "audio",
			file: t,
			name: t.file_name,
			title: n || t.file_name
		};
	}
	if (e.sticker) {
		let t = e.sticker;
		return {
			kind: "sticker",
			file: t,
			title: t.emoji,
			isAnimated: t.is_animated,
			isVideo: t.is_video,
			thumbnail: t.is_animated ? t.thumbnail : void 0
		};
	}
	if (e.document) return {
		kind: "file",
		file: e.document,
		name: e.document.file_name,
		title: e.document.file_name
	};
}
function Mn(e) {
	return !!(e.text || e.caption || W(e) || e.location || e.contact || e.poll || e.dice);
}
function Nn(e, t) {
	return [t[e.kind], e.title].filter(Boolean).join(" ");
}
function Pn(e, t) {
	let n = W(e);
	if (n) return Nn(n, t);
	if (e.venue) return [
		t.location,
		e.venue.title,
		e.venue.address
	].filter(Boolean).join(" ");
	if (e.location) return `${t.location} ${e.location.latitude}, ${e.location.longitude}`;
	if (e.contact) {
		let { first_name: n, last_name: r, phone_number: i } = e.contact;
		return [
			t.contact,
			n,
			r,
			i
		].filter(Boolean).join(" ");
	}
	return e.poll ? [`${t.poll} ${e.poll.question}`, ...e.poll.options.map((e) => `- ${e.text}`)].join("\n") : e.dice ? `${e.dice.emoji} ${e.dice.value}` : "";
}
function Fn(e, t) {
	return [Pn(e, t), e.text ?? e.caption ?? ""].map((e) => e.trim()).filter(Boolean).join(" ");
}
function In(e) {
	let t = e.from;
	if (t && !e.sender_chat) {
		let e = [t.first_name, t.last_name].filter(Boolean).join(" ");
		return {
			id: t.id,
			name: e || t.username || String(t.id)
		};
	}
	let n = e.sender_chat ?? e.chat, r = [n.first_name, n.last_name].filter(Boolean).join(" ");
	return {
		id: n.id,
		name: e.author_signature || n.title || r || n.username || String(n.id)
	};
}
function Ln(e, t, n) {
	let { latitude: r, longitude: i } = e, a = `https://www.openstreetmap.org/?mlat=${r}&mlon=${i}#map=16/${r}/${i}`, o = n ? [n.title, n.address].filter(Boolean).join(" ") : "";
	return [
		_(t.location),
		_(o),
		C(`${r}, ${i}`, a)
	].filter(Boolean).join(" ");
}
function Rn(e) {
	return e.replace(/^.*\//, "");
}
function zn(e, t, n) {
	let r = t.file;
	if (e.isAnimated) {
		let i = t.thumbnail ? x(t.thumbnail, e.title || n.sticker) : _(Nn(e, n));
		return [{ inline: r ? `${i} ${C(Rn(r), r)}` : i }];
	}
	if (!r) return [{ inline: _(Nn(e, n)) }];
	switch (e.kind) {
		case "image": return [{ inline: x(r, n.image) }];
		case "sticker": return [e.isVideo ? { block: w(r) } : { inline: x(r, e.title || n.sticker) }];
		case "animation": return [/\.gif(?:\?|$)/i.test(r) ? { inline: x(r, n.animation) } : { block: w(r) }];
		case "video": return [{ block: w(r) }];
		case "voice": return [{ block: Ce(r) }];
		case "audio": return [{ block: Ce(r) }, { inline: _(e.title ?? "") }];
		case "file": return [{ inline: `${_(n.file)} ${C(e.name?.trim() || Rn(r), r)}` }];
	}
}
function Bn(e) {
	let t = e.replace(/\s+/g, " ").trim();
	return t.length > Dn ? `${t.slice(0, Dn)}...` : t;
}
function Vn(e, t) {
	let { assets: n, labels: r, reference: i } = t, a = [], o = W(e);
	o ? a.push(...zn(o, n ?? {}, r)) : e.venue ? a.push({ inline: Ln(e.venue.location, r, e.venue) }) : e.location ? a.push({ inline: Ln(e.location, r) }) : a.push({ inline: _(Pn(e, r)) });
	let s = e.text ?? e.caption;
	s && a.push(...En(s, e.text === void 0 ? e.caption_entities : e.entities));
	let c = a.filter((e) => "block" in e || y(e.inline)), l = [], u = jn(e);
	if (u) {
		let t = e.quote?.text?.trim() || Fn(u, r);
		l.push(b([i ? Ee(i, Bn(t) || r.quote) : _(t || r.quote)]));
	}
	l.push(...c.map((e) => "block" in e ? e.block : y(e.inline)));
	let d = In(e);
	return v(l.length > 0 ? l : [_(r.unavailable)], {
		"custom-update-id": t.updateId === void 0 ? void 0 : String(t.updateId),
		"custom-author-id": String(d.id),
		"custom-author-username": t.showAuthor ? d.name : void 0,
		"custom-msg-id": U(e)
	});
}
//#endregion
//#region src/telegram/commands.ts
var Hn = new Set(Object.values(an)), Un = /* @__PURE__ */ new Set(["administrator", "creator"]), Wn = 1024;
function Gn(e) {
	return e instanceof Error ? e.message : String(e);
}
function Kn(e, t) {
	return e.replaceAll("{{1}}", () => t);
}
var qn = class {
	siyuan;
	api;
	answered = /* @__PURE__ */ new Set();
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	handle(e, t) {
		let n = An(t, e.me.username);
		if (n === void 0) return;
		if (!Hn.has(n)) {
			this.siyuan.logger.info(`[telegram] [commands] ignore the unknown command /${n} in chat ${t.chat.id}`);
			return;
		}
		let r = U(t);
		if (this.answered.has(r)) {
			this.siyuan.logger.debug(`[telegram] [commands] the message ${r} is already answered, skip it`);
			return;
		}
		this.answered.add(r), this.answered.size > Wn && this.answered.delete(this.answered.values().next().value), this.answer(e, t, n);
	}
	async answer(e, t, n) {
		let r = t.chat, i = t.sender_chat?.id ?? t.from?.id;
		try {
			if ((r.type === "group" || r.type === "supergroup") && !await this.isAdmin(e, t)) {
				this.siyuan.logger.info(`[telegram] [commands] ignore /${n} from ${i} in chat ${r.id}: only the owner and administrators can send commands in groups`);
				return;
			}
			this.siyuan.logger.info(`[telegram] [commands] /${n} from ${i} in chat ${r.id}`), await this.api.sendText(e.options, r.id, this.chatIdText(t), t.message_id);
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [commands] answer /${n} in chat ${r.id} failed:`, Gn(e));
		}
	}
	async isAdmin(e, t) {
		if (t.sender_chat) return t.sender_chat.id === t.chat.id;
		if (!t.from) return !1;
		let n = await this.api.getChatMember(e.options, t.chat.id, t.from.id);
		return Un.has(n.status);
	}
	chatIdText(e) {
		let t = this.labels(), n = [Kn(t.chat, String(e.chat.id))], r = e.sender_chat ? void 0 : e.from;
		return r && r.id !== e.chat.id && n.push(Kn(t.user, String(r.id))), n.join("\n");
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.commands?.chatid;
		return {
			chat: e?.chat || "Chat ID: {{1}}",
			user: e?.user || "User ID: {{1}}"
		};
	}
}, Jn = "custom-msg-id";
function Yn(e) {
	return e instanceof Error ? e.message : String(e);
}
function Xn(e) {
	return e.bindings.filter((e) => e.enabled && e.chat && e.doc);
}
var Zn = class {
	siyuan;
	api;
	writer;
	media;
	config;
	constructor(e, t, n, r, i) {
		this.siyuan = e, this.api = t, this.writer = n, this.media = r, this.config = i;
	}
	handle(e, t, n) {
		if (An(t, e.me.username) !== void 0 || !Mn(t)) return;
		let r = this.config().inbox, i = String(t.chat.id), a = Xn(r).filter((e) => e.chat === i);
		if (a.length === 0) return;
		let o = r.downloadAssets;
		this.writer.enqueue(async () => {
			for (let r of a) try {
				await this.write(e, r, t, n, o);
			} catch (e) {
				this.siyuan.logger.warn(`[telegram] [inbox] write the message ${U(t)} to ${r.doc} failed:`, Yn(e));
			}
		});
	}
	async write(e, t, n, r, i) {
		let a = t.doc;
		await this.writer.prepare(a);
		let o = U(n);
		if (await this.writer.findMessage(a, Jn, o)) {
			this.siyuan.logger.debug(`[telegram] [inbox] the message ${o} is already in ${a}, skip it`);
			return;
		}
		let s = jn(n), c = {
			updateId: r,
			reference: s ? await this.writer.findMessage(a, Jn, U(s)) : void 0,
			showAuthor: n.chat.type !== "private",
			labels: this.labels()
		}, { block: l } = await this.writer.appendToTemp(a, Vn(n, c));
		this.writer.remember(a, Jn, o, l), t.reply && this.reply(e, n, l), i && W(n) && await this.saveMedia(e, n, l, c), await this.writer.moveToDate(a, l, wt(n.date * 1e3));
	}
	async saveMedia(e, t, n, r) {
		let i = await this.media.save(e, t, n);
		if (i.file || i.thumbnail) try {
			await this.writer.updateBlock(n, Vn(t, {
				...r,
				assets: i
			}));
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [inbox] put the media of the message ${U(t)} into the block ${n} failed:`, Yn(e));
		}
	}
	async reply(e, t, n) {
		try {
			let r = await this.api.sendText(e.options, t.chat.id, `siyuan://blocks/${n}`, t.message_id);
			this.siyuan.logger.debug(`[telegram] [inbox] replied to the message ${U(t)} with the block ${n}, reply ${r.message_id}`);
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [inbox] reply to the message ${U(t)} with the block ${n} failed:`, Yn(e));
		}
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.inbox;
		return {
			quote: e?.quote || "Quoted message",
			unavailable: e?.unavailable || "[Message not available]",
			animation: e?.animation || "[Animation]",
			audio: e?.audio || "[Audio]",
			contact: e?.contact || "[Contact]",
			file: e?.file || "[File]",
			image: e?.image || "[Image]",
			location: e?.location || "[Location]",
			poll: e?.poll || "[Poll]",
			sticker: e?.sticker || "[Sticker]",
			video: e?.video || "[Video]",
			voice: e?.voice || "[Voice]"
		};
	}
};
//#endregion
//#region src/utils/asset.ts
function Qn(e) {
	return e.replace(/[\u0000-\u001F\u007F"\\/]/g, "_").trim() || "file";
}
async function $n(e, t, n, r) {
	let i = `----siyuan-plugin-im-bot-${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`, a = Buffer.from([
		`--${i}`,
		"Content-Disposition: form-data; name=\"id\"",
		"",
		r,
		`--${i}`,
		`Content-Disposition: form-data; name="file[]"; filename="${Qn(t)}"`,
		"Content-Type: application/octet-stream",
		"",
		""
	].join("\r\n"), "utf8"), o = Buffer.from(`\r\n--${i}--\r\n`, "utf8"), s = new Uint8Array(a.length + n.byteLength + o.length);
	s.set(a, 0), s.set(new Uint8Array(n), a.length), s.set(o, a.length + n.byteLength);
	let c = await (await e.client.fetch("/api/asset/upload", {
		method: "POST",
		headers: { "Content-Type": `multipart/form-data; boundary=${i}` },
		body: s.buffer
	})).json(), l = c.code === 0 ? Object.values(c.data?.succMap ?? {})[0] : void 0;
	if (!l) throw Error(`/api/asset/upload failed: ${c.code} ${c.msg || c.data?.errFiles?.join(", ") || "no asset"}`);
	return l;
}
//#endregion
//#region src/telegram/media.ts
function er(e) {
	return e instanceof Error ? e.message : String(e);
}
function tr(e) {
	let t = /\.[0-9a-z]+$/i.exec(e)?.[0]?.toLowerCase() ?? "";
	return t === ".oga" ? ".ogg" : t;
}
function nr(e, t) {
	return e.name?.trim() || `${e.kind}${tr(t)}`;
}
var rr = class {
	siyuan;
	api;
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	async save(e, t, n) {
		let r = W(t);
		if (!r) return {};
		let i = `the ${r.kind} of the message ${U(t)}`, a = { file: await this.saveFile(e, r.file, (e) => nr(r, e), i, n) };
		return r.thumbnail && (a.thumbnail = await this.saveFile(e, r.thumbnail, (e) => `${r.kind}-thumbnail${tr(e)}`, `the thumbnail of ${i}`, n)), a;
	}
	async saveFile(e, t, n, r, i) {
		try {
			let a = t.file_size;
			if (a && a > 104857600) {
				this.siyuan.logger.warn(`[telegram] [media] ${r} has ${a} bytes, more than ${rn}, keep it as a placeholder`);
				return;
			}
			let o = await this.api.getFile(e.options, t.file_id);
			if (!o.file_path) throw Error("getFile returned no file_path");
			if (kn(o.file_path)) throw Error(`the Bot API server runs in --local mode and returned the local path ${o.file_path}, which cannot be downloaded`);
			let s = await this.api.download(e.options, o.file_path);
			if (s.byteLength > 104857600) throw Error(`downloaded ${s.byteLength} bytes, more than ${rn}`);
			let c = await $n(this.siyuan, n(o.file_path), s, i);
			return this.siyuan.logger.debug(`[telegram] [media] saved ${r} (${s.byteLength} bytes) as ${c}`), c;
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [media] save ${r} failed, keep it as a placeholder:`, er(e));
			return;
		}
	}
}, ir = {
	offline: "Inbox offline: messages of this chat are not recorded for now (device: {{1}})",
	online: "Inbox online: messages of this chat are recorded in SiYuan (device: {{1}})"
};
function ar(e) {
	return e instanceof Error ? e.message : String(e);
}
var or = class {
	siyuan;
	api;
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	async send(e, t, n, r) {
		let i = this.text(n).replaceAll("{{1}}", () => r);
		await Promise.all([...new Set(t)].map((t) => this.sendTo(e, t, n, i)));
	}
	async sendTo(e, t, n, r) {
		try {
			await this.api.sendText(e, t, r), this.siyuan.logger.info(`[telegram] [notices] sent the ${n} notice to chat ${t}`);
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [notices] send the ${n} notice to chat ${t} failed:`, ar(e));
		}
	}
	text(e) {
		return this.siyuan.plugin.i18n?.notices?.telegram?.[e] || ir[e];
	}
};
//#endregion
//#region src/telegram/poller.ts
function sr(e) {
	return new Promise((t) => setTimeout(t, e));
}
function G(e) {
	return e instanceof Error ? e.message : String(e);
}
function cr(e, t) {
	return e.token === t.token && e.apiBaseUrl === t.apiBaseUrl;
}
var lr = class {
	siyuan;
	api;
	onUpdate;
	generation = 0;
	options;
	current = { status: "stopped" };
	constructor(e, t, n) {
		this.siyuan = e, this.api = t, this.onUpdate = n;
	}
	get state() {
		return { ...this.current };
	}
	update(e) {
		let t;
		try {
			t = ln(e);
		} catch (e) {
			this.stop(), this.siyuan.logger.error(`[telegram] ${G(e)}, skip receiving updates`), this.setState("failed", { error: G(e) });
			return;
		}
		if (!t) {
			this.stop(), this.siyuan.logger.info("[telegram] the token is not configured, skip receiving updates"), this.setState("unconfigured");
			return;
		}
		if (this.options && cr(this.options, t)) return;
		this.stop();
		let n = ++this.generation;
		this.options = t, this.run(n, t);
	}
	stop() {
		this.options && this.siyuan.logger.info(`[telegram] stop receiving the updates of bot ${B(this.options.token)}`), this.generation++, this.options = void 0, this.setState("stopped");
	}
	async run(e, t) {
		let n = B(t.token);
		this.siyuan.logger.info(`[telegram] start receiving the updates of bot ${n}`), this.setState("connecting");
		let r, i, a = 0;
		for (; e === this.generation;) try {
			if (!r) {
				let i = await this.api.getMe(t);
				if (e !== this.generation) return;
				r = i, this.siyuan.logger.info(`[telegram] bot ${n} is @${r.username ?? ""}`);
			}
			let o = this.current.status === "connected", s = await this.api.getUpdates(t, i, o ? 30 : 0);
			if (e !== this.generation) return;
			if (a = 0, o || this.setState("connected", r.username ? { username: r.username } : {}), s.length === 0) continue;
			i = Math.max(...s.map((e) => e.update_id)) + 1;
			let c = {
				options: t,
				me: r
			};
			for (let e of s) try {
				this.onUpdate(c, e);
			} catch (t) {
				this.siyuan.logger.warn(`[telegram] handle the update ${e.update_id} failed:`, G(t));
			}
		} catch (t) {
			if (e !== this.generation) return;
			if (t instanceof H && nn.has(t.code)) {
				this.siyuan.logger.error(`[telegram] ${t.message}, stop receiving the updates of bot ${n} until the settings change`), this.generation++, this.options = void 0, this.setState("failed", { error: t.message });
				return;
			}
			a = await this.wait(t, a);
		}
	}
	async wait(e, t) {
		let n = G(e), r = e instanceof H ? e.parameters.retry_after : void 0, i = en, a = t + 1;
		return r === void 0 ? a >= 3 && (i = tn, a = 0) : (i = r * 1e3, a = t), this.siyuan.logger.warn(`[telegram] ${n}, retry in ${i} ms`), this.setState("reconnecting", {
			error: n,
			retryAt: new Date(Date.now() + i).toISOString()
		}), await sr(i), a;
	}
	setState(e, t = {}) {
		this.current = {
			status: e,
			since: (/* @__PURE__ */ new Date()).toISOString(),
			...t
		};
	}
}, K = "https://ilinkai.weixin.qq.com", ur = "https://novac2c.cdn.weixin.qq.com/c2c", dr = "siyuan-plugin-im-bot", fr = 48e4, pr = 1e3, mr = 2e3, hr = 3e4, gr = 104857600, _r = /* @__PURE__ */ function(e) {
	return e[e.USER = 1] = "USER", e[e.BOT = 2] = "BOT", e;
}({}), vr = /* @__PURE__ */ function(e) {
	return e[e.NEW = 0] = "NEW", e[e.GENERATING = 1] = "GENERATING", e[e.FINISH = 2] = "FINISH", e;
}({}), q = /* @__PURE__ */ function(e) {
	return e[e.TEXT = 1] = "TEXT", e[e.IMAGE = 2] = "IMAGE", e[e.VOICE = 3] = "VOICE", e[e.FILE = 4] = "FILE", e[e.VIDEO = 5] = "VIDEO", e;
}({}), yr = /* @__PURE__ */ new Set([
	"\"message_id\"",
	"\"msg_id\"",
	"\"svr_id\""
]), br = /\s/, xr = /\d/;
function Sr(e) {
	return e instanceof Error ? e.message : String(e);
}
function Cr(e) {
	let t = [], n = 0, r = 0;
	for (; r < e.length;) {
		if (e[r] !== "\"") {
			r++;
			continue;
		}
		let i = r++;
		for (; r < e.length;) {
			let t = e[r++];
			if (t === "\\") r++;
			else if (t === "\"") break;
		}
		if (!yr.has(e.slice(i, r))) continue;
		let a = r;
		for (; br.test(e[a] ?? "");) a++;
		if (e[a] !== ":") continue;
		for (a++; br.test(e[a] ?? "");) a++;
		let o = a;
		e[a] === "-" && a++;
		let s = a;
		for (; xr.test(e[a] ?? "");) a++;
		a > s && (t.push(e.slice(n, o), "\"", e.slice(o, a), "\""), n = a, r = a);
	}
	return t.push(e.slice(n)), JSON.parse(t.join(""));
}
function wr(e) {
	let [t = 0, n = 0, r = 0] = e.split(".").map((e) => Number.parseInt(e, 10) || 0);
	return String((t & 255) << 16 | (n & 255) << 8 | r & 255);
}
function J(e) {
	return e.ret || e.errcode || 0;
}
function Tr(e, t) {
	return `${e.replace(/\/+$/, "")}/${t}`;
}
function Er() {
	return Math.floor(Math.random() * 4294967296);
}
function Dr() {
	return Buffer.from(String(Er()), "utf8").toString("base64");
}
var Or = class {
	siyuan;
	constructor(e) {
		this.siyuan = e;
	}
	async getQRCode() {
		return this.post("get_bot_qrcode", K, "ilink/bot/get_bot_qrcode?bot_type=3", { local_token_list: [] });
	}
	async getQRCodeStatus(e, t, n) {
		let r = `ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(t)}`;
		n && (r += `&verify_code=${encodeURIComponent(n)}`);
		try {
			let t = await A(this.siyuan, {
				url: Tr(e, r),
				method: "GET",
				headers: this.commonHeaders()
			});
			return this.parse("get_qrcode_status", t);
		} catch (e) {
			let n = Sr(e).replaceAll(encodeURIComponent(t), "***").replaceAll(t, "***");
			throw Error(n);
		}
	}
	async getUpdates(e, t) {
		return this.post("getupdates", e.baseUrl, "ilink/bot/getupdates", {
			get_updates_buf: t,
			base_info: this.baseInfo()
		}, e.token);
	}
	async sendText(e, t, n, r) {
		let i = await this.post("sendmessage", e.baseUrl, "ilink/bot/sendmessage", {
			msg: {
				from_user_id: "",
				to_user_id: t,
				client_id: `${dr}:${Date.now()}-${Er().toString(16).padStart(8, "0")}`,
				message_type: _r.BOT,
				message_state: vr.FINISH,
				item_list: [{
					type: q.TEXT,
					text_item: { text: n }
				}],
				context_token: r
			},
			base_info: this.baseInfo()
		}, e.token), a = J(i);
		if (a !== 0) throw Error(`sendmessage failed: ${a} ${i.errmsg ?? ""}`);
		return i.message_id;
	}
	async notify(e, t) {
		return this.post(`notify${t}`, e.baseUrl, `ilink/bot/msg/notify${t}`, { base_info: this.baseInfo() }, e.token);
	}
	version() {
		return this.siyuan.plugin.version || "0.0.0";
	}
	baseInfo() {
		let e = this.version();
		return {
			channel_version: e,
			bot_agent: `${dr}/${e}`
		};
	}
	commonHeaders() {
		return {
			"iLink-App-Id": ["bot"],
			"iLink-App-ClientVersion": [wr(this.version())]
		};
	}
	async post(e, t, n, r, i) {
		let a = {
			AuthorizationType: ["ilink_bot_token"],
			"X-WECHAT-UIN": [Dr()],
			...this.commonHeaders()
		};
		i && (a.Authorization = [`Bearer ${i}`]);
		let o = await A(this.siyuan, {
			url: Tr(t, n),
			method: "POST",
			headers: a,
			json: r
		});
		return this.parse(e, o);
	}
	parse(e, t) {
		if (t.status < 200 || t.status >= 300) throw Error(`${e} failed: HTTP ${t.status} ${t.body.slice(0, 200)}`);
		try {
			return Cr(t.body);
		} catch {
			throw Error(`${e} returned invalid JSON: ${t.body.slice(0, 200)}`);
		}
	}
}, kr = 32;
function Y(e) {
	return e.message_id?.trim() || e.item_list?.map((e) => e.msg_id?.trim()).find(Boolean) || void 0;
}
function Ar(e) {
	return e.item_list?.find((e) => e.ref_msg);
}
function jr(e) {
	let t = Ar(e)?.ref_msg;
	return t?.svr_id?.trim() || t?.message_item?.msg_id?.trim() || void 0;
}
function Mr(e, t) {
	switch (e.type) {
		case q.TEXT: return e.text_item?.text ?? "";
		case q.VOICE: return [t.voice, e.voice_item?.text].filter(Boolean).join(" ");
		case q.IMAGE: return t.image;
		case q.FILE: return [t.file, e.file_item?.file_name].filter(Boolean).join(" ");
		case q.VIDEO: return t.video;
		default: return "";
	}
}
function Nr(e, t) {
	return (e.item_list ?? []).map((e) => Mr(e, t).trim()).filter(Boolean).join(" ");
}
function Pr(e, t, n) {
	if (e.type === q.TEXT) return { inline: ve(e.text_item?.text ?? "") };
	if (n) switch (e.type) {
		case q.IMAGE: return { inline: x(n, t.image) };
		case q.VOICE: return { inline: `${C(t.voice, n)} ${_(e.voice_item?.text ?? "")}` };
		case q.FILE: return { inline: `${_(t.file)} ${C(e.file_item?.file_name?.trim() || n.replace(/^.*\//, ""), n)}` };
		case q.VIDEO: return { block: w(n) };
	}
	return { inline: _(Mr(e, t)) };
}
function Fr(e, t) {
	let n = Ar(e)?.ref_msg;
	return [n?.title?.trim(), n?.message_item ? Mr(n.message_item, t).trim() : ""].filter(Boolean).join(" | ");
}
function Ir(e) {
	let t = e.replace(/\s+/g, " ").trim();
	return t.length > kr ? `${t.slice(0, kr)}...` : t;
}
function Lr(e, t) {
	let { assets: n, labels: r, reference: i, referenceText: a } = t, o = [], s = (e.item_list ?? []).map((e, t) => Pr(e, r, n?.[t])).filter((e) => "block" in e || y(e.inline));
	if (Ar(e)) {
		let t = Fr(e, r);
		o.push(b([i ? Ee(i, Ir(t) || Ir(a ?? "") || r.quote) : _(t || r.quote)]));
	}
	return o.push(...s.map((e) => "block" in e ? e.block : y(e.inline))), v(o.length > 0 ? o : [_(r.unavailable)], {
		"custom-author-id": e.from_user_id,
		"custom-msg-id": Y(e)
	});
}
//#endregion
//#region src/weixin/inbox.ts
var Rr = "custom-msg-id", zr = 1024, Br = /(?:^|\s)assets\/\S*?\d{14}-[0-9a-z]{7}\S*/g;
function Vr(e) {
	return e instanceof Error ? e.message : String(e);
}
function Hr(e) {
	return e.replace(Br, " ").replace(/\s+/g, " ").trim();
}
var Ur = class {
	siyuan;
	api;
	writer;
	media;
	config;
	texts = /* @__PURE__ */ new Map();
	constructor(e, t, n, r, i) {
		this.siyuan = e, this.api = t, this.writer = n, this.media = r, this.config = i;
	}
	handle(e, t) {
		if (t.message_type !== _r.USER) return;
		let n = { ...this.config().inbox };
		n.enabled && n.doc && this.writer.enqueue(async () => {
			try {
				await this.write(e, n, t);
			} catch (e) {
				this.siyuan.logger.warn(`[weixin] [inbox] write the message ${Y(t)} to ${n.doc} failed:`, Vr(e));
			}
		});
	}
	async write(e, t, n) {
		let r = t.doc;
		await this.writer.prepare(r);
		let i = Y(n);
		if (i && await this.writer.findMessage(r, Rr, i)) {
			this.siyuan.logger.debug(`[weixin] [inbox] the message ${i} is already in ${r}, skip it`);
			return;
		}
		let a = this.labels(), o = jr(n), s = o ? await this.writer.findMessage(r, Rr, o) : void 0, c = {
			reference: s,
			referenceText: s ? this.texts.get(s) ?? Hr(await this.writer.blockText(s)) : void 0,
			labels: a
		}, { block: l } = await this.writer.appendToTemp(r, Lr(n, c));
		i && this.writer.remember(r, Rr, i, l), this.texts.set(l, Nr(n, a)), this.texts.size > zr && this.texts.delete(this.texts.keys().next().value), t.reply && this.reply(e, n, l), t.downloadAssets && await this.saveMedia(n, l, c), await this.writer.moveToDate(r, l, wt(n.create_time_ms));
	}
	async saveMedia(e, t, n) {
		let r = await this.media.save(e, t);
		if (r.length !== 0) try {
			await this.writer.updateBlock(t, Lr(e, {
				...n,
				assets: r
			}));
		} catch (n) {
			this.siyuan.logger.warn(`[weixin] [inbox] put the media of the message ${Y(e)} into the block ${t} failed:`, Vr(n));
		}
	}
	async reply(e, t, n) {
		let r = t.from_user_id;
		if (r) try {
			let i = await this.api.sendText(e, r, `siyuan://blocks/${n}`, t.context_token);
			i ? this.siyuan.logger.debug(`[weixin] [inbox] replied to the message ${Y(t)} with the block ${n}, reply ${i}`) : this.siyuan.logger.warn(`[weixin] [inbox] the reply to the message ${Y(t)} returned no message ID, it may not be delivered`);
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] [inbox] reply to the message ${Y(t)} with the block ${n} failed:`, Vr(e));
		}
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.inbox;
		return {
			quote: e?.quote || "Quoted message",
			unavailable: e?.unavailable || "[Message not available]",
			image: e?.image || "[Image]",
			voice: e?.voice || "[Voice]",
			file: e?.file || "[File]",
			video: e?.video || "[Video]"
		};
	}
}, Wr = /* @__PURE__ */ new Set([
	"need_verifycode",
	"scaned",
	"verifying",
	"wait"
]), Gr = /^\d{1,16}$/;
function Kr(e) {
	return new Promise((t) => setTimeout(t, e));
}
function X(e) {
	return e instanceof Error ? e.message : String(e);
}
function qr(e) {
	return e?.startsWith("https://") ? e : K;
}
var Jr = class {
	siyuan;
	api;
	onConfirmed;
	session = 0;
	state = { status: "idle" };
	qrcode = "";
	codes = 0;
	baseUrl = K;
	verifyCode;
	constructor(e, t, n) {
		this.siyuan = e, this.api = t, this.onConfirmed = n;
	}
	current() {
		return { ...this.state };
	}
	async start() {
		let e = ++this.session;
		this.codes = 0, this.verifyCode = void 0, this.state = { status: "wait" };
		try {
			await this.refresh(e);
		} catch (t) {
			return e === this.session && this.finish({
				status: "failed",
				error: X(t)
			}), this.current();
		}
		return e === this.session && this.poll(e), this.current();
	}
	verify(e) {
		if (this.state.status !== "need_verifycode") throw Error(`the login is not waiting for a verify code, its status is ${this.state.status}`);
		let t = typeof e == "string" ? e.trim() : "";
		if (!Gr.test(t)) throw Error("the verify code must be digits");
		return this.verifyCode = t, this.state = {
			...this.state,
			status: "verifying"
		}, this.current();
	}
	cancel() {
		return Wr.has(this.state.status) && this.finish({ status: "cancelled" }), this.current();
	}
	finish(e) {
		this.session++, this.qrcode = "", this.verifyCode = void 0, this.state = e;
	}
	async refresh(e) {
		if (this.codes >= 3) return !1;
		let t = await this.api.getQRCode();
		if (e !== this.session) return !0;
		let n = J(t);
		if (n !== 0 || !t.qrcode || !t.qrcode_img_content) throw Error(`get_bot_qrcode returned no QR code: ${n} ${t.errmsg ?? ""}`);
		return this.codes++, this.qrcode = t.qrcode, this.baseUrl = K, this.verifyCode = void 0, this.state = {
			status: "wait",
			url: t.qrcode_img_content
		}, !0;
	}
	async poll(e) {
		let t = Date.now() + fr;
		for (; e === this.session;) {
			if (Date.now() >= t) {
				this.siyuan.logger.info("[weixin] [login] timed out waiting for the QR code to be scanned"), this.finish({ status: "expired" });
				return;
			}
			if (this.state.status === "need_verifycode") {
				await Kr(pr);
				continue;
			}
			let n = this.verifyCode, r;
			try {
				r = await this.api.getQRCodeStatus(this.baseUrl, this.qrcode, n);
			} catch (e) {
				this.siyuan.logger.debug("[weixin] [login] query the QR code status failed, retry:", X(e)), r = { status: "wait" };
			}
			if (e !== this.session) return;
			try {
				if (await this.handle(e, r, n)) return;
			} catch (t) {
				e === this.session && (this.siyuan.logger.warn("[weixin] [login] login failed:", X(t)), this.finish({
					status: "failed",
					error: X(t)
				}));
				return;
			}
			await Kr(pr);
		}
	}
	async handle(e, t, n) {
		switch (t.status) {
			case "wait": return !1;
			case "scaned":
			case "scaned_but_redirect": return n !== void 0 && this.verifyCode === n && (this.verifyCode = void 0), t.status === "scaned_but_redirect" && t.redirect_host && (this.baseUrl = `https://${t.redirect_host}`), this.state = {
				...this.state,
				status: "scaned",
				wrongCode: !1
			}, !1;
			case "need_verifycode": return this.verifyCode = void 0, this.state = {
				...this.state,
				status: "need_verifycode",
				wrongCode: n !== void 0
			}, !1;
			case "expired":
			case "verify_code_blocked": return this.siyuan.logger.info(`[weixin] [login] ${t.status}, get a new QR code`), !await this.refresh(e) && (this.finish(t.status === "expired" ? { status: "expired" } : {
				status: "failed",
				error: "verify_code_blocked"
			}), !0);
			case "confirmed": return await this.confirm(e, t), !0;
			case "binded_redirect": throw Error("binded_redirect: the bot is already bound to this client");
			default: return this.siyuan.logger.debug(`[weixin] [login] unknown QR code status ${String(t.status)}, code ${J(t)}`), !1;
		}
	}
	async confirm(e, t) {
		if (!t.bot_token || !t.ilink_bot_id) throw Error("the login is confirmed without bot_token or ilink_bot_id");
		let n = await this.onConfirmed({
			botId: t.ilink_bot_id,
			token: t.bot_token,
			baseUrl: qr(t.baseurl),
			userId: t.ilink_user_id ?? ""
		});
		this.siyuan.logger.info(`[weixin] [login] confirmed, bot ${n.botId}, user ${n.userId}`), e === this.session && this.finish({
			status: "confirmed",
			account: n
		});
	}
}, Yr = {
	[q.IMAGE]: "image",
	[q.VOICE]: "voice",
	[q.FILE]: "file",
	[q.VIDEO]: "video"
}, Xr = {
	image: [
		[
			".jpg",
			0,
			"ÿØÿ"
		],
		[
			".png",
			0,
			"PNG"
		],
		[
			".gif",
			0,
			"GIF8"
		],
		[
			".webp",
			8,
			"WEBP"
		],
		[
			".bmp",
			0,
			"BM"
		]
	],
	voice: [
		[
			".silk",
			0,
			"#!SILK"
		],
		[
			".silk",
			1,
			"#!SILK"
		],
		[
			".amr",
			0,
			"#!AMR"
		],
		[
			".mp3",
			0,
			"ID3"
		],
		[
			".ogg",
			0,
			"OggS"
		],
		[
			".wav",
			8,
			"WAVE"
		]
	],
	video: [[
		".mp4",
		4,
		"ftyp"
	]]
}, Zr = {
	image: ".jpg",
	voice: ".silk",
	video: ".mp4"
}, Qr = /^[0-9a-f]{32}$/i;
function $r(e) {
	return e instanceof Error ? e.message : String(e);
}
function ei(e) {
	return Buffer.from(e).toString("hex");
}
function Z(e, t) {
	if (e) {
		if (!Qr.test(e)) throw Error("aeskey is not a 32-character hex string");
		return new Uint8Array(Buffer.from(e, "hex"));
	}
	if (!t) return;
	let n = Buffer.from(t, "base64");
	if (n.length === 16) return new Uint8Array(n);
	let r = n.toString("utf8");
	if (Qr.test(r)) return new Uint8Array(Buffer.from(r, "hex"));
	throw Error(`aes_key decodes to ${n.length} bytes, neither a 16-byte key nor a 32-character hex string`);
}
function ti(e) {
	switch (e.type) {
		case q.IMAGE: {
			let t = e.image_item;
			return t?.media ? {
				kind: "image",
				media: t.media,
				key: Z(t.aeskey, t.media.aes_key),
				name: "image",
				size: t.hd_size || t.mid_size
			} : void 0;
		}
		case q.VOICE: {
			let t = e.voice_item?.media;
			return t?.aes_key ? {
				kind: "voice",
				media: t,
				key: Z(void 0, t.aes_key),
				name: "voice"
			} : void 0;
		}
		case q.FILE: {
			let t = e.file_item;
			return t?.media?.aes_key ? {
				kind: "file",
				media: t.media,
				key: Z(void 0, t.media.aes_key),
				name: t.file_name?.trim() || "file",
				size: Number(t.len) || void 0,
				md5: t.md5
			} : void 0;
		}
		case q.VIDEO: {
			let t = e.video_item;
			return t?.media?.aes_key ? {
				kind: "video",
				media: t.media,
				key: Z(void 0, t.media.aes_key),
				name: "video",
				size: t.video_size,
				md5: t.video_md5
			} : void 0;
		}
		default: return;
	}
}
function ni(e) {
	return e.full_url?.startsWith("https://") ? e.full_url : e.encrypt_query_param ? `${ur}/download?encrypted_query_param=${encodeURIComponent(e.encrypt_query_param)}` : void 0;
}
function ri(e, t) {
	let n = new Uint8Array(t, 0, Math.min(t.byteLength, 16));
	return Xr[e].find(([, e, t]) => t.split("").every((t, r) => n[e + r] === t.charCodeAt(0)))?.[0] ?? Zr[e];
}
var ii = class {
	siyuan;
	support;
	constructor(e) {
		this.siyuan = e;
	}
	async save(e, t) {
		let n = e.item_list ?? [];
		if (!n.some((e) => Yr[e.type ?? 0])) return [];
		this.support ??= this.probe();
		let r = await this.support;
		if (!r) return [];
		let i = [];
		for (let a of n) i.push(await this.saveItem(r, e, a, t));
		return i.some(Boolean) ? i : [];
	}
	async probe() {
		let e = this.siyuan.crypto?.subtle;
		if (!e) {
			this.siyuan.logger.info("[weixin] [media] siyuan.crypto is not available in this version of SiYuan, keep the media of messages as placeholders");
			return;
		}
		try {
			return await e.importKey("raw", /* @__PURE__ */ new Uint8Array(16), { name: "AES-ECB" }, !1, ["decrypt"]), e;
		} catch (e) {
			this.siyuan.logger.info("[weixin] [media] siyuan.crypto of this version of SiYuan does not support AES-ECB, keep the media of messages as placeholders:", $r(e));
			return;
		}
	}
	async saveItem(e, t, n, r) {
		let i = Yr[n.type ?? 0];
		if (!i) return;
		let a = `the ${i} of the message ${Y(t)}`;
		try {
			let t = ti(n), i = t && ni(t.media);
			if (!t || !i) return;
			if (t.size && t.size > 104857600) {
				this.siyuan.logger.warn(`[weixin] [media] ${a} has ${t.size} bytes, more than ${gr}, keep it as a placeholder`);
				return;
			}
			let o = await Qe(this.siyuan, {
				url: i,
				method: "GET"
			});
			if (o.status < 200 || o.status >= 300) throw Error(`the CDN responded ${o.status}`);
			if (o.body.byteLength > 104857600) throw Error(`downloaded ${o.body.byteLength} bytes, more than ${gr}`);
			let s = t.key ? await this.decrypt(e, t.key, o.body) : o.body;
			await this.verify(e, s, t.md5, a);
			let c = t.kind === "file" ? t.name : `${t.name}${ri(t.kind, s)}`, l = await $n(this.siyuan, c, s, r);
			return this.siyuan.logger.debug(`[weixin] [media] saved ${a} (${s.byteLength} bytes) as ${l}`), l;
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] [media] save ${a} failed, keep it as a placeholder:`, $r(e));
			return;
		}
	}
	async decrypt(e, t, n) {
		let r = await e.importKey("raw", t, { name: "AES-ECB" }, !1, ["decrypt"]);
		return e.decrypt({ name: "AES-ECB" }, r, n);
	}
	async verify(e, t, n, r) {
		if (!n) return;
		let i;
		try {
			i = ei(await e.digest("MD5", t));
		} catch (e) {
			this.siyuan.logger.debug(`[weixin] [media] skip checking the MD5 of ${r}:`, $r(e));
			return;
		}
		i !== n.trim().toLowerCase() && this.siyuan.logger.warn(`[weixin] [media] the MD5 of ${r} is ${i}, but the message says ${n}`);
	}
}, Q = "weixin/cursor.json";
function ai(e) {
	return new Promise((t) => setTimeout(t, e));
}
function $(e) {
	return e instanceof Error ? e.message : String(e);
}
function oi(e, t) {
	return e.botId === t.botId && e.token === t.token && e.baseUrl === t.baseUrl && e.userId === t.userId;
}
var si = class {
	siyuan;
	api;
	onMessage;
	onExpired;
	generation = 0;
	account;
	constructor(e, t, n, r) {
		this.siyuan = e, this.api = t, this.onMessage = n, this.onExpired = r;
	}
	get running() {
		return this.account !== void 0;
	}
	start(e) {
		if (this.account && oi(this.account, e)) return;
		this.stop();
		let t = ++this.generation;
		this.account = e, this.run(t, e);
	}
	async stop() {
		let e = this.account;
		e && (this.generation++, this.account = void 0, this.siyuan.logger.info(`[weixin] stop receiving the messages of bot ${e.botId}`), await this.notify(e, "stop"));
	}
	async removeCursor() {
		try {
			await this.siyuan.storage.remove(Q);
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] remove ${Q} failed:`, $(e));
		}
	}
	async run(e, t) {
		this.siyuan.logger.info(`[weixin] start receiving the messages of bot ${t.botId}`), await this.notify(t, "start");
		let n = await this.loadCursor(t), r = 0;
		for (; e === this.generation;) {
			let i;
			try {
				i = await this.api.getUpdates(t, n);
			} catch (t) {
				if (e !== this.generation) return;
				r = await this.backoff(r, `getupdates failed: ${$(t)}`);
				continue;
			}
			if (e !== this.generation) return;
			let a = J(i);
			if (a === -14) {
				this.siyuan.logger.error(`[weixin] the login of bot ${t.botId} expired (${i.errmsg ?? ""}), stop receiving messages until the QR code is scanned again`), this.generation++, this.account = void 0, this.onExpired(t);
				return;
			}
			if (a !== 0) {
				r = await this.backoff(r, `getupdates failed: ${a} ${i.errmsg ?? ""}`);
				continue;
			}
			r = 0, i.get_updates_buf && i.get_updates_buf !== n && (n = i.get_updates_buf, await this.saveCursor(t, n));
			for (let e of i.msgs ?? []) try {
				this.onMessage(t, e);
			} catch (t) {
				this.siyuan.logger.warn(`[weixin] handle the message ${e.message_id} failed:`, $(t));
			}
		}
	}
	async backoff(e, t) {
		let n = e + 1;
		return n >= 3 ? (this.siyuan.logger.warn(`[weixin] ${t}, ${n} consecutive failures, retry in ${hr} ms`), await ai(hr), 0) : (this.siyuan.logger.warn(`[weixin] ${t}, retry in ${mr} ms`), await ai(mr), n);
	}
	async notify(e, t) {
		try {
			let n = await this.api.notify(e, t), r = J(n);
			r !== 0 && this.siyuan.logger.warn(`[weixin] notify${t} failed: ${r} ${n.errmsg ?? ""}`);
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] notify${t} failed:`, $(e));
		}
	}
	async loadCursor(e) {
		try {
			let t = await (await this.siyuan.storage.get(Q)).json();
			return t?.botId === e.botId && t.loginTime === e.loginTime && typeof t.cursor == "string" ? t.cursor : "";
		} catch {
			return "";
		}
	}
	async saveCursor(e, t) {
		let n = {
			botId: e.botId,
			loginTime: e.loginTime,
			cursor: t
		};
		try {
			await this.siyuan.storage.put(Q, JSON.stringify(n));
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] save ${Q} failed:`, $(e));
		}
	}
}, ci = 1e3, li = 5e3, ui = "logs/weixin/messages", di = "logs/telegram/updates";
function fi(e) {
	return e instanceof Error ? e.message : String(e);
}
function pi(e) {
	let t = e, n = [
		"botId",
		"token",
		"baseUrl",
		"device",
		"loginTime"
	].filter((e) => typeof t?.[e] != "string" || !t[e]);
	if (!t || n.length > 0) throw Error(`missing ${n.join(", ")}`);
	return {
		botId: t.botId,
		token: t.token,
		baseUrl: t.baseUrl,
		userId: typeof t.userId == "string" ? t.userId : "",
		device: t.device,
		deviceName: typeof t.deviceName == "string" ? t.deviceName : "",
		loginTime: t.loginTime
	};
}
function mi(e) {
	return JSON.stringify(e, (e, t) => {
		if (!t || typeof t != "object" || Array.isArray(t)) return t;
		let n = {};
		for (let e of Object.keys(t).sort()) n[e] = t[e];
		return n;
	});
}
function hi(e, t) {
	return new Promise((n) => {
		let r = setTimeout(n, t), i = () => {
			clearTimeout(r), n();
		};
		e.then(i, i);
	});
}
new class {
	siyuan = siyuan;
	writer;
	openapi;
	qq;
	inbox;
	commands;
	panels;
	notices;
	users;
	weixinApi;
	weixinLogin;
	weixinPoller;
	weixinMedia;
	weixinInbox;
	telegramApi;
	telegramPoller;
	telegramMedia;
	telegramInbox;
	telegramCommands;
	telegramNotices;
	config = p();
	weixinAccount;
	weixinRunning;
	weixinExpired;
	weixinReloadTimer;
	device = "";
	deviceName = "";
	running;
	telegramRunning;
	panelsSynced;
	reloadTimer;
	constructor() {
		this.writer = new Et(this.siyuan, () => this.config.qq.inbox.downloadAssets), this.openapi = new nt(this.siyuan), this.qq = new gt(this.siyuan, this.openapi, this.onQQDispatch.bind(this)), this.inbox = new At(this.siyuan, this.openapi, this.writer, () => this.config.qq), this.commands = new lt(this.siyuan, this.openapi, () => this.config.qq), this.panels = new zt(this.siyuan, this.openapi), this.notices = new Nt(this.siyuan, this.openapi), this.users = new Zt(this.siyuan, () => this.config.qq), this.weixinApi = new Or(this.siyuan), this.weixinLogin = new Jr(this.siyuan, this.weixinApi, this.onWeixinLogin.bind(this)), this.weixinPoller = new si(this.siyuan, this.weixinApi, this.onWeixinMessage.bind(this), this.onWeixinExpired.bind(this)), this.weixinMedia = new ii(this.siyuan), this.weixinInbox = new Ur(this.siyuan, this.weixinApi, this.writer, this.weixinMedia, () => this.config.weixin), this.telegramApi = new un(this.siyuan), this.telegramPoller = new lr(this.siyuan, this.telegramApi, this.onTelegramUpdate.bind(this)), this.telegramMedia = new rr(this.siyuan, this.telegramApi), this.telegramInbox = new Zn(this.siyuan, this.telegramApi, this.writer, this.telegramMedia, () => this.config.telegram), this.telegramCommands = new qn(this.siyuan, this.telegramApi), this.telegramNotices = new or(this.siyuan, this.telegramApi), this.siyuan.event.handler = this.onEvent.bind(this), this.siyuan.plugin.lifecycle.onload = this.onload.bind(this), this.siyuan.plugin.lifecycle.onrunning = this.onrunning.bind(this), this.siyuan.plugin.lifecycle.onunload = this.onunload.bind(this);
	}
	async onload() {
		await this.loadConfig();
		let e = await this.loadDevice();
		this.device = e.id, this.deviceName = e.name, await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config, then connect or disconnect the QQ bot and start or stop receiving WeChat and Telegram messages as the new config says."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.CALL_QQ_API, this.rpcCallQQApi.bind(this), "Call a QQ bot OpenAPI endpoint as the configured bot. Params: url (a path starting with /), method (GET, POST, PUT, PATCH or DELETE), body (optional, sent as JSON). Returns the response { status, headers, body }."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.GET_USERS, this.rpcGetUsers.bind(this), "Get the known groups and C2C users of the configured bot from users.json, including the changes not written yet. Returns { groups, users }, keyed by group_openid and user_openid."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.QQ_GET_STATE, this.rpcQQGetState.bind(this), "Get the connection state of the QQ bot on this device. Returns { status, since?, username?, error?, retryAt?, device? }."), await this.loadWeixinAccount(), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT, this.rpcWeixinGetAccount.bind(this), "Get the WeChat bot login without its token, or null when not logged in. Returns { botId, userId, device, deviceName, loginTime, expiredAt?, running }."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START, this.rpcWeixinLoginStart.bind(this), "Start a WeChat QR code login and cancel the current one. Returns the login state { status, url?, wrongCode?, error?, account? }, where url is the link to show as a QR code."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE, this.rpcWeixinLoginState.bind(this), "Get the state of the WeChat QR code login."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY, this.rpcWeixinLoginVerify.bind(this), "Submit the digits shown on the phone when the WeChat login status is need_verifycode. Params: code. Returns the login state."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL, this.rpcWeixinLoginCancel.bind(this), "Cancel the WeChat QR code login. Returns the login state."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.WEIXIN_LOGOUT, this.rpcWeixinLogout.bind(this), "Log out of WeChat: stop receiving messages and remove the login from weixin.json."), await this.siyuan.rpc.bind(m.KERNEL_RPC_METHOD.TELEGRAM_GET_STATE, this.rpcTelegramGetState.bind(this), "Get the connection state of the Telegram bot on this device. Returns { status, since?, username?, error?, retryAt?, device? }."), await this.siyuan.storage.watcher.add(".");
	}
	async onrunning() {
		await this.applyConfig();
	}
	async onunload() {
		await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.UPDATE_CONFIG), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.CALL_QQ_API), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.GET_USERS), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.QQ_GET_STATE), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.WEIXIN_LOGOUT), await this.siyuan.rpc.unbind(m.KERNEL_RPC_METHOD.TELEGRAM_GET_STATE), clearTimeout(this.reloadTimer), clearTimeout(this.weixinReloadTimer), this.weixinLogin.cancel(), await Promise.all([
			hi(this.running ? this.notify("offline") : Promise.resolve(), li),
			hi(this.telegramRunning ? this.notifyTelegram("offline") : Promise.resolve(), li),
			hi(this.weixinPoller.stop(), li)
		]), this.telegramPoller.stop(), await this.qq.stop(), await this.users.flush(), await this.siyuan.storage.watcher.remove(".");
	}
	async applyConfig() {
		this.applyWeixin(), this.applyTelegram(), await this.applyQQ();
	}
	applyTelegram() {
		let { device: e, online: t } = this.config.telegram, n = t && (!e || e === this.device), r = this.telegramRunning;
		n !== r && (this.siyuan.logger.info(n ? `[telegram] run the Telegram bot on this device ${this.device}` : t ? `[telegram] the Telegram bot runs on device ${e} only, not on this device ${this.device}` : "[telegram] the Telegram bot is offline"), this.telegramRunning = n), n ? (this.telegramPoller.update(this.config.telegram), r || this.notifyTelegram("online")) : (r && this.notifyTelegram("offline"), this.telegramPoller.stop());
	}
	async notifyTelegram(e) {
		let t;
		try {
			t = ln(this.config.telegram);
		} catch {
			return;
		}
		let n = Xn(this.config.telegram.inbox).filter((e) => e.notify).map((e) => e.chat);
		t && n.length !== 0 && await this.telegramNotices.send(t, n, e, this.deviceName || this.device);
	}
	async applyQQ() {
		let { device: e, online: t } = this.config.qq, n = t && (!e || e === this.device), r = this.running;
		n !== r && (this.siyuan.logger.info(n ? `[qq] run the QQ bot on this device ${this.device}` : t ? `[qq] the QQ bot runs on device ${e} only, not on this device ${this.device}` : "[qq] the QQ bot is offline"), this.running = n), n ? (await this.qq.update(this.config.qq), this.syncPanels(), r || this.notify("online")) : (r && this.notify("offline"), await this.qq.stop());
	}
	syncPanels() {
		let e = j(this.config.qq);
		if (!e) return;
		let t = this.config.qq.panels, n = mi([e, t]);
		n !== this.panelsSynced && (this.panelsSynced = n, this.panels.sync(e, [t.c2c, t.group]).then((e) => {
			!e && this.panelsSynced === n && (this.panelsSynced = void 0);
		}));
	}
	async notify(e) {
		let t = j(this.config.qq), n = kt(this.config.qq.inbox).filter((e) => e.notify).map((e) => e.group);
		t && n.length !== 0 && await this.notices.send(t, n, e, this.deviceName || this.device);
	}
	onEvent(e) {
		if (e.type === "fs-notify") switch (e.detail?.path) {
			case m.GLOBAL_CONFIG_NAME:
				clearTimeout(this.reloadTimer), this.reloadTimer = setTimeout(async () => {
					await this.loadConfig(), await this.applyConfig();
				}, ci);
				break;
			case m.WEIXIN_ACCOUNT_FILE_NAME: clearTimeout(this.weixinReloadTimer), this.weixinReloadTimer = setTimeout(async () => {
				await this.loadWeixinAccount(), this.applyWeixin();
			}, ci);
		}
	}
	weixinExpiredAt(e) {
		return this.weixinExpired?.token === e.token ? this.weixinExpired.time : void 0;
	}
	applyWeixin() {
		let e = this.weixinAccount, t = this.config.weixin.online, n = e && this.weixinExpiredAt(e), r = t && !!e && !n && e.device === this.device;
		e && r !== this.weixinRunning && this.siyuan.logger.info(r ? `[weixin] receive the messages of bot ${e.botId} on this device ${this.device}` : n ? `[weixin] the login of bot ${e.botId} expired at ${n}, scan the QR code again` : t ? `[weixin] bot ${e.botId} receives messages on device ${e.device} only, not on this device ${this.device}` : `[weixin] bot ${e.botId} is offline`), this.weixinRunning = r, r ? this.weixinPoller.start(e) : this.weixinPoller.stop();
	}
	async loadWeixinAccount() {
		let e;
		try {
			e = await this.siyuan.storage.get(m.WEIXIN_ACCOUNT_FILE_NAME);
		} catch {
			this.weixinAccount = void 0;
			return;
		}
		try {
			this.weixinAccount = pi(await e.json());
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] ${m.WEIXIN_ACCOUNT_FILE_NAME} is invalid, treat it as logged out:`, fi(e)), this.weixinAccount = void 0;
		}
	}
	async saveWeixinAccount(e) {
		await this.siyuan.storage.put(m.WEIXIN_ACCOUNT_FILE_NAME, JSON.stringify(e, void 0, 4)), this.weixinAccount = e;
	}
	weixinAccountState(e) {
		return {
			botId: e.botId,
			userId: e.userId,
			device: e.device,
			deviceName: e.deviceName,
			loginTime: e.loginTime,
			expiredAt: this.weixinExpiredAt(e),
			running: this.weixinPoller.running
		};
	}
	async loadDevice() {
		try {
			let e = (await (await this.siyuan.client.fetch("/api/system/getConf", {
				method: "POST",
				body: "{}"
			})).json()).data?.conf?.system;
			return {
				id: e?.id ?? "",
				name: e?.name ?? ""
			};
		} catch (e) {
			return this.siyuan.logger.warn("get the device ID failed:", String(e)), {
				id: "",
				name: ""
			};
		}
	}
	async loadConfig() {
		try {
			let e = await this.siyuan.storage.get(m.GLOBAL_CONFIG_NAME);
			this.config = p(await e.json());
		} catch (e) {
			this.siyuan.logger.info(`load ${m.GLOBAL_CONFIG_NAME} failed, keep the current config:`, String(e));
		}
	}
	async rpcUpdateConfig(e) {
		this.config = p(e), await this.applyConfig();
	}
	async rpcCallQQApi(e, t, n) {
		let r = et(e, t, n), i = j(this.config.qq);
		if (!i) throw Error("QQ_BOT_APPID or QQ_BOT_SECRET is not configured");
		return this.openapi.request(i, r);
	}
	async rpcGetUsers() {
		let e = this.config.qq.appid.trim();
		if (!e) throw Error("QQ_BOT_APPID is not configured");
		return this.users.list(e);
	}
	rpcQQGetState() {
		let { device: e, online: t } = this.config.qq;
		return t ? e && e !== this.device ? {
			status: "other-device",
			device: e
		} : this.qq.state : { status: "offline" };
	}
	rpcTelegramGetState() {
		let { device: e, online: t } = this.config.telegram;
		return t ? e && e !== this.device ? {
			status: "other-device",
			device: e
		} : this.telegramPoller.state : { status: "offline" };
	}
	rpcWeixinGetAccount() {
		return this.weixinAccount ? this.weixinAccountState(this.weixinAccount) : null;
	}
	async rpcWeixinLoginStart() {
		return this.weixinLogin.start();
	}
	rpcWeixinLoginState() {
		return this.weixinLogin.current();
	}
	rpcWeixinLoginVerify(e) {
		return this.weixinLogin.verify(e);
	}
	rpcWeixinLoginCancel() {
		return this.weixinLogin.cancel();
	}
	async rpcWeixinLogout() {
		this.weixinLogin.cancel();
		let e = this.weixinAccount;
		this.weixinAccount = void 0, this.weixinRunning = !1, await this.weixinPoller.stop(), await this.siyuan.storage.remove(m.WEIXIN_ACCOUNT_FILE_NAME), await this.weixinPoller.removeCursor(), this.siyuan.logger.info(`[weixin] logged out${e ? ` of bot ${e.botId}` : ""}`);
	}
	async onWeixinLogin(e) {
		let t = {
			...e,
			device: this.device,
			deviceName: this.deviceName,
			loginTime: (/* @__PURE__ */ new Date()).toISOString()
		};
		return await this.saveWeixinAccount(t), this.applyWeixin(), this.weixinAccountState(t);
	}
	onWeixinExpired(e) {
		this.weixinExpired = {
			token: e.token,
			time: (/* @__PURE__ */ new Date()).toISOString()
		}, this.applyWeixin();
	}
	onWeixinMessage(e, t) {
		this.siyuan.logger.info("[weixin] message", t), this.config.weixin.eventLog && this.writeWeixinMessageLog(t), this.weixinInbox.handle(e, t);
	}
	async writeWeixinMessageLog(e) {
		let t = Y(e)?.replace(/[^\w-]/g, "_");
		if (!t) {
			this.siyuan.logger.debug("[weixin] the message has no message ID, skip the message log");
			return;
		}
		let n = `${ui}/${t}.json`;
		try {
			await this.siyuan.storage.put(n, JSON.stringify(e));
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] write message log ${n} failed:`, fi(e));
		}
	}
	onTelegramUpdate(e, t) {
		this.siyuan.logger.info("[telegram] update", t), this.config.telegram.eventLog && this.writeTelegramUpdateLog(e, t);
		let n = t.message ?? t.channel_post;
		n && (n.migrate_to_chat_id && this.siyuan.logger.warn(`[telegram] group ${n.chat.id} was upgraded to supergroup ${n.migrate_to_chat_id}, bind the new chat ID to keep recording its messages`), this.telegramInbox.handle(e, n, t.update_id), this.telegramCommands.handle(e, n));
		let r = t.my_chat_member;
		r && this.siyuan.logger.info(`[telegram] the bot is ${r.new_chat_member.status} in ${r.chat.type} chat ${r.chat.id} (${r.chat.title ?? r.chat.username ?? ""})`);
	}
	async writeTelegramUpdateLog(e, t) {
		let n = `${di}/${e.me.id}/${t.update_id}.json`;
		try {
			await this.siyuan.storage.put(n, JSON.stringify(t));
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] write update log ${n} failed:`, fi(e));
		}
	}
	onQQDispatch(e) {
		this.siyuan.logger.info("[qq] event", e.t, e), this.config.qq.eventLog && this.writeEventLog(e), this.inbox.handle(e), this.commands.handle(e), this.users.handle(e);
	}
	async writeEventLog(e) {
		let t = ft(e);
		if (!t) {
			this.siyuan.logger.debug("[qq] the event has no event ID, skip the event log:", e.t);
			return;
		}
		try {
			await this.siyuan.storage.put(t, JSON.stringify(e));
		} catch (e) {
			this.siyuan.logger.warn(`[qq] write event log ${t} failed:`, String(e));
		}
	}
}();
//#endregion
