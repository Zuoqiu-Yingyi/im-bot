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
		return t.clone !== !1 && t.isMergeableObject(e) ? m(s(e), e, t) : e;
	}
	function l(e, t, n) {
		return e.concat(t).map(function(e) {
			return c(e, n);
		});
	}
	function u(e, t) {
		if (!t.customMerge) return m;
		var n = t.customMerge(e);
		return typeof n == "function" ? n : m;
	}
	function d(e) {
		return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(e).filter(function(t) {
			return Object.propertyIsEnumerable.call(e, t);
		}) : [];
	}
	function f(e) {
		return Object.keys(e).concat(d(e));
	}
	function ee(e, t) {
		try {
			return t in e;
		} catch {
			return !1;
		}
	}
	function te(e, t) {
		return ee(e, t) && !(Object.hasOwnProperty.call(e, t) && Object.propertyIsEnumerable.call(e, t));
	}
	function p(e, t, n) {
		var r = {};
		return n.isMergeableObject(e) && f(e).forEach(function(t) {
			r[t] = c(e[t], n);
		}), f(t).forEach(function(i) {
			te(e, i) || (r[i] = ee(e, i) && n.isMergeableObject(t[i]) ? u(i, n)(e[i], t[i], n) : c(t[i], n));
		}), r;
	}
	function m(e, t, r) {
		r ||= {}, r.arrayMerge = r.arrayMerge || l, r.isMergeableObject = r.isMergeableObject || n, r.cloneUnlessOtherwiseSpecified = c;
		var i = Array.isArray(t);
		return i === Array.isArray(e) ? i ? r.arrayMerge(e, t, r) : p(e, t, r) : c(t, r);
	}
	m.all = function(e, t) {
		if (!Array.isArray(e)) throw Error("first argument should be an array");
		return e.reduce(function(e, n) {
			return m(e, n, t);
		}, {});
	}, t.exports = m;
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
		eventLog: !1,
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
		botId: "",
		online: !1,
		eventLog: !1,
		inbox: {
			doc: "",
			enabled: !0,
			reply: !1,
			downloadAssets: !0
		}
	},
	telegram: {
		token: "",
		botId: "",
		apiBaseUrl: "",
		online: !1,
		eventLog: !1,
		device: "",
		inbox: {
			bindings: [],
			downloadAssets: !0
		}
	},
	feishu: {
		appId: "",
		appSecret: "",
		apiBaseUrl: "",
		online: !1,
		eventLog: !1,
		device: "",
		inbox: {
			bindings: [],
			downloadAssets: !0
		}
	}
}, d = {
	chat: "",
	doc: "",
	enabled: !1,
	reply: !1,
	notify: !1
}, f = {
	chat: "",
	doc: "",
	enabled: !1,
	reply: !1,
	notify: !1
}, ee = {
	chat: "",
	doc: "",
	enabled: !1,
	reply: !1,
	notify: !1
};
function te(...e) {
	let t = l(u, ...e);
	return t.qq.inbox.bindings = t.qq.inbox.bindings.map((e) => ({
		...d,
		...e
	})), t.telegram.inbox.bindings = t.telegram.inbox.bindings.map((e) => ({
		...f,
		...e
	})), t.feishu.inbox.bindings = t.feishu.inbox.bindings.map((e) => ({
		...ee,
		...e
	})), t;
}
//#endregion
//#region src/constants.ts
var p = {
	GLOBAL_CONFIG_NAME: "config.json",
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
		TELEGRAM_GET_STATE: "telegram-get-state",
		FEISHU_GET_STATE: "feishu-get-state"
	}
}, m = 1e4, ne = "siyuan-proxy-";
function h(e) {
	try {
		return JSON.parse(e);
	} catch {
		return;
	}
}
function re(e) {
	return Buffer.from(e, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function ie(e) {
	return e.replace(/([?&][uh]=)[\w-]+/g, "$1***");
}
function ae(e, t) {
	let n = t.headers ? `&h=${re(JSON.stringify(t.headers))}` : "";
	return e.client.fetch(`/api/network/proxy?u=${re(t.url)}&t=${m}ms${n}`, t.json === void 0 ? { method: t.method } : {
		method: t.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t.json)
	});
}
function oe(e, t, n) {
	if (!t.headers["Content-Type"]?.startsWith("application/octet-stream")) {
		let r = n(), i = h(r);
		throw Error(`proxy ${e.method} ${e.url} failed: ${t.status} ${i?.msg ?? r}`);
	}
	let r = {};
	for (let [e, n] of Object.entries(t.headers)) e.toLowerCase().startsWith(ne) && (r[e.slice(13)] = n);
	return r;
}
async function g(e, t) {
	let n = await ae(e, t), r = await n.text();
	return {
		status: n.status,
		headers: oe(t, n, () => r),
		body: r
	};
}
async function se(e, t) {
	let n = await ae(e, t), r = await n.arrayBuffer();
	return {
		status: n.status,
		headers: oe(t, n, () => Buffer.from(r).toString("utf8")),
		body: r
	};
}
var ce = "/callback/ws/endpoint", le = {
	CONTROL: 0,
	DATA: 1
}, ue = {
	EVENT: "event",
	CARD: "card",
	PING: "ping",
	PONG: "pong"
}, _ = {
	TYPE: "type",
	MESSAGE_ID: "message_id",
	SUM: "sum",
	SEQ: "seq",
	TRACE_ID: "trace_id",
	BIZ_RT: "biz_rt"
}, de = /* @__PURE__ */ new Map([[1000040344, "the App ID or App Secret is empty"], [1000040345, "the App ID or App Secret is invalid"]]), fe = /* @__PURE__ */ new Set([10003, 10014]), pe = /* @__PURE__ */ new Set([
	99991661,
	99991663,
	99991664,
	99991668
]), me = 5e3, he = 1e3, ge = 6e4, _e = 1e3, ve = 3e3, ye = 104857600, be = { CHATID: "chatid" }, xe = /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/, Se = 65536;
function Ce(e) {
	return e instanceof Error ? e.message : String(e);
}
function we(e, t) {
	let n = t.toLowerCase();
	return Object.entries(e).find(([e]) => e.toLowerCase() === n)?.[1] ?? "";
}
function Te(e) {
	let t = e.appId.trim(), n = e.appSecret.trim();
	if (!t || !n) return;
	let r = (e.apiBaseUrl.trim() || "https://open.feishu.cn").replace(/\/+$/, "");
	if (!xe.test(r)) throw Error(`the open platform address ${r} is not an http or https URL without a query or a fragment`);
	return {
		appId: t,
		appSecret: n,
		apiBaseUrl: r
	};
}
var v = class extends Error {
	code;
	status;
	fatal;
	constructor(e, t, n, r = !1) {
		super(e), this.name = "FeishuApiError", this.code = t, this.status = n, this.fatal = r;
	}
}, Ee = class {
	siyuan;
	tokens = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Map();
	constructor(e) {
		this.siyuan = e;
	}
	async endpoint(e) {
		let t = "get the long connection endpoint", n = await this.forward({
			url: `${e.apiBaseUrl}${ce}`,
			method: "POST",
			headers: { locale: ["zh"] },
			json: {
				AppID: e.appId,
				AppSecret: e.appSecret
			}
		}, t), r = h(n.body);
		if (typeof r?.code != "number") throw new v(`${t} failed: HTTP ${n.status} ${n.body.slice(0, 200)}`, n.status, n.status);
		if (r.code !== 0) {
			let e = de.get(r.code);
			throw new v(e ? `${e} (${r.code})` : `${t} failed: ${r.code} ${r.msg ?? ""}`.trim(), r.code, n.status, !!e);
		}
		if (!r.data?.URL) throw new v(`${t} failed: no URL is returned`, r.code, n.status);
		return {
			url: r.data.URL,
			config: r.data.ClientConfig ?? {}
		};
	}
	async botInfo(e) {
		let t = await this.call(e, "GET", "/open-apis/bot/v3/info");
		if (!t.bot?.open_id) throw new v("get the bot info failed: no bot is returned, add the bot capability to the app and publish a version", 0, 200);
		return t.bot;
	}
	async sendText(e, t, n) {
		return (await this.request(e, "POST", "/open-apis/im/v1/messages?receive_id_type=chat_id", {
			receive_id: t,
			msg_type: "text",
			content: JSON.stringify({ text: n })
		})).message_id;
	}
	async replyText(e, t, n) {
		return (await this.request(e, "POST", `/open-apis/im/v1/messages/${encodeURIComponent(t)}/reply`, {
			msg_type: "text",
			content: JSON.stringify({ text: n })
		})).message_id;
	}
	async getMessage(e, t) {
		return (await this.request(e, "GET", `/open-apis/im/v1/messages/${encodeURIComponent(t)}?user_id_type=open_id`)).items ?? [];
	}
	async getChat(e, t) {
		return this.request(e, "GET", `/open-apis/im/v1/chats/${encodeURIComponent(t)}?user_id_type=open_id`);
	}
	async getChatMembers(e, t, n) {
		let r = n ? `&page_token=${encodeURIComponent(n)}` : "";
		return this.request(e, "GET", `/open-apis/im/v1/chats/${encodeURIComponent(t)}/members?member_id_type=open_id&page_size=100${r}`);
	}
	async downloadResource(e, t, n, r) {
		let i = `download the resource ${n} of the message ${t}`;
		for (let a = 1;; a++) {
			let o = await this.tenantToken(e), s;
			try {
				s = await se(this.siyuan, {
					url: `${e.apiBaseUrl}/open-apis/im/v1/messages/${encodeURIComponent(t)}/resources/${encodeURIComponent(n)}?type=${r}`,
					method: "GET",
					headers: { Authorization: [`Bearer ${o}`] }
				});
			} catch (e) {
				throw Error(`${i} failed: ${ie(Ce(e))}`);
			}
			let c = we(s.headers, "Content-Type"), l = s.status >= 200 && s.status < 300;
			if (l && (!c.includes("json") || s.body.byteLength > Se)) return {
				data: s.body,
				contentType: c
			};
			let u = Buffer.from(s.body).toString("utf8"), d = h(u), f = typeof d?.code == "number" ? d.code : void 0;
			if (l && !f) return {
				data: s.body,
				contentType: c
			};
			if (f !== void 0 && pe.has(f) && a === 1) {
				this.dropToken(e);
				continue;
			}
			throw new v(f === void 0 ? `${i} failed: HTTP ${s.status} ${u.slice(0, 200)}` : `${i} failed: ${f} ${d?.msg ?? ""}`.trim(), f ?? s.status, s.status);
		}
	}
	async request(e, t, n, r) {
		return (await this.call(e, t, n, r)).data ?? {};
	}
	async call(e, t, n, r) {
		let i = `${t} ${n.replace(/\?.*$/, "")}`;
		for (let a = 1;; a++) {
			let o = await this.tenantToken(e), s = await this.forward({
				url: `${e.apiBaseUrl}${n}`,
				method: t,
				headers: { Authorization: [`Bearer ${o}`] },
				json: r
			}, i), c = h(s.body);
			if (typeof c?.code != "number") throw new v(`${i} failed: HTTP ${s.status} ${s.body.slice(0, 200)}`, s.status, s.status);
			if (c.code === 0) return c;
			if (pe.has(c.code) && a === 1) {
				this.dropToken(e);
				continue;
			}
			throw new v(`${i} failed: ${c.code} ${c.msg ?? ""}`.trim(), c.code, s.status);
		}
	}
	async tenantToken(e) {
		let t = this.cacheKey(e), n = this.tokens.get(t);
		if (n && n.expiresAt - 3e5 > Date.now()) return n.token;
		let r = this.pending.get(t);
		return r || (r = this.fetchToken(e).finally(() => this.pending.delete(t)), this.pending.set(t, r)), r;
	}
	async fetchToken(e) {
		let t = "get tenant_access_token", n = await this.forward({
			url: `${e.apiBaseUrl}/open-apis/auth/v3/tenant_access_token/internal`,
			method: "POST",
			json: {
				app_id: e.appId,
				app_secret: e.appSecret
			}
		}, t), r = h(n.body);
		if (typeof r?.code != "number") throw new v(`${t} failed: HTTP ${n.status} ${n.body.slice(0, 200)}`, n.status, n.status);
		if (r.code !== 0 || !r.tenant_access_token) throw new v(`${t} failed: ${r.code} ${r.msg ?? ""}`.trim(), r.code, n.status, fe.has(r.code));
		return this.tokens.set(this.cacheKey(e), {
			token: r.tenant_access_token,
			expiresAt: Date.now() + (r.expire ?? 7200) * 1e3
		}), r.tenant_access_token;
	}
	dropToken(e) {
		this.tokens.delete(this.cacheKey(e));
	}
	cacheKey(e) {
		return JSON.stringify([
			e.apiBaseUrl,
			e.appId,
			e.appSecret
		]);
	}
	async forward(e, t) {
		try {
			return await g(this.siyuan, e);
		} catch (e) {
			throw Error(`${t} failed: ${ie(Ce(e))}`);
		}
	}
};
//#endregion
//#region src/utils/kramdown.ts
function y(e) {
	return e.replace(/[\\`*_{}[\]()#+\-.!|~=^$<>:&"]/g, "\\$&").replace(/\r\n?|\n/g, "<br>");
}
function De(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\r\n?|\n/g, "_esc_newline_").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}
function Oe(e) {
	let t = Object.entries(e).filter((e) => !!e[1]).map(([e, t]) => `${e}="${De(t)}"`);
	return t.length > 0 ? `{: ${t.join(" ")}}` : "";
}
function b(e, t = {}) {
	let n = e.filter(Boolean);
	return n.length === 0 ? "" : [
		"{{{row",
		n.join("\n\n"),
		"}}}",
		Oe(t)
	].filter(Boolean).join("\n");
}
function x(e) {
	return e.replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, "");
}
function S(e) {
	return e.filter(Boolean).join("\n\n").split("\n").map((e) => e ? `> ${e}` : ">").join("\n");
}
function ke(e) {
	return e.replace(/[\s<>]/g, (e) => encodeURIComponent(e)).replace(/\(/g, "%28").replace(/\)/g, "%29");
}
function C(e, t = "") {
	return `![${t.replace(/[[\]\\\r\n]/g, "")}](${ke(e)})`;
}
function Ae(e, t) {
	return `[${e}](${ke(t)})`;
}
function w(e, t) {
	return Ae(y(e), t);
}
var je = /[.,;:!?'*]+$/, Me = /https?:\/\/[\w\-.~:/?#[\]@!&'()*+,;=%$]+/g;
function Ne(e, t) {
	return e.split(t).length - 1;
}
function Pe(e) {
	let t = e.replace(je, "");
	for (; t.endsWith(")") && Ne(t, ")") > Ne(t, "(");) t = t.slice(0, -1).replace(je, "");
	return t;
}
function T(e, t = y) {
	let n = "", r = 0;
	for (let i of e.matchAll(Me)) {
		let a = Pe(i[0]);
		n += t(e.slice(r, i.index)) + Ae(t(a), a), r = i.index + a.length;
	}
	return n + t(e.slice(r));
}
var Fe = /[*_~`#[\]$^]|==|\(\(|:[\w+-]+:/;
function Ie(e) {
	return Fe.test(e) ? y(e) : `<u>${e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\/g, "&#92;")}</u>`;
}
function Le(e) {
	let t = Math.max(0, ...Array.from(e.matchAll(/`+/g), (e) => e[0].length)), n = "`".repeat(t + 1), r = /^`|`$/.test(e) || e.startsWith(" ") && e.endsWith(" ") && e.trim() !== "" ? " " : "";
	return `${n}${r}${e}${r}${n}`;
}
function Re(e, t = "") {
	let n = Math.max(2, ...Array.from(e.matchAll(/`+/g), (e) => e[0].length)), r = "`".repeat(n + 1), i = e.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n").map((e) => e.replace(/^\s*(?=\}\}\}\s*$)/, (e) => `${e}\u200D`));
	return [
		`${r}${t.replace(/[^\w#+.-]/g, "")}`,
		...i,
		r
	].join("\n");
}
function ze(e) {
	return `<audio controls="controls" src="${e.replace(/"/g, "%22")}"></audio>`;
}
function E(e) {
	return `<video controls="controls" src="${e.replace(/"/g, "%22")}"></video>`;
}
function D(e) {
	return `<kbd>${e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</kbd>`;
}
function Be(e, t) {
	let n = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return `<span data-type="inline-memo" data-inline-memo-content="${n(t).replace(/"/g, "&quot;")}">${n(e)}</span>`;
}
function Ve(e, t) {
	return `((${e} '${t.replace(/\s+/g, " ").trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/\\/g, "&#92;")}'))`;
}
//#endregion
//#region src/feishu/message.ts
var He = 32, Ue = /@_user_\d+|@_all/g, We = /\r\n?|\n/, Ge = /^\/([a-z]\w*)(?=\s|$)/i, Ke = /^(?:\s*@_(?:user_\d+|all))+\s*/, qe = /* @__PURE__ */ new Set([
	"bold",
	"italic",
	"lineThrough"
]);
function O(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function k(e) {
	return typeof e == "string" ? e : typeof e == "number" ? String(e) : "";
}
function Je(e) {
	return Array.isArray(e) ? e.filter(O) : [];
}
function Ye(e) {
	try {
		let t = JSON.parse(e.content);
		return O(t) ? t : {};
	} catch {
		return {};
	}
}
function Xe(e) {
	let t = e.message, n = e.sender.sender_id;
	return {
		id: t.message_id,
		chatId: t.chat_id,
		chatType: t.chat_type,
		type: t.message_type,
		content: t.content,
		mentions: (t.mentions ?? []).map((e) => ({
			key: e.key,
			id: e.id.open_id || e.id.union_id || e.id.user_id || "",
			name: e.name
		})),
		senderId: n.open_id || n.union_id || n.user_id || "",
		senderType: e.sender.sender_type,
		createTime: Number(t.create_time),
		parentId: t.parent_id || void 0
	};
}
function Ze(e) {
	return {
		id: e.message_id,
		chatId: e.chat_id,
		type: e.msg_type,
		content: e.body?.content ?? "",
		mentions: (e.mentions ?? []).map((e) => ({
			key: e.key,
			id: e.id,
			name: e.name
		})),
		senderId: e.sender.id,
		senderType: e.sender.sender_type,
		createTime: Number(e.create_time),
		parentId: e.parent_id || void 0,
		upperId: e.upper_message_id || void 0
	};
}
function Qe(e, t) {
	let n = (e, r) => r > 16 ? [] : t.filter((t) => t.upperId === e && t.id !== e).map((e) => ({
		message: e,
		children: n(e.id, r + 1)
	}));
	return n(e, 0);
}
function $e(e) {
	return e.flatMap((e) => [e.message, ...$e(e.children)]);
}
function et(e, t) {
	if (e.type !== "text" || e.chatType !== "p2p" && !e.mentions.some((e) => e.id === t)) return;
	let n = k(Ye(e).text).replace(Ke, "");
	return Ge.exec(n)?.[1]?.toLowerCase();
}
function tt(e) {
	return e.type !== "system";
}
function nt(e) {
	let t = Array.isArray(e.content) ? e : Object.values(e).find((e) => O(e) && Array.isArray(e.content)), n = Array.isArray(t?.content) ? t.content.map(Je) : [];
	return {
		title: k(t?.title),
		lines: n
	};
}
function rt(e) {
	let t = Ye(e), n = (e, t, n, r) => {
		let i = k(e);
		return i ? [{
			key: i,
			type: t,
			kind: n,
			name: k(r) || void 0
		}] : [];
	};
	switch (e.type) {
		case "image": return n(t.image_key, "image", "image");
		case "file": return n(t.file_key, "file", "file", t.file_name);
		case "audio": return n(t.file_key, "file", "voice");
		case "media": return n(t.file_key, "file", "video", t.file_name);
		case "post": return nt(t).lines.flat().flatMap((e) => {
			switch (e.tag) {
				case "img": return n(e.image_key, "image", "image");
				case "media": return n(e.file_key, "file", "video");
				default: return [];
			}
		});
		default: return [];
	}
}
function it(e) {
	let t = Number(e), n = new Date(t);
	if (!t || Number.isNaN(n.getTime())) return "";
	let r = (e) => String(e).padStart(2, "0");
	return `${n.getFullYear()}-${r(n.getMonth() + 1)}-${r(n.getDate())} ${r(n.getHours())}:${r(n.getMinutes())}`;
}
function at(e) {
	return e.replace(/^.*\//, "");
}
function ot(e, t, n = "") {
	let r = e.message.mentions.find((e) => e.key === t);
	return r?.name ? r.name : t === "@_all" ? e.options.labels.all : n || t.replace(/^@/, "");
}
function st(e, t) {
	let n = e.options.labels;
	switch (t.tag) {
		case "at": return `@${ot(e, k(t.user_id), k(t.user_name))}`;
		case "img": return n.image;
		case "media": return n.video;
		case "emotion": return `[${k(t.emoji_type)}]`;
		case "hr": return "";
		default: return [k(t.text), ...Je(t.elements).map((t) => st(e, t))].join("");
	}
}
function ct(e) {
	return k(e.template).replace(/\{(\w+)\}/g, (t, n) => {
		let r = e[n];
		return Array.isArray(r) ? r.map(k).join(", ") : O(r) ? k(r.text) : k(r);
	});
}
function A(e) {
	let { message: t, options: { labels: n } } = e, r = Ye(t), i = (...e) => e.map((e) => e.trim()).filter(Boolean).join(" ");
	switch (t.type) {
		case "text": return k(r.text).replace(Ue, (t) => `@${ot(e, t)}`);
		case "post": {
			let { title: t, lines: n } = nt(r);
			return i(t, ...n.map((t) => t.map((t) => st(e, t)).join("")));
		}
		case "image": return n.image;
		case "file": return i(n.file, k(r.file_name));
		case "folder": return i(n.folder, k(r.file_name));
		case "audio": return n.voice;
		case "media": return i(n.video, k(r.file_name));
		case "sticker": return n.sticker;
		case "interactive": return i(n.card, k(r.title));
		case "share_chat": return i(n.chat, k(r.chat_id));
		case "share_user": return i(n.contact, k(r.user_id));
		case "location": return i(n.location, k(r.name));
		case "todo": {
			let a = O(r.summary) ? A({
				...e,
				message: {
					...t,
					type: "post",
					content: JSON.stringify(r.summary)
				}
			}) : "";
			return i(n.task, a, it(r.due_time));
		}
		case "vote": return [i(n.poll, k(r.topic)), ...Array.isArray(r.options) ? r.options.map((e) => `- ${k(e)}`) : []].join("\n");
		case "hongbao": return k(r.text);
		case "share_calendar_event":
		case "calendar":
		case "general_calendar": {
			let e = it(r.start_time), t = it(r.end_time);
			return i(n.calendar, k(r.summary), e && t ? `${e} – ${t}` : e);
		}
		case "video_chat": return i(n.videoCall, k(r.topic), it(r.start_time));
		case "system": return ct(r);
		case "merge_forward": return n.chatRecord;
		default: return `[${t.type}]`;
	}
}
function lt(e, t, n) {
	let r = new Set(t ?? []);
	return e.split(We).map((e) => {
		let t = e.trim();
		if (!t) return e;
		let i = /^\s*/.exec(e)[0], a = e.slice(i.length + t.length), o = r.has("underline") ? Ie(t) : n ? T(t) : y(t);
		return r.has("lineThrough") && (o = `~~${o}~~`), r.has("italic") && (o = `*${o}*`), r.has("bold") && (o = `**${o}**`), `${i}${o}${a}`;
	}).join("<br>");
}
function ut(e, t) {
	let { assets: n, labels: r } = e.options, i = [], a = "", o = !1, s = (e, t = !1) => {
		e && (a += (o && t ? "​" : "") + e, o = t);
	}, c = (e) => {
		i.push({ inline: a }, { block: e }), a = "", o = !1;
	};
	for (let i of t) {
		let t = (i.style ?? []).some((e) => qe.has(e));
		switch (i.tag) {
			case "text":
				s(lt(k(i.text), i.style, !0), t);
				break;
			case "a": {
				let e = k(i.href), n = k(i.text) || e;
				e ? s(Ae(lt(n, i.style, !1), e)) : s(lt(n, i.style, !0), t);
				break;
			}
			case "at":
				s(D(`@${ot(e, k(i.user_id), k(i.user_name))}`));
				break;
			case "img": {
				let e = n?.get(k(i.image_key));
				s(e ? C(e, r.image) : y(r.image));
				break;
			}
			case "media": {
				let e = n?.get(k(i.file_key));
				e ? c(E(e)) : s(y(r.video));
				break;
			}
			case "emotion":
				s(y(`[${k(i.emoji_type)}]`));
				break;
			case "hr":
				c("---");
				break;
			case "code_block": {
				let e = k(i.text);
				e.trim() && c(Re(e, k(i.language).toLowerCase()));
				break;
			}
			default: s(y(st(e, i)));
		}
	}
	return i.push({ inline: a }), i.filter((e) => "block" in e ? e.block : x(e.inline));
}
function dt(e, t) {
	let n = "", r = 0;
	for (let i of t.matchAll(Ue)) n += T(t.slice(r, i.index)) + D(`@${ot(e, i[0])}`), r = i.index + i[0].length;
	return n + T(t.slice(r));
}
function ft(e, t) {
	let n = k(e.latitude).trim(), r = k(e.longitude).trim(), i = [y(t.location), y(k(e.name))];
	return /^-?\d+(?:\.\d+)?$/.test(n) && /^-?\d+(?:\.\d+)?$/.test(r) && i.push(w(`${n}, ${r}`, `https://www.openstreetmap.org/?mlat=${n}&mlon=${r}#map=16/${n}/${r}`)), i.filter(Boolean).join(" ");
}
function pt(e) {
	let { message: t, options: n } = e, { assets: r, labels: i } = n, a = Ye(t), o = (e) => r?.get(k(e)), s;
	switch (t.type) {
		case "text":
			s = [{ inline: dt(e, k(a.text)) }];
			break;
		case "post": {
			let { title: t, lines: n } = nt(a);
			s = t.trim() ? [{ inline: `**${y(t.trim())}**` }] : [];
			for (let t of n) s.push(...ut(e, t));
			break;
		}
		case "image": {
			let t = o(a.image_key);
			s = [{ inline: t ? C(t, i.image) : y(A(e)) }];
			break;
		}
		case "file": {
			let t = o(a.file_key);
			s = [{ inline: t ? `${y(i.file)} ${w(k(a.file_name).trim() || at(t), t)}` : y(A(e)) }];
			break;
		}
		case "audio": {
			let t = o(a.file_key);
			s = [t ? { block: ze(t) } : { inline: y(A(e)) }];
			break;
		}
		case "media": {
			let t = o(a.file_key);
			s = [t ? { block: E(t) } : { inline: y(A(e)) }];
			break;
		}
		case "interactive":
			s = [{ inline: y(A(e)) }, ...(Array.isArray(a.elements) ? a.elements : []).map((t) => Je(t).map((t) => st(e, t)).join("")).map((e) => ({ inline: y(e) }))];
			break;
		case "location":
			s = [{ inline: ft(a, i) }];
			break;
		case "merge_forward": {
			let t = n.forwarded ?? [];
			s = t.length > 0 ? t.map((t) => ({ block: mt(e, t) })) : [{ inline: y(A(e)) }];
			break;
		}
		default: s = [{ inline: y(A(e)) }];
	}
	return s.filter((e) => "block" in e ? e.block : x(e.inline)).map((e) => "block" in e ? e.block : x(e.inline));
}
function mt(e, t) {
	let n = {
		...e.options,
		eventId: void 0,
		reference: void 0,
		quoted: void 0,
		author: void 0,
		forwarded: t.children
	}, r = pt({
		message: t.message,
		options: n
	});
	return b(r.length > 0 ? r : [y(n.labels.unavailable)], {
		"custom-author-id": t.message.senderId,
		"custom-author-username": n.names?.get(t.message.senderId)
	});
}
function ht(e) {
	let t = e.replace(/\s+/g, " ").trim();
	return t.length > He ? `${t.slice(0, He)}...` : t;
}
function gt(e, t) {
	return A({
		message: e,
		options: { labels: t }
	});
}
function _t(e, t) {
	let { labels: n, quoted: r = "", reference: i } = t, a = [];
	return e.parentId && a.push(S([i ? Ve(i, ht(r) || n.quote) : y(r.trim() || n.quote)])), a.push(...pt({
		message: e,
		options: t
	})), b(a.length > 0 ? a : [y(n.unavailable)], {
		"custom-event-id": t.eventId,
		"custom-author-id": e.senderId,
		"custom-author-username": t.author,
		"custom-msg-id": e.id
	});
}
//#endregion
//#region src/feishu/commands.ts
var vt = new Set(Object.values(be)), yt = 1024;
function bt(e) {
	return e instanceof Error ? e.message : String(e);
}
function xt(e, t) {
	return e.replaceAll("{{1}}", () => t);
}
var St = class {
	siyuan;
	api;
	answered = /* @__PURE__ */ new Set();
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	handle(e, t) {
		let n = et(t, e.info.open_id);
		if (n !== void 0) {
			if (!vt.has(n)) {
				this.siyuan.logger.info(`[feishu] [commands] ignore the unknown command /${n} in chat ${t.chatId}`);
				return;
			}
			if (this.answered.has(t.id)) {
				this.siyuan.logger.debug(`[feishu] [commands] the message ${t.id} is already answered, skip it`);
				return;
			}
			this.answered.add(t.id), this.answered.size > yt && this.answered.delete(this.answered.values().next().value), this.answer(e, t, n);
		}
	}
	async answer(e, t, n) {
		try {
			if (t.chatType !== "p2p" && !await this.isManager(e, t)) {
				this.siyuan.logger.info(`[feishu] [commands] ignore /${n} from ${t.senderId} in chat ${t.chatId}: only the owner and managers can send commands in groups`);
				return;
			}
			this.siyuan.logger.info(`[feishu] [commands] /${n} from ${t.senderId} in chat ${t.chatId}`);
			let r = this.labels(), i = [xt(r.chat, t.chatId), xt(r.user, t.senderId)].join("\n");
			await this.api.replyText(e.options, t.id, i);
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] [commands] answer /${n} in chat ${t.chatId} failed:`, bt(e));
		}
	}
	async isManager(e, t) {
		let n = await this.api.getChat(e.options, t.chatId);
		return n.owner_id === t.senderId || (n.user_manager_id_list ?? []).includes(t.senderId);
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.commands;
		return {
			chat: e?.chatid?.chat || "Chat ID: {{1}}",
			user: e?.openid?.user || "User OpenID: {{1}}"
		};
	}
}, Ct = 0, wt = 1, Tt = 2, Et = 5, Dt = 4096;
function Ot(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e.charCodeAt(n);
		if (r >= 55296 && r <= 56319 && n + 1 < e.length) {
			let t = e.charCodeAt(n + 1);
			t >= 56320 && t <= 57343 && (r = 65536 + (r - 55296 << 10) + (t - 56320), n++);
		}
		r >= 55296 && r <= 57343 && (r = 65533), r < 128 ? t.push(r) : r < 2048 ? t.push(192 | r >> 6, 128 | r & 63) : r < 65536 ? t.push(224 | r >> 12, 128 | r >> 6 & 63, 128 | r & 63) : t.push(240 | r >> 18, 128 | r >> 12 & 63, 128 | r >> 6 & 63, 128 | r & 63);
	}
	return new Uint8Array(t);
}
function j(e) {
	return e !== void 0 && (e & 192) == 128;
}
function kt(e) {
	let t = "", n = [], r = 0;
	for (; r < e.length;) {
		let i = e[r], a = 65533, o = 1;
		i < 128 ? a = i : i >= 194 && i < 224 && j(e[r + 1]) ? (a = (i & 31) << 6 | e[r + 1] & 63, o = 2) : i >= 224 && i < 240 && j(e[r + 1]) && j(e[r + 2]) ? (a = (i & 15) << 12 | (e[r + 1] & 63) << 6 | e[r + 2] & 63, o = 3, (a < 2048 || a >= 55296 && a <= 57343) && (a = 65533)) : i >= 240 && i < 245 && j(e[r + 1]) && j(e[r + 2]) && j(e[r + 3]) && (a = (i & 7) << 18 | (e[r + 1] & 63) << 12 | (e[r + 2] & 63) << 6 | e[r + 3] & 63, o = 4, (a < 65536 || a > 1114111) && (a = 65533)), a >= 65536 ? (a -= 65536, n.push(55296 + (a >> 10), 56320 + (a & 1023))) : n.push(a), n.length >= Dt && (t += String.fromCharCode(...n), n = []), r += o;
	}
	return t + String.fromCharCode(...n);
}
function At({ lo: e, hi: t }) {
	let n = [
		t >>> 16,
		t & 65535,
		e >>> 16,
		e & 65535
	], r = "";
	for (; n.some((e) => e !== 0);) {
		let e = 0;
		for (let t = 0; t < n.length; t++) {
			let r = e * 65536 + n[t];
			n[t] = Math.floor(r / 10), e = r % 10;
		}
		r = e + r;
	}
	return r || "0";
}
function jt(e) {
	if (!/^\d+$/.test(e)) throw Error(`invalid uint64 ${e}`);
	let t = [
		0,
		0,
		0,
		0
	];
	for (let n of e) {
		let r = n.charCodeAt(0) - 48;
		for (let e = t.length - 1; e >= 0; e--) {
			let n = t[e] * 10 + r;
			t[e] = n & 65535, r = Math.floor(n / 65536);
		}
		if (r) throw Error(`uint64 overflow ${e}`);
	}
	return {
		lo: (t[2] << 16 | t[3]) >>> 0,
		hi: (t[0] << 16 | t[1]) >>> 0
	};
}
var Mt = class {
	bytes = [];
	varint({ lo: e, hi: t }) {
		for (; t > 0 || e > 127;) this.bytes.push(e & 127 | 128), e = (e >>> 7 | t << 25) >>> 0, t >>>= 7;
		this.bytes.push(e);
	}
	tag(e, t) {
		this.varint({
			lo: (e << 3 | t) >>> 0,
			hi: 0
		});
	}
	int32(e, t) {
		this.tag(e, Ct), this.varint({
			lo: t >>> 0,
			hi: t < 0 ? 4294967295 : 0
		});
	}
	uint64(e, t) {
		this.tag(e, Ct), this.varint(jt(t));
	}
	bytesField(e, t) {
		this.tag(e, Tt), this.varint({
			lo: t.length,
			hi: 0
		});
		for (let e of t) this.bytes.push(e);
	}
	string(e, t) {
		this.bytesField(e, Ot(t));
	}
	finish() {
		return new Uint8Array(this.bytes);
	}
}, Nt = class {
	buffer;
	position = 0;
	constructor(e) {
		this.buffer = e;
	}
	get done() {
		return this.position >= this.buffer.length;
	}
	varint() {
		let e = 0, t = 0;
		for (let t = 0; t < 4; t++) {
			let n = this.byte();
			if (e |= (n & 127) << t * 7, n < 128) return {
				lo: e >>> 0,
				hi: 0
			};
		}
		let n = this.byte();
		if (e |= (n & 15) << 28, t = (n & 127) >> 4, n < 128) return {
			lo: e >>> 0,
			hi: t
		};
		for (let r = 0; r < 5; r++) if (n = this.byte(), t |= (n & 127) << r * 7 + 3, n < 128) return {
			lo: e >>> 0,
			hi: t >>> 0
		};
		throw Error("protobuf: the varint is too long");
	}
	bytes() {
		let e = this.varint().lo;
		if (this.position + e > this.buffer.length) throw Error("protobuf: the length is out of range");
		let t = this.buffer.subarray(this.position, this.position + e);
		return this.position += e, t;
	}
	string() {
		return kt(this.bytes());
	}
	skip(e) {
		switch (e) {
			case Ct:
				this.varint();
				return;
			case wt:
				this.advance(8);
				return;
			case Tt:
				this.bytes();
				return;
			case Et:
				this.advance(4);
				return;
			default: throw Error(`protobuf: unsupported wire type ${e}`);
		}
	}
	byte() {
		if (this.position >= this.buffer.length) throw Error("protobuf: unexpected end of data");
		return this.buffer[this.position++];
	}
	advance(e) {
		if (this.position + e > this.buffer.length) throw Error("protobuf: unexpected end of data");
		this.position += e;
	}
};
function Pt(e) {
	let t = new Nt(e), n = {
		key: "",
		value: ""
	};
	for (; !t.done;) {
		let e = t.varint().lo, r = e & 7;
		switch (e >>> 3) {
			case 1:
				n.key = t.string();
				break;
			case 2:
				n.value = t.string();
				break;
			default: t.skip(r);
		}
	}
	return n;
}
function Ft(e) {
	let t = new Nt(e), n = {
		SeqID: "0",
		LogID: "0",
		service: 0,
		method: 0,
		headers: []
	};
	for (; !t.done;) {
		let e = t.varint().lo, r = e & 7, i = e >>> 3;
		if (i <= 4 && r !== Ct || i > 4 && r !== Tt) {
			t.skip(r);
			continue;
		}
		switch (i) {
			case 1:
				n.SeqID = At(t.varint());
				break;
			case 2:
				n.LogID = At(t.varint());
				break;
			case 3:
				n.service = t.varint().lo | 0;
				break;
			case 4:
				n.method = t.varint().lo | 0;
				break;
			case 5:
				n.headers.push(Pt(t.bytes()));
				break;
			case 6:
				n.payloadEncoding = t.string();
				break;
			case 7:
				n.payloadType = t.string();
				break;
			case 8:
				n.payload = t.bytes().slice();
				break;
			case 9:
				n.LogIDNew = t.string();
				break;
			default: t.skip(r);
		}
	}
	return n;
}
function It(e) {
	let t = new Mt();
	t.uint64(1, e.SeqID), t.uint64(2, e.LogID), t.int32(3, e.service), t.int32(4, e.method);
	for (let n of e.headers) {
		let e = new Mt();
		e.string(1, n.key), e.string(2, n.value), t.bytesField(5, e.finish());
	}
	return e.payloadEncoding !== void 0 && t.string(6, e.payloadEncoding), e.payloadType !== void 0 && t.string(7, e.payloadType), e.payload !== void 0 && t.bytesField(8, e.payload), e.LogIDNew !== void 0 && t.string(9, e.LogIDNew), t.finish();
}
function M(e, t) {
	return e.headers.find((e) => e.key === t)?.value;
}
//#endregion
//#region src/feishu/gateway.ts
function Lt(e) {
	return new Promise((t) => setTimeout(t, e));
}
function N(e) {
	return e instanceof Error ? e.message : String(e);
}
function Rt(e, t) {
	return e.appId === t.appId && e.appSecret === t.appSecret && e.apiBaseUrl === t.apiBaseUrl;
}
function zt(e) {
	return typeof e == "number" && e > 0 ? e * 1e3 : void 0;
}
function Bt(e) {
	return /^wss?:\/\/([^/?#]+)/i.exec(e)?.[1] ?? "the long connection server";
}
var Vt = class {
	siyuan;
	api;
	onEvent;
	generation = 0;
	options;
	connection;
	current = { status: "stopped" };
	recent = /* @__PURE__ */ new Set();
	constructor(e, t, n) {
		this.siyuan = e, this.api = t, this.onEvent = n;
	}
	get state() {
		return { ...this.current };
	}
	update(e) {
		let t;
		try {
			t = Te(e);
		} catch (e) {
			this.stop(), this.siyuan.logger.error(`[feishu] ${N(e)}, skip connecting`), this.setState("failed", { error: N(e) });
			return;
		}
		if (!t) {
			this.stop(), this.siyuan.logger.info("[feishu] the App ID or App Secret is not configured, skip connecting"), this.setState("unconfigured");
			return;
		}
		if (this.options && Rt(this.options, t)) return;
		this.stop();
		let n = ++this.generation;
		this.options = t, this.run(n, t);
	}
	async stop() {
		this.options && this.siyuan.logger.info(`[feishu] stop the long connection of app ${this.options.appId}`), this.generation++, this.options = void 0;
		let e = this.connection;
		this.connection = void 0, this.setState("stopped"), e && (e.finish("stopped"), await e.socket.close(1e3, "stop").catch(() => {}));
	}
	async run(e, t) {
		this.siyuan.logger.info(`[feishu] connect the long connection of app ${t.appId}`), this.setState("connecting");
		let n, r = 0;
		for (; e === this.generation;) {
			let i;
			try {
				if (!n) {
					let r = await this.api.botInfo(t);
					if (e !== this.generation) return;
					n = r, this.siyuan.logger.info(`[feishu] app ${t.appId} is the bot ${n.app_name} (${n.open_id})`);
				}
				let a = await this.api.endpoint(t);
				if (e !== this.generation) return;
				let o = await this.session(e, {
					options: t,
					info: n
				}, a);
				if (e !== this.generation) return;
				o.healthy && (r = 0), i = o.reason;
			} catch (t) {
				if (e !== this.generation) return;
				if (t instanceof v && t.fatal) {
					this.siyuan.logger.error(`[feishu] ${t.message}, stop connecting until the settings change`), this.generation++, this.options = void 0, this.setState("failed", { error: t.message });
					return;
				}
				i = N(t);
			}
			let a = Math.min(he * 2 ** r, ge);
			r++, this.siyuan.logger.warn(`[feishu] disconnected (${i}), reconnect in ${a} ms`), this.setState("reconnecting", {
				error: i,
				retryAt: new Date(Date.now() + a).toISOString()
			}), await Lt(a);
		}
	}
	async session(e, t, n) {
		let r = Bt(n.url), i = await this.siyuan.client.socket(`/ws/network/proxy?u=${re(n.url)}&t=10s`), a, o = new Promise((e) => {
			a = e;
		}), s = {
			socket: i,
			serviceId: Number(/[?&]service_id=(\d+)/.exec(n.url)?.[1] ?? 0),
			pingInterval: zt(n.config.PingInterval) ?? 12e4,
			lastInbound: Date.now(),
			healthy: !1,
			fragments: /* @__PURE__ */ new Map(),
			ended: !1,
			finish: (e) => {
				s.ended || (s.ended = !0, clearTimeout(s.pingTimer), clearInterval(s.watchdogTimer), a(e));
			}
		};
		if (e !== this.generation) return await i.close().catch(() => {}), {
			healthy: !1,
			reason: "stopped"
		};
		this.connection = s, i.onmessage = (e) => this.onMessage(s, t, e), i.onclose = (e) => s.finish(`closed ${e.code} ${e.reason}`.trim()), i.onerror = (e) => {
			let t = `error ${ie(N(e.error))}`;
			setTimeout(() => s.finish(t), 0);
		};
		try {
			await i.open();
		} catch (e) {
			return s.finish("open failed"), this.connection === s && (this.connection = void 0), {
				healthy: !1,
				reason: `connect to ${r} failed: ${ie(N(e))}`
			};
		}
		e === this.generation ? (s.lastInbound = Date.now(), this.siyuan.logger.info(`[feishu] connected to ${r}`), this.setState("connected", { username: t.info.app_name }), this.ping(s), s.watchdogTimer = setInterval(() => {
			let e = Date.now() - s.lastInbound;
			e > 2 * s.pingInterval + 5e3 && s.finish(`no frame received in ${e} ms`);
		}, me)) : s.finish("stopped");
		let c = await o;
		return this.connection === s && (this.connection = void 0), await i.close(1e3, "reconnect").catch(() => {}), {
			healthy: s.healthy,
			reason: c
		};
	}
	ping(e) {
		e.ended || (this.send(e, {
			SeqID: "0",
			LogID: "0",
			service: e.serviceId,
			method: le.CONTROL,
			headers: [{
				key: _.TYPE,
				value: ue.PING
			}]
		}), e.pingTimer = setTimeout(() => this.ping(e), e.pingInterval));
	}
	async send(e, t) {
		if (e.ended) return;
		let n = It(t);
		try {
			await e.socket.send(n.buffer.slice(n.byteOffset, n.byteOffset + n.byteLength));
		} catch (e) {
			this.siyuan.logger.debug(`[feishu] send a frame failed: ${N(e)}`);
		}
	}
	onMessage(e, t, n) {
		if (e.ended) return;
		if (e.lastInbound = Date.now(), e.healthy = !0, typeof n.data == "string") {
			this.siyuan.logger.debug(`[feishu] ignore a text frame: ${n.data.slice(0, 200)}`);
			return;
		}
		let r;
		try {
			r = Ft(new Uint8Array(n.data));
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] decode a frame of ${n.data.byteLength} bytes failed: ${N(e)}`);
			return;
		}
		let i = M(r, _.TYPE);
		if (r.method === le.CONTROL) {
			i === ue.PONG && this.onPong(e, r);
			return;
		}
		if (r.method !== le.DATA) return;
		if (i !== ue.EVENT) {
			this.siyuan.logger.debug(`[feishu] ignore a data frame of type ${i}`);
			return;
		}
		let a = this.merge(e, r);
		if (!a) return;
		let o = Date.now(), s;
		try {
			s = JSON.parse(kt(a));
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] the event ${M(r, _.TRACE_ID)} is not JSON: ${N(e)}`);
			return;
		}
		this.send(e, {
			...r,
			headers: [...r.headers, {
				key: _.BIZ_RT,
				value: String(Date.now() - o)
			}],
			payload: Ot(JSON.stringify({ code: 200 }))
		}), this.dispatch(t, s);
	}
	onPong(e, t) {
		if (t.payload?.length) try {
			let n = zt(JSON.parse(kt(t.payload)).PingInterval);
			n && n !== e.pingInterval && (e.pingInterval = n, clearTimeout(e.pingTimer), e.pingTimer = setTimeout(() => this.ping(e), n));
		} catch {
			this.siyuan.logger.debug("[feishu] the pong has no valid client config");
		}
	}
	merge(e, t) {
		let n = t.payload ?? /* @__PURE__ */ new Uint8Array(), r = Number(M(t, _.SUM) ?? 1), i = Number(M(t, _.SEQ) ?? 0);
		if (r === 1 && i === 0) return n;
		let a = M(t, _.MESSAGE_ID);
		if (!a || !Number.isInteger(r) || !Number.isInteger(i) || r < 1 || i < 0 || i >= r) {
			this.siyuan.logger.warn(`[feishu] drop a fragment with invalid metadata: message_id ${a}, sum ${r}, seq ${i}`);
			return;
		}
		let o = Date.now();
		for (let [t, n] of e.fragments) o - n.createdAt > 1e4 && (e.fragments.delete(t), this.siyuan.logger.warn(`[feishu] drop the incomplete fragments of ${t}`));
		let s = e.fragments.get(a);
		if (s && s.parts.length !== r) {
			e.fragments.delete(a), this.siyuan.logger.warn(`[feishu] drop the fragments of ${a}: sum ${r} differs from ${s.parts.length}`);
			return;
		}
		s || (s = {
			parts: Array.from({ length: r }).fill(void 0),
			createdAt: o
		}, e.fragments.set(a, s)), s.parts[i] = n;
		let c = 0;
		for (let e of s.parts) {
			if (!e) return;
			c += e.length;
		}
		e.fragments.delete(a);
		let l = new Uint8Array(c), u = 0;
		for (let e of s.parts) l.set(e, u), u += e.length;
		return this.siyuan.logger.debug(`[feishu] merged ${r} fragments of ${a} into ${c} bytes`), l;
	}
	dispatch(e, t) {
		let n = t.header?.event_id ?? t.uuid;
		if (n) {
			if (this.recent.has(n)) {
				this.siyuan.logger.debug(`[feishu] the event ${n} is delivered again, skip it`);
				return;
			}
			this.recent.add(n), this.recent.size > 1024 && this.recent.delete(this.recent.values().next().value);
		}
		try {
			this.onEvent(e, t);
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] handle the event ${n} failed:`, N(e));
		}
	}
	setState(e, t = {}) {
		this.current = {
			status: e,
			since: (/* @__PURE__ */ new Date()).toISOString(),
			...t
		};
	}
}, Ht = ".temp", Ut = /^\d{14}-[0-9a-z]{7}$/, Wt = 1024, Gt = 2e3, Kt = 18e5, qt = ["custom-event-id", "custom-msg-id"];
function Jt(e) {
	return new Promise((t) => setTimeout(t, e));
}
function P(e) {
	return e instanceof Error ? e.message : String(e);
}
function Yt(e) {
	let t = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0");
	return `${e.getFullYear()}-${t}-${n}`;
}
function Xt(e) {
	let t = new Date(e ?? NaN);
	return Yt(Number.isNaN(t.getTime()) ? /* @__PURE__ */ new Date() : t);
}
function Zt(e) {
	return `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}`;
}
var Qt = class {
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
			this.siyuan.logger.warn("[inbox] an inbox task failed:", P(e));
		});
	}
	async prepare(e) {
		if (!Ut.test(e)) throw Error(`invalid document ID ${e}`);
		await this.waitForSync(await this.childDoc(e, Ht)), await this.recover(e);
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
		this.messages.set(`${e} ${t} ${n}`, r), this.messages.size > Wt && this.messages.delete(this.messages.keys().next().value);
	}
	async appendToTemp(e, t) {
		let n = await this.childDoc(e, Ht);
		try {
			return {
				block: await this.append(n, t),
				temp: n
			};
		} catch (r) {
			this.siyuan.logger.debug(`[inbox] append to ${n} failed, retry after refreshing the documents:`, P(r)), this.children.clear();
			let i = await this.childDoc(e, Ht);
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
			this.siyuan.logger.warn(`[inbox] download the assets of ${e} failed, wait for the kernel to finish:`, P(t));
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
			this.siyuan.logger.debug(`[inbox] move ${t} failed, retry after refreshing the documents:`, P(r)), this.children.clear(), await this.moveToEnd(t, await this.dateDoc(e, n));
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
		let t = Date.now() + Kt;
		for (; await this.isSyncing(e);) {
			if (Date.now() > t) throw Error(`${e} is still syncing after ${Kt} ms`);
			await Jt(Gt);
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
				let t = await this.childDoc(e, Ht), n = [];
				for (let e of await this.request("/api/block/getChildBlocks", { id: t })) {
					if (e.type !== "s") continue;
					let t = await this.request("/api/attr/getBlockAttrs", { id: e.id });
					qt.some((e) => t[e]) && n.push(e.id);
				}
				if (n.length === 0) return;
				this.siyuan.logger.info(`[inbox] move ${n.length} leftover message(s) out of ${t}`), this.downloadAssetsEnabled() && await this.downloadAssets(t);
				for (let t of n) await this.moveToDate(e, t, Zt(t));
			} catch (t) {
				this.siyuan.logger.warn(`[inbox] move the leftover messages of ${e} failed:`, P(t));
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
}, $t = "custom-msg-id";
function F(e) {
	return e instanceof Error ? e.message : String(e);
}
function en(e) {
	return e.bindings.filter((e) => e.enabled && e.chat && e.doc);
}
function tn(e, t) {
	return e.message.createTime - t.message.createTime || (e.message.id < t.message.id ? -1 : +(e.message.id > t.message.id));
}
var nn = class {
	siyuan;
	api;
	writer;
	media;
	members;
	config;
	pending = [];
	firstPendingAt = 0;
	timer;
	constructor(e, t, n, r, i, a) {
		this.siyuan = e, this.api = t, this.writer = n, this.media = r, this.members = i, this.config = a;
	}
	handle(e, t, n) {
		if (et(t, e.info.open_id) !== void 0 || !tt(t) || !en(this.config().inbox).some((e) => e.chat === t.chatId)) return;
		t.chatType === "group" && this.members.remember(t.chatId, t.mentions), this.pending.length === 0 && (this.firstPendingAt = Date.now()), this.pending.push({
			bot: e,
			message: t,
			eventId: n
		}), clearTimeout(this.timer);
		let r = Math.max(0, Math.min(_e, this.firstPendingAt + ve - Date.now()));
		this.timer = setTimeout(() => this.flush(), r);
	}
	flush() {
		clearTimeout(this.timer);
		let e = this.pending.sort(tn);
		this.pending = [];
		let t = this.config().inbox, n = t.downloadAssets, r = en(t);
		for (let t of e) {
			let e = r.filter((e) => e.chat === t.message.chatId);
			e.length !== 0 && this.writer.enqueue(async () => {
				for (let r of e) try {
					await this.write(t, r, n);
				} catch (e) {
					this.siyuan.logger.warn(`[feishu] [inbox] write the message ${t.message.id} to ${r.doc} failed:`, F(e));
				}
			});
		}
	}
	async write(e, t, n) {
		let { bot: r, message: i } = e, a = t.doc;
		if (await this.writer.prepare(a), await this.writer.findMessage(a, $t, i.id)) {
			this.siyuan.logger.debug(`[feishu] [inbox] the message ${i.id} is already in ${a}, skip it`);
			return;
		}
		let o = i.type === "merge_forward" ? await this.forwarded(r, i) : [], s = {
			eventId: e.eventId,
			forwarded: o,
			labels: this.labels()
		};
		i.parentId && (s.reference = await this.writer.findMessage(a, $t, i.parentId), s.quoted = await this.quoted(r, i.parentId)), i.chatType === "group" && (s.author = await this.members.name(r, i.chatId, i.senderId)), o.length > 0 && (s.names = await this.names(r, $e(o)));
		let { block: c } = await this.writer.appendToTemp(a, _t(i, s));
		this.writer.remember(a, $t, i.id, c), t.reply && this.reply(r, i, c);
		let l = [i, ...$e(o)];
		if (n && l.some((e) => rt(e).length > 0)) {
			let e = await this.media.save(r, i.id, l, c);
			if (e.size > 0) try {
				await this.writer.updateBlock(c, _t(i, {
					...s,
					assets: e
				}));
			} catch (e) {
				this.siyuan.logger.warn(`[feishu] [inbox] put the media of the message ${i.id} into the block ${c} failed:`, F(e));
			}
		}
		await this.writer.moveToDate(a, c, Xt(i.createTime));
	}
	async forwarded(e, t) {
		try {
			let n = await this.api.getMessage(e.options, t.id);
			return Qe(t.id, n.map(Ze));
		} catch (e) {
			return this.siyuan.logger.warn(`[feishu] [inbox] get the forwarded messages of ${t.id} failed:`, F(e)), [];
		}
	}
	async quoted(e, t) {
		try {
			let [n] = await this.api.getMessage(e.options, t);
			return n ? gt(Ze(n), this.labels()) : "";
		} catch (e) {
			return this.siyuan.logger.debug(`[feishu] [inbox] get the replied message ${t} failed:`, F(e)), "";
		}
	}
	async names(e, t) {
		let n = /* @__PURE__ */ new Map();
		for (let r of t) {
			if (!r.senderId.startsWith("ou_") || n.has(r.senderId)) continue;
			let t = await this.members.name(e, r.chatId, r.senderId);
			t && n.set(r.senderId, t);
		}
		return n;
	}
	async reply(e, t, n) {
		try {
			let r = await this.api.replyText(e.options, t.id, `siyuan://blocks/${n}`);
			this.siyuan.logger.debug(`[feishu] [inbox] replied to the message ${t.id} with the block ${n}, reply ${r}`);
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] [inbox] reply to the message ${t.id} with the block ${n} failed:`, F(e));
		}
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.inbox;
		return {
			quote: e?.quote || "Quoted message",
			unavailable: e?.unavailable || "[Message not available]",
			all: e?.all || "all",
			calendar: e?.calendar || "[Event]",
			card: e?.card || "[Card]",
			chat: e?.chat || "[Group card]",
			chatRecord: e?.chatRecord || "[Chat history]",
			contact: e?.contact || "[Contact]",
			file: e?.file || "[File]",
			folder: e?.folder || "[Folder]",
			image: e?.image || "[Image]",
			location: e?.location || "[Location]",
			poll: e?.poll || "[Poll]",
			sticker: e?.sticker || "[Sticker]",
			task: e?.task || "[Task]",
			video: e?.video || "[Video]",
			videoCall: e?.videoCall || "[Video call]",
			voice: e?.voice || "[Voice]"
		};
	}
};
//#endregion
//#region src/utils/asset.ts
function rn(e) {
	return e.replace(/[\u0000-\u001F\u007F"\\/]/g, "_").trim() || "file";
}
async function an(e, t, n, r) {
	let i = `----siyuan-plugin-im-bot-${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`, a = Buffer.from([
		`--${i}`,
		"Content-Disposition: form-data; name=\"id\"",
		"",
		r,
		`--${i}`,
		`Content-Disposition: form-data; name="file[]"; filename="${rn(t)}"`,
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
//#region src/feishu/media.ts
var on = {
	"application/pdf": ".pdf",
	"audio/aac": ".aac",
	"audio/amr": ".amr",
	"audio/mp4": ".m4a",
	"audio/mpeg": ".mp3",
	"audio/ogg": ".ogg",
	"audio/opus": ".opus",
	"audio/wav": ".wav",
	"image/bmp": ".bmp",
	"image/gif": ".gif",
	"image/heic": ".heic",
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/svg+xml": ".svg",
	"image/webp": ".webp",
	"video/mp4": ".mp4",
	"video/quicktime": ".mov",
	"video/webm": ".webm"
}, sn = {
	file: "",
	image: ".jpg",
	video: ".mp4",
	voice: ".opus"
};
function cn(e) {
	return e instanceof Error ? e.message : String(e);
}
function ln(e, t) {
	let n = t.split(";")[0].trim().toLowerCase();
	return e.name?.trim() || `${e.kind}${on[n] ?? sn[e.kind]}`;
}
var un = class {
	siyuan;
	api;
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	async save(e, t, n, r) {
		let i = /* @__PURE__ */ new Map();
		for (let a of n) for (let n of rt(a)) {
			if (i.has(n.key)) continue;
			let a = await this.saveResource(e, t, n, r);
			a && i.set(n.key, a);
		}
		return i;
	}
	async saveResource(e, t, n, r) {
		let i = `the ${n.kind} ${n.key} of the message ${t}`;
		try {
			let a = await this.api.downloadResource(e.options, t, n.key, n.type);
			if (a.data.byteLength > 104857600) throw Error(`downloaded ${a.data.byteLength} bytes, more than ${ye}`);
			let o = await an(this.siyuan, ln(n, a.contentType), a.data, r);
			return this.siyuan.logger.debug(`[feishu] [media] saved ${i} (${a.data.byteLength} bytes) as ${o}`), o;
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] [media] save ${i} failed, keep it as a placeholder:`, cn(e));
			return;
		}
	}
};
//#endregion
//#region src/feishu/members.ts
function dn(e) {
	return e instanceof Error ? e.message : String(e);
}
var fn = class {
	siyuan;
	api;
	chats = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	remember(e, t) {
		let n = this.entry(e).names;
		for (let e of t) e.id.startsWith("ou_") && e.name && n.set(e.id, e.name);
	}
	async name(e, t, n) {
		let r = this.entry(t), i = r.names.get(n);
		return i || !n ? i : ((r.pending || Date.now() - r.fetchedAt >= 6e4) && await this.refresh(e, t, r), r.names.get(n));
	}
	entry(e) {
		let t = this.chats.get(e);
		return t || (t = {
			names: /* @__PURE__ */ new Map(),
			fetchedAt: 0
		}, this.chats.set(e, t)), t;
	}
	async refresh(e, t, n) {
		n.pending ||= (n.fetchedAt = Date.now(), this.fetch(e, t, n).finally(() => {
			n.pending = void 0;
		})), await n.pending;
	}
	async fetch(e, t, n) {
		try {
			let r;
			for (let i = 0; i < 10; i++) {
				let i = await this.api.getChatMembers(e.options, t, r);
				for (let e of i.items ?? []) e.member_id && e.name && n.names.set(e.member_id, e.name);
				if (!i.has_more || !i.page_token) return;
				r = i.page_token;
			}
		} catch (e) {
			this.siyuan.logger.debug(`[feishu] [members] get the members of chat ${t} failed:`, dn(e));
		}
	}
}, pn = {
	offline: "Inbox offline: messages of this chat are not recorded for now (device: {{1}})",
	online: "Inbox online: messages of this chat are recorded in SiYuan (device: {{1}})"
};
function mn(e) {
	return e instanceof Error ? e.message : String(e);
}
var hn = class {
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
			await this.api.sendText(e, t, r), this.siyuan.logger.info(`[feishu] [notices] sent the ${n} notice to chat ${t}`);
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] [notices] send the ${n} notice to chat ${t} failed:`, mn(e));
		}
	}
	text(e) {
		return this.siyuan.plugin.i18n?.notices?.feishu?.[e] || pn[e];
	}
}, gn = "https://api.bot.qq.com/app/getAppAccessToken", _n = "https://api.bot.qq.com", vn = 45e3, yn = 1e3, bn = 6e4, xn = /* @__PURE__ */ new Set([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
]), I = /* @__PURE__ */ function(e) {
	return e[e.DISPATCH = 0] = "DISPATCH", e[e.HEARTBEAT = 1] = "HEARTBEAT", e[e.IDENTIFY = 2] = "IDENTIFY", e[e.RESUME = 6] = "RESUME", e[e.RECONNECT = 7] = "RECONNECT", e[e.INVALID_SESSION = 9] = "INVALID_SESSION", e[e.HELLO = 10] = "HELLO", e[e.HEARTBEAT_ACK = 11] = "HEARTBEAT_ACK", e;
}({}), Sn = /* @__PURE__ */ function(e) {
	return e[e.NORMAL = 0] = "NORMAL", e[e.ARK = 3] = "ARK", e[e.CHAT_RECORD = 102] = "CHAT_RECORD", e[e.REFERENCE = 103] = "REFERENCE", e;
}({}), Cn = { OPENID: "openid" }, wn = /* @__PURE__ */ new Set(["GROUP_AT_MESSAGE_CREATE", "GROUP_MESSAGE_CREATE"]), Tn = {
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
}, En = /* @__PURE__ */ new Map([
	[4001, "invalid opcode"],
	[4002, "invalid payload"],
	[4010, "invalid shard"],
	[4011, "too many guilds, sharding required"],
	[4012, "invalid version"],
	[4013, "invalid intent"],
	[4014, "intent not permitted"],
	[4914, "bot is offline, only the sandbox environment is allowed"],
	[4915, "bot is banned"]
]), Dn = /* @__PURE__ */ new Set([
	4006,
	4007,
	...Array.from({ length: 14 }, (e, t) => 4900 + t)
]), On = /^\[.+\]$/, kn = /^=== 消息 \d+ ===$/, An = /^--- 第\d+条 ---$/, jn = /^\[(消息内容|发送者|消息类型|关联消息|附件\d+)\] ?(.*)$/, Mn = 4;
function Nn() {
	return {
		content: [],
		attachments: [],
		related: []
	};
}
function Pn(e, t) {
	for (let n = e.length - 1; n >= 0; n--) if (e[n].indent === t) return n;
	return -1;
}
function Fn(e) {
	return {
		type: /(?:^| )类型:(\S+)/.exec(e)?.[1],
		filename: /(?:^| )文件名:(\S+)/.exec(e)?.[1],
		url: /(?:^| )URL:(\S+)/.exec(e)?.[1]
	};
}
function In(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = t.findIndex((e) => e.trim() !== "");
	if (n < 0 || !On.test(t[n].trim())) return;
	let r = [], i = [], a;
	for (let e of t.slice(n + 1)) {
		let t = e.trim();
		if (!t) continue;
		let n = e.length - e.trimStart().length;
		if (n === 0 && kn.test(t)) {
			let e = Nn();
			r.push(e), i = [{
				message: e,
				indent: 0
			}], a = void 0;
			continue;
		}
		if (An.test(t)) {
			let e = Pn(i, n);
			if (e < 0) return;
			let t = Nn();
			i[e].message.related.push(t), i = [...i.slice(0, e + 1), {
				message: t,
				indent: n + Mn
			}], a = void 0;
			continue;
		}
		let o = jn.exec(t);
		if (o) {
			let e = Pn(i, n);
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
				default: t.message.attachments.push(Fn(s));
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
var Ln = /<@all>|<@!?(\w+)>|<faceType=\d+,faceId="[^"]*",ext="([^"]*)">|(https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+)/g, Rn = /^\[.+的聊天记录\]$/, zn = 32;
function L(e, t) {
	let n = `${t}=`;
	return e.message_scene?.ext?.find((e) => e.startsWith(n))?.slice(n.length);
}
function Bn(e, t) {
	let n = t.mentions ?? [];
	return n.some((e) => e.scope === "all") || (t.content ?? "").includes("<@all>") ? !1 : e === "GROUP_AT_MESSAGE_CREATE" || n.some((e) => e.is_you === !0);
}
function Vn(e) {
	try {
		let t = JSON.parse(Buffer.from(e, "base64").toString("utf8"));
		return t.text ? `[${t.text}]` : "";
	} catch {
		return "";
	}
}
function Hn(e, t) {
	return `@${(e ? t?.find((t) => t.id === e || t.member_openid === e) : t?.find((e) => e.scope === "all"))?.username || e || "all"}`;
}
function Un(e, t, n, r, i) {
	let a = "", o = 0;
	Ln.lastIndex = 0;
	for (let s = Ln.exec(e); s; s = Ln.exec(e)) {
		let [c, l, u, d] = s;
		if (a += n(e.slice(o, s.index)), o = s.index + c.length, d) {
			let e = Pe(d);
			a += r(e) + n(d.slice(e.length));
		} else a += u === void 0 ? i(Hn(l, t)) : n(Vn(u));
	}
	return a + n(e.slice(o));
}
function Wn(e, t) {
	return Un(e, t, y, (e) => w(e, e), D);
}
function Gn(e, t) {
	let n = (e) => e, r = Un(e, t, n, n, n).replace(/\s+/g, " ").trim();
	return r.length > zn ? `${r.slice(0, zn)}...` : r;
}
function R(e) {
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
function z(e, t, n, r) {
	e.media += r.length;
	let i = [x(r.filter((e) => e.kind === "image").map((e) => C(e.url, e.name)).join("") + Wn(t, n))];
	for (let e of r) switch (e.kind) {
		case "voice":
			i.push(ze(e.url)), e.asr && i.push(x(y(e.asr)));
			break;
		case "video":
			i.push(E(e.url));
			break;
		case "file": i.push(x(w(e.name || e.url, e.url)));
	}
	return i.filter(Boolean);
}
function Kn(e, t, n) {
	let r = L(t, "ref_msg_idx"), i = t.msg_elements?.find((e) => e.msg_idx === r) ?? t.msg_elements?.[0], a = (t.attachments ?? []).map(R);
	if (n) return [S([Ve(n, Gn(i?.content ?? "", t.mentions) || e.labels.quote)]), ...z(e, t.content.trim(), t.mentions, a)];
	let o = i ? z(e, i.content ?? "", t.mentions, (i.attachments ?? []).map(R)) : [];
	return [S(o.length > 0 ? o : [y(e.labels.quote)]), ...z(e, t.content.trim(), t.mentions, a)];
}
function qn(e, t) {
	let n = [...z(e, t.related.length > 0 && t.content.length === 1 && Rn.test(t.content[0]) ? "" : t.content.join("\n"), void 0, t.attachments.filter((e) => e.url).map((e) => ({
		kind: e.type === "图片" ? "image" : e.type === "视频" ? "video" : "file",
		url: e.url,
		name: e.filename
	}))), ...t.related.map((t) => qn(e, t))].filter(Boolean);
	return b(n.length > 0 ? n : [y(e.labels.unavailable)], { "custom-author-username": t.sender });
}
function Jn(e, t) {
	let n = {
		labels: t.labels,
		media: 0
	}, r;
	switch (e.message_type) {
		case Sn.CHAT_RECORD: {
			let t = In(e.content);
			r = t ? t.map((e) => qn(n, e)) : z(n, e.content, e.mentions, (e.attachments ?? []).map(R));
			break;
		}
		case Sn.REFERENCE:
			r = Kn(n, e, t.reference);
			break;
		default: r = z(n, e.content, e.mentions, (e.attachments ?? []).map(R));
	}
	return {
		kramdown: b(r.length > 0 ? r : [y(t.labels.unavailable)], {
			"custom-event-id": t.eventId,
			"custom-author-id": e.author?.id,
			"custom-author-username": e.author?.username,
			"custom-msg-idx": L(e, "msg_idx")
		}),
		media: n.media
	};
}
//#endregion
//#region src/qq/openapi.ts
var Yn = class extends Error {};
function Xn(e, t, n) {
	if (typeof e != "string" || !e.startsWith("/")) throw TypeError(`url must be a path starting with "/", got ${JSON.stringify(e)}`);
	let r = typeof t == "string" ? t.toUpperCase() : "";
	if (!xn.has(r)) throw TypeError(`method must be one of ${[...xn].join(", ")}, got ${JSON.stringify(t)}`);
	return {
		url: e,
		method: r,
		body: n ?? void 0
	};
}
function B(e) {
	let t = e.appid.trim(), n = e.secret.trim();
	return t && n ? {
		appid: t,
		secret: n
	} : void 0;
}
function Zn(e) {
	if (!e) return null;
	let t = h(e);
	return t === void 0 ? e : t;
}
var Qn = class {
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
		let n = await this.accessToken(e), r = await g(this.siyuan, {
			url: `${_n}${t.url}`,
			method: t.method,
			headers: { Authorization: [`QQBot ${n}`] },
			json: t.body
		});
		return r.status === 401 && this.token?.value === n && (this.token = void 0), {
			status: r.status,
			headers: r.headers,
			body: Zn(r.body)
		};
	}
	async fetchAccessToken(e, t) {
		let n = await g(this.siyuan, {
			url: gn,
			method: "POST",
			json: {
				appId: e,
				clientSecret: t
			}
		}), r = h(n.body);
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
		throw n.status === 429 || n.status >= 500 || r?.code === 100001 ? Error(i) : new Yn(`${i}, check QQ_BOT_APPID and QQ_BOT_SECRET`);
	}
}, $n = /^\/(\S+)/, er = "owner", tr = /<@!?(\w+)>/g, nr = 1024;
function rr(e) {
	return e instanceof Error ? e.message : String(e);
}
function ir(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.mentions ?? []) if (n.is_you) for (let e of [n.id, n.member_openid]) e && t.add(e);
	return (e.content ?? "").replace(tr, (e, n) => t.has(n) ? "" : e);
}
var ar = class {
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
		} else if (e.t && wn.has(e.t)) {
			let i = e.d, a = i.author?.member_openid || i.author?.id;
			if (!a || !i.group_openid || !Bn(e.t, i)) return;
			t = i, n = ir(i), r = {
				path: `/v2/groups/${encodeURIComponent(i.group_openid)}/messages`,
				user: a,
				group: i.group_openid
			};
		} else return;
		let i = $n.exec(n.trim())?.[1];
		if (i !== Cn.OPENID || this.isAnswered(t)) return;
		let a = t.author?.member_role;
		if (r.group && a !== er) {
			this.siyuan.logger.info(`[qq] [commands] ignore /${i} from ${r.user} in group ${r.group}: only the group owner can send commands, and the member_role is ${a || "empty"}`);
			return;
		}
		this.remember(t), this.siyuan.logger.info(`[qq] [commands] /${i} from ${r.user}${r.group ? ` in group ${r.group}` : ""}`), this.reply(t, r, this.openIdText(r));
	}
	keys(e) {
		let t = L(e, "msg_idx");
		return [`id:${e.id}`, ...t ? [`idx:${t}`] : []];
	}
	isAnswered(e) {
		return this.keys(e).some((e) => this.answered.has(e)) ? (this.siyuan.logger.debug(`[qq] [commands] the message ${e.id} is already answered, skip it`), !0) : !1;
	}
	remember(e) {
		for (let t of this.keys(e)) this.answered.add(t);
		for (; this.answered.size > nr * 2;) this.answered.delete(this.answered.values().next().value);
	}
	openIdText(e) {
		let t = this.openIdLabels(), n = [t.user.replaceAll("{{1}}", e.user)];
		return e.group && n.push(t.group.replaceAll("{{1}}", e.group)), n.join("\n");
	}
	async reply(e, t, n) {
		let r = B(this.config());
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
			this.siyuan.logger.warn(`[qq] [commands] reply to the message ${e.id} failed:`, rr(t));
		}
	}
	openIdLabels() {
		let e = this.siyuan.plugin.i18n?.commands?.openid;
		return {
			user: e?.user || "User OpenID: {{1}}",
			group: e?.group || "Group OpenID: {{1}}"
		};
	}
};
//#endregion
//#region src/utils/storage.ts
function V(e) {
	let t = String(e).replace(/[^\w.@-]/g, "_");
	return /^\.*$/.test(t) ? "_".repeat(Math.max(t.length, 1)) : t;
}
function or(e) {
	return `qq/${V(e)}/chats.json`;
}
function sr(e, t, n) {
	return `qq/${V(e)}/events/${V(t)}/${V(n)}.json`;
}
function cr(e) {
	return `weixin/${V(e)}`;
}
function lr(e) {
	return `${cr(e)}/auth.json`;
}
function ur(e) {
	return `${cr(e)}/cursor.json`;
}
function dr(e, t) {
	return `${cr(e)}/events/${V(t)}.json`;
}
function fr(e, t) {
	return `telegram/${V(e)}/events/${V(t)}.json`;
}
function pr(e, t, n) {
	return `feishu/${V(e)}/events/${V(t)}/${V(n)}.json`;
}
//#endregion
//#region src/qq/event-log.ts
function mr(e, t) {
	let n = t.t, r = `${n}:`, i = t.id?.startsWith(r) ? t.id.slice(r.length) : t.id;
	if (e && n && i) return sr(e, n, i);
}
//#endregion
//#region src/qq/intents.ts
function hr(e) {
	let t = 0;
	for (let [n, r] of Object.entries(Tn)) e[n] === !0 && (t |= r);
	return t;
}
function gr(e) {
	return `${Object.entries(Tn).filter(([, t]) => e & t).map(([e]) => e).join("|")} (${e})`;
}
//#endregion
//#region src/qq/gateway.ts
function _r(e) {
	return e instanceof Error ? e.message : String(e);
}
var vr = class {
	siyuan;
	openapi;
	onDispatch;
	options;
	socket;
	connection = 0;
	token = "";
	sessionId = "";
	seq = 0;
	heartbeatInterval = vn;
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
			this.options = t, this.siyuan.logger.info(`[qq] connecting, intents: ${gr(t.intents)}`), this.connect();
		}
	}
	async stop() {
		this.options = void 0, this.clearReconnect(), this.resetSession(), this.setState("stopped"), await this.detach(1e3, "stop");
	}
	resolveOptions(e) {
		let t = e.appid.trim(), n = e.secret.trim();
		if (!t || !n) return this.siyuan.logger.info("[qq] QQ_BOT_APPID or QQ_BOT_SECRET is not configured, skip connecting"), "unconfigured";
		let r = hr(e.intents);
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
			let a = await this.siyuan.client.socket(`/ws/network/proxy?u=${re(r.url)}`);
			if (t !== this.connection) {
				a.close().catch(() => {});
				return;
			}
			this.socket = a, a.onmessage = (e) => this.onMessage(t, e), a.onclose = (e) => this.onDisconnect(t, `closed ${e.code} ${e.reason}`, e.code), a.onerror = (e) => {
				setTimeout(() => this.onDisconnect(t, `error ${_r(e.error)}`), 0);
			}, await a.open();
		} catch (e) {
			if (t !== this.connection) return;
			if (e instanceof Yn) {
				this.siyuan.logger.error(`[qq] ${e.message}, stop connecting`), this.options = void 0, this.setState("failed", { error: e.message });
				return;
			}
			this.onDisconnect(t, `connect failed: ${_r(e)}`);
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
			case I.HELLO:
				this.heartbeatInterval = n.d?.heartbeat_interval || 45e3, this.siyuan.logger.debug(`[qq] hello, heartbeat interval: ${this.heartbeatInterval} ms`), this.sessionId ? this.resume(e) : this.identify(e);
				break;
			case I.DISPATCH:
				if (typeof n.s == "number" && (this.seq = n.s), n.t === "READY") {
					let t = n.d;
					this.sessionId = t.session_id, this.username = t.user?.username ?? "", this.onSessionReady(e);
				} else n.t === "RESUMED" && this.onSessionReady(e);
				this.onDispatch(n);
				break;
			case I.HEARTBEAT:
				this.sendHeartbeat(e);
				break;
			case I.HEARTBEAT_ACK:
				this.heartbeatAcked = !0, this.siyuan.logger.trace("[qq] heartbeat ACK");
				break;
			case I.RECONNECT:
				this.onDisconnect(e, "the gateway requests a reconnect");
				break;
			case I.INVALID_SESSION:
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
			if (this.detach(4e3, "reconnect"), n !== void 0 && En.has(n)) {
				this.siyuan.logger.error(`[qq] disconnected (${t}): ${En.get(n)}, stop reconnecting`), this.options = void 0, this.resetSession(), this.setState("failed", { error: `${En.get(n)} (${t})` });
				return;
			}
			n !== void 0 && Dn.has(n) && this.resetSession(), this.siyuan.logger.warn(`[qq] disconnected (${t}), will ${this.sessionId ? "resume" : "identify"}`), this.scheduleReconnect(t);
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
		let e = Math.min(yn * 2 ** this.reconnectAttempts, bn);
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
			op: I.IDENTIFY,
			d: {
				token: `QQBot ${this.token}`,
				intents: this.options?.intents,
				shard: [0, 1]
			}
		});
	}
	resume(e) {
		this.send(e, {
			op: I.RESUME,
			d: {
				token: `QQBot ${this.token}`,
				session_id: this.sessionId,
				seq: this.seq
			}
		});
	}
	sendHeartbeat(e) {
		this.heartbeatAcked = !1, this.siyuan.logger.trace(`[qq] heartbeat, seq: ${this.seq}`), this.send(e, {
			op: I.HEARTBEAT,
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
			this.siyuan.logger.warn(`[qq] send op ${t.op} failed: ${_r(e)}`);
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
}, yr = "custom-msg-idx";
function br(e) {
	return e instanceof Error ? e.message : String(e);
}
function xr(e) {
	return e.bindings.filter((e) => e.enabled && e.chat && e.doc);
}
var Sr = class {
	siyuan;
	openapi;
	writer;
	config;
	constructor(e, t, n, r) {
		this.siyuan = e, this.openapi = t, this.writer = n, this.config = r;
	}
	handle(e) {
		if (!e.t || !wn.has(e.t)) return;
		let t = e.d;
		if (Bn(e.t, t)) return;
		let n = xr(this.config().inbox).filter((e) => e.chat === t.group_openid);
		n.length !== 0 && this.writer.enqueue(async () => {
			for (let [r, i] of n.entries()) try {
				await this.write(i, e.id ?? "", t, r + 1);
			} catch (e) {
				this.siyuan.logger.warn(`[qq] [inbox] write the message ${t.id} of group ${i.chat} to ${i.doc} failed:`, br(e));
			}
		});
	}
	async write(e, t, n, r) {
		let i = e.doc;
		await this.writer.prepare(i);
		let a = L(n, "msg_idx");
		if (a && await this.writer.findMessage(i, yr, a)) {
			this.siyuan.logger.debug(`[qq] [inbox] the message ${a} is already in ${i}, skip it`);
			return;
		}
		let o = n.message_type === Sn.REFERENCE ? L(n, "ref_msg_idx") : void 0, s = Jn(n, {
			eventId: t,
			reference: o ? await this.writer.findMessage(i, yr, o) : void 0,
			labels: this.labels()
		}), { block: c, temp: l } = await this.writer.appendToTemp(i, s.kramdown);
		a && this.writer.remember(i, yr, a, c), e.reply && this.reply(n, c, r), s.media > 0 && this.config().inbox.downloadAssets && await this.writer.downloadAssets(l), await this.writer.moveToDate(i, c, Xt(n.timestamp));
	}
	async reply(e, t, n) {
		let r = B(this.config());
		if (!r) return;
		let i = L(e, "msg_idx");
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
			this.siyuan.logger.warn(`[qq] [inbox] reply to the message ${e.id} with the block ${t} failed:`, br(n));
		}
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.inbox;
		return {
			quote: e?.quote || "Quoted message",
			unavailable: e?.unavailable || "[Message not available]"
		};
	}
}, Cr = {
	offline: "Inbox offline: messages of this group are not recorded for now (device: {{1}})",
	online: "Inbox online: messages of this group are recorded in SiYuan (device: {{1}})"
};
function wr(e) {
	return e instanceof Error ? e.message : String(e);
}
var Tr = class {
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
			this.siyuan.logger.warn(`[qq] [notices] send the ${n} notice to group ${t} failed:`, wr(e));
		}
	}
	text(e) {
		return this.siyuan.plugin.i18n?.notices?.[e] || Cr[e];
	}
}, Er = 50, Dr = 10;
function Or(e) {
	return e instanceof Error ? e.message : String(e);
}
function kr(e) {
	return {
		type: e.type ?? "command",
		name: e.name ?? "",
		desc: e.desc ?? "",
		only_admin: e.only_admin ?? !1,
		link: e.link ?? ""
	};
}
function Ar(e, t) {
	let n = (e) => JSON.stringify({
		items: (e?.items ?? []).map(kr),
		remark: e?.remark ?? ""
	});
	return n(e) === n(t);
}
var jr = class {
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
			n = !1, this.siyuan.logger.warn(`[qq] [panels] sync the ${r?.scope} panel ${JSON.stringify(r?.panel?.remark)} failed:`, Or(e));
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
		if (t.target_type && a.target_type && t.target_type !== a.target_type && this.siyuan.logger.warn(`[qq] [panels] the ${r} panel "${n}" (${a.panel_id}) has target_type ${a.target_type} instead of ${t.target_type}, which an update cannot change`), Ar(a.panel, i)) {
			this.siyuan.logger.debug(`[qq] [panels] the ${r} panel "${n}" (${a.panel_id}) is up to date`);
			return;
		}
		let o = await this.call(e, "PUT", `/v2/panels/${encodeURIComponent(a.panel_id)}`, { panel: i });
		this.siyuan.logger.info(`[qq] [panels] updated the ${r} panel "${n}" (${a.panel_id}) to version ${o.version}`);
	}
	async find(e, t, n) {
		let r = "";
		for (let i = 0; i < Dr; i++) {
			let i = `scope=${encodeURIComponent(t)}&limit=${Er}${r ? `&cursor=${encodeURIComponent(r)}` : ""}`, a = await this.call(e, "GET", `/v2/panels?${i}`), o = a.records?.find((e) => e.panel?.remark === n);
			if (o) return o;
			if (a.is_end || !a.next_cursor) return;
			r = a.next_cursor;
		}
		throw Error(`the ${t} panels have more than ${Dr} pages`);
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
}, Mr = 5e3;
function Nr(e) {
	return e instanceof Error ? e.message : String(e);
}
function H(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Pr(e) {
	let t = typeof e == "number" ? e * 1e3 : typeof e == "string" ? Date.parse(e) : NaN, n = new Date(t);
	return (Number.isNaN(n.getTime()) ? /* @__PURE__ */ new Date() : n).toISOString();
}
function U(e) {
	return typeof e == "string" ? Date.parse(e) : NaN;
}
function W(e, t) {
	return t ? e && U(e.time) > U(t.time) ? e : t : e;
}
function Fr(e, t) {
	let n = W(e, t), r = n === t ? e : t;
	return n && !n.username && r?.username && r.openid === n.openid ? {
		...n,
		username: r.username
	} : n;
}
function Ir(e, t) {
	return U(e) < U(t) ? e : t;
}
function Lr(e, ...t) {
	let n = U(e?.time);
	return Number.isNaN(n) || t.some((e) => U(e?.time) > n) ? "added" : "removed";
}
function G(e, t) {
	let n = H(e) ? e[t] : void 0;
	return H(n) ? n : void 0;
}
function Rr(e) {
	let t = {};
	for (let [n, r] of Object.entries(e ?? {})) H(r) && (t[n] = r);
	return t;
}
function zr(e, t) {
	let n = W(e?.added, t.added), r = W(e?.removed, t.removed), i = W(e?.lastMessage, t.lastMessage);
	return {
		...e,
		status: Lr(r, n, i),
		name: t.name || e?.name,
		firstSeen: Ir(e?.firstSeen, t.firstSeen),
		added: n,
		removed: r,
		proactive: W(e?.proactive, t.proactive),
		lastMessage: i,
		owner: Fr(e?.owner, t.owner)
	};
}
function Br(e, t) {
	let n = W(e?.added, t.added), r = W(e?.removed, t.removed), i = Fr(e?.lastMessage, t.lastMessage);
	return {
		...e,
		status: Lr(r, n, i),
		firstSeen: Ir(e?.firstSeen, t.firstSeen),
		unionOpenid: t.unionOpenid || e?.unionOpenid,
		added: n,
		removed: r,
		proactive: W(e?.proactive, t.proactive),
		lastMessage: i
	};
}
function Vr(e, t) {
	let n = { ...G(e, "groups") };
	for (let [e, r] of Object.entries(t.groups)) n[e] = zr(G(n, e), r);
	let r = { ...G(e, "users") };
	for (let [e, n] of Object.entries(t.users)) r[e] = Br(G(r, e), n);
	return {
		...H(e) ? e : {},
		groups: n,
		users: r
	};
}
function Hr(e, t) {
	let n = { ...e };
	for (let [r, i] of Object.entries(t)) n[r] = Vr(e[r], i);
	return n;
}
function Ur(e, t) {
	return {
		groups: { [e]: zr(void 0, t) },
		users: {}
	};
}
function Wr(e, t) {
	return {
		groups: {},
		users: { [e]: Br(void 0, t) }
	};
}
function Gr(e) {
	switch (e.t) {
		case "GROUP_ADD_ROBOT":
		case "GROUP_DEL_ROBOT":
		case "GROUP_MSG_RECEIVE":
		case "GROUP_MSG_REJECT": {
			let t = e.d;
			if (!t?.group_openid) return;
			let n = Pr(t.timestamp), r = {
				time: n,
				operator: t.op_member_openid || void 0
			};
			return Ur(t.group_openid, {
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
			let n = Pr(t.timestamp), r = t.author?.member_openid || t.author?.id;
			return Ur(t.group_openid, {
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
			let n = Pr(t.timestamp);
			return Wr(t.openid, {
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
			let r = Pr(t.timestamp);
			return Wr(n, {
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
var Kr = class {
	siyuan;
	config;
	pending = {};
	timer;
	queue = Promise.resolve();
	constructor(e, t) {
		this.siyuan = e, this.config = t;
	}
	handle(e) {
		let t = this.config().appid.trim(), n = t ? Gr(e) : void 0;
		n && this.record(t, n);
	}
	recordGroupName(e, t, n) {
		this.record(e, Ur(t, {
			firstSeen: (/* @__PURE__ */ new Date()).toISOString(),
			name: n
		}));
	}
	flush() {
		return clearTimeout(this.timer), this.timer = void 0, this.queue = this.queue.then(() => this.write()), this.queue;
	}
	list(e) {
		let t = this.queue.then(async () => {
			let t = await this.read(e), n = this.pending[e], r = n ? Vr(t, n) : t;
			return {
				groups: Rr(G(r, "groups")),
				users: Rr(G(r, "users"))
			};
		});
		return this.queue = t.then(() => void 0, () => void 0), t;
	}
	record(e, t) {
		this.pending = Hr(this.pending, { [e]: t }), this.timer === void 0 && (this.timer = setTimeout(() => void this.flush(), Mr));
	}
	async write() {
		let e = this.pending;
		this.pending = {};
		for (let [t, n] of Object.entries(e)) {
			let e = or(t);
			try {
				let r = Vr(await this.read(t), n);
				await this.siyuan.storage.put(e, JSON.stringify(r, void 0, 4)), this.siyuan.logger.debug(`[qq] [chats] updated ${e}`);
			} catch (r) {
				this.pending = Hr({ [t]: n }, this.pending), this.siyuan.logger.warn(`[qq] [chats] update ${e} failed, retry with the next change:`, Nr(r));
			}
		}
	}
	async read(e) {
		let t = or(e);
		if (!await this.exists(t)) return {};
		let n = await (await this.siyuan.storage.get(t)).text(), r;
		try {
			r = JSON.parse(n);
		} catch (e) {
			throw Error(`${t} is not valid JSON, fix or delete it: ${Nr(e)}`);
		}
		if (!H(r)) throw Error(`${t} is not a JSON object, fix or delete it`);
		return r;
	}
	async exists(e) {
		let t = ".";
		for (let n of e.split("/")) {
			if (!(await this.siyuan.storage.list(t)).some((e) => e.name === n)) return !1;
			t = t === "." ? n : `${t}/${n}`;
		}
		return !0;
	}
}, qr = /^\d+:[\w-]+$/, Jr = [
	"message",
	"channel_post",
	"my_chat_member"
], Yr = 2e3, Xr = 3e4, Zr = /* @__PURE__ */ new Set([
	401,
	404,
	409
]), Qr = 104857600, $r = {
	START: "start",
	CHATID: "chatid"
}, ei = /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/;
function ti(e) {
	return e instanceof Error ? e.message : String(e);
}
function ni(e) {
	return new Promise((t) => setTimeout(t, e));
}
function ri(e) {
	return e.slice(0, e.indexOf(":"));
}
function ii(e, t) {
	return e.replaceAll(t, () => `${ri(t)}:***`);
}
function ai(e) {
	let t = e.token.trim();
	if (!t) return;
	if (!qr.test(t)) throw Error("the token is not in the form <bot ID>:<secret> given by @BotFather");
	let n = (e.apiBaseUrl.trim() || "https://api.telegram.org").replace(/\/+$/, "");
	if (!ei.test(n)) throw Error(`the Bot API server ${n} is not an http or https URL without a query or a fragment`);
	return {
		token: t,
		apiBaseUrl: n
	};
}
var K = class extends Error {
	code;
	parameters;
	constructor(e, t, n = {}) {
		super(e), this.name = "TelegramApiError", this.code = t, this.parameters = n;
	}
}, oi = class {
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
			allowed_updates: Jr
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
			r = await se(this.siyuan, {
				url: `${e.apiBaseUrl}/file/bot${e.token}/${n}`,
				method: "GET"
			});
		} catch (n) {
			throw Error(ii(`download ${t} failed: ${ti(n)}`, e.token));
		}
		if (r.status < 200 || r.status >= 300) throw Error(`download ${t} failed: HTTP ${r.status}`);
		return r.body;
	}
	async call(e, t, n = {}) {
		let r;
		try {
			r = await g(this.siyuan, {
				url: `${e.apiBaseUrl}/bot${e.token}/${t}`,
				method: "POST",
				json: n
			});
		} catch (n) {
			throw Error(ii(`${t} failed: ${ti(n)}`, e.token));
		}
		let i = h(r.body);
		if (typeof i?.ok != "boolean") throw new K(ii(`${t} failed: HTTP ${r.status} ${r.body.slice(0, 200)}`, e.token), r.status);
		if (!i.ok) {
			let n = i.error_code ?? r.status;
			throw new K(ii(`${t} failed: ${n} ${i.description ?? ""}`.trim(), e.token), n, i.parameters);
		}
		return i.result;
	}
	async callWithRetry(e, t, n) {
		for (let r = 1;; r++) try {
			return await this.call(e, t, n);
		} catch (e) {
			let n = e instanceof K ? e.parameters.retry_after : void 0;
			if (n === void 0 || r >= 3 || n > 60) throw e;
			this.siyuan.logger.info(`[telegram] ${t} is rate limited, retry in ${n} s`), await ni(n * 1e3);
		}
	}
}, si = /* @__PURE__ */ new Set([
	"blockquote",
	"expandable_blockquote",
	"pre"
]), ci = /* @__PURE__ */ new Set([
	"bold",
	"italic",
	"spoiler",
	"strikethrough",
	"underline"
]), li = /[\r\n]/, ui = /\s/, di = /^[a-z][\w+.-]*:\/\//i;
function fi(e) {
	return !e || si.has(e.type) ? 0 : ci.has(e.type) ? 1 : 2;
}
function pi(e, t) {
	let n = t.offset, r = t.offset + t.length;
	if (!(n >= 0 && r > n && r <= e.length)) return [];
	if (si.has(t.type)) return [{
		entity: t,
		start: n,
		end: r,
		last: !0,
		children: []
	}];
	let i = [], a = n;
	for (let o = n; o <= r; o++) {
		if (o < r && !li.test(e.charAt(o))) continue;
		let n = a, s = o;
		if (ci.has(t.type)) {
			for (; n < s && ui.test(e.charAt(n));) n++;
			for (; s > n && ui.test(e.charAt(s - 1));) s--;
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
function mi(e, t) {
	let n = [];
	for (let r of t) n.push(...pi(e, r));
	n.sort((e, t) => e.start - t.start || t.end - e.end || fi(e.entity) - fi(t.entity));
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
function hi(e) {
	let t = /* @__PURE__ */ new Date((e ?? NaN) * 1e3);
	return Number.isNaN(t.getTime()) ? "" : t.toISOString();
}
function gi(e) {
	return di.test(e) ? e : `http://${e}`;
}
function _i(e, t) {
	let n = t.underline ? (e) => e ? Ie(e) : "" : y;
	return t.link ? n(e) : T(e, n);
}
function vi(e, t, n) {
	return xi(e, t, n, !1).map((e) => "inline" in e ? e.inline : "").join("");
}
function yi(e, t, n) {
	let r = t.entity;
	if (r.type === "pre") {
		let n = e.slice(t.start, t.end);
		return n.trim() ? Re(n, r.language) : "";
	}
	let i = x(vi(e, t, n));
	return i ? S([i]) : "";
}
function bi(e, t, n) {
	let r = t.entity, i = e.slice(t.start, t.end), a = (r = n) => vi(e, t, r), o = (e) => n.link || !e ? a() : Ae(a({
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
		case "pre": return Le(i);
		case "mention":
		case "bot_command": return D(i);
		case "text_mention": return D(`@<${i}>`);
		case "text_link": return o(r.url);
		case "url": return o(gi(i));
		case "email": return o(`mailto:${i}`);
		case "phone_number": return o(`tel:${i.replace(/[^\d+]/g, "")}`);
		case "date_time": {
			let e = t.last ? hi(r.unix_time) : "";
			return e ? Be(i, e) : y(i);
		}
		default: return a();
	}
}
function xi(e, t, n, r) {
	let i = [], a = "", o = t.start, s = !1;
	for (let c of t.children) c.start > o && (a += _i(e.slice(o, c.start), n), s = !1), r && si.has(c.entity.type) ? (i.push({ inline: a }, { block: yi(e, c, n) }), a = "", s = !1) : (a += (s ? "​" : "") + bi(e, c, n), s = !0), o = c.end;
	return t.end > o && (a += _i(e.slice(o, t.end), n)), i.push({ inline: a }), i.filter((e) => "block" in e ? e.block : e.inline);
}
function Si(e, t) {
	return xi(e, mi(e, t ?? []), {
		underline: !1,
		link: !1
	}, !0);
}
//#endregion
//#region src/telegram/message.ts
var Ci = 32, wi = /^(?:\/|[a-z]:[\\/])/i;
function q(e) {
	return `${e.chat.id}:${e.message_id}`;
}
function Ti(e) {
	return wi.test(e);
}
function Ei(e, t) {
	let n = e.text, r = e.entities?.find((e) => e.type === "bot_command" && e.offset === 0);
	if (!n || !r) return;
	let [i = "", a] = n.slice(1, r.length).split("@");
	if (!(a && a.toLowerCase() !== t?.toLowerCase())) return i.toLowerCase();
}
function Di(e) {
	let t = e.reply_to_message;
	return t && !t.forum_topic_created ? t : void 0;
}
function J(e) {
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
function Oi(e) {
	return !!(e.text || e.caption || J(e) || e.location || e.contact || e.poll || e.dice);
}
function ki(e, t) {
	return [t[e.kind], e.title].filter(Boolean).join(" ");
}
function Ai(e, t) {
	let n = J(e);
	if (n) return ki(n, t);
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
function ji(e, t) {
	return [Ai(e, t), e.text ?? e.caption ?? ""].map((e) => e.trim()).filter(Boolean).join(" ");
}
function Mi(e) {
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
function Ni(e, t, n) {
	let { latitude: r, longitude: i } = e, a = `https://www.openstreetmap.org/?mlat=${r}&mlon=${i}#map=16/${r}/${i}`, o = n ? [n.title, n.address].filter(Boolean).join(" ") : "";
	return [
		y(t.location),
		y(o),
		w(`${r}, ${i}`, a)
	].filter(Boolean).join(" ");
}
function Pi(e) {
	return e.replace(/^.*\//, "");
}
function Fi(e, t, n) {
	let r = t.file;
	if (e.isAnimated) {
		let i = t.thumbnail ? C(t.thumbnail, e.title || n.sticker) : y(ki(e, n));
		return [{ inline: r ? `${i} ${w(Pi(r), r)}` : i }];
	}
	if (!r) return [{ inline: y(ki(e, n)) }];
	switch (e.kind) {
		case "image": return [{ inline: C(r, n.image) }];
		case "sticker": return [e.isVideo ? { block: E(r) } : { inline: C(r, e.title || n.sticker) }];
		case "animation": return [/\.gif(?:\?|$)/i.test(r) ? { inline: C(r, n.animation) } : { block: E(r) }];
		case "video": return [{ block: E(r) }];
		case "voice": return [{ block: ze(r) }];
		case "audio": return [{ block: ze(r) }, { inline: y(e.title ?? "") }];
		case "file": return [{ inline: `${y(n.file)} ${w(e.name?.trim() || Pi(r), r)}` }];
	}
}
function Ii(e) {
	let t = e.replace(/\s+/g, " ").trim();
	return t.length > Ci ? `${t.slice(0, Ci)}...` : t;
}
function Li(e, t) {
	let { assets: n, labels: r, reference: i } = t, a = [], o = J(e);
	o ? a.push(...Fi(o, n ?? {}, r)) : e.venue ? a.push({ inline: Ni(e.venue.location, r, e.venue) }) : e.location ? a.push({ inline: Ni(e.location, r) }) : a.push({ inline: y(Ai(e, r)) });
	let s = e.text ?? e.caption;
	s && a.push(...Si(s, e.text === void 0 ? e.caption_entities : e.entities));
	let c = a.filter((e) => "block" in e || x(e.inline)), l = [], u = Di(e);
	if (u) {
		let t = e.quote?.text?.trim() || ji(u, r);
		l.push(S([i ? Ve(i, Ii(t) || r.quote) : y(t || r.quote)]));
	}
	l.push(...c.map((e) => "block" in e ? e.block : x(e.inline)));
	let d = Mi(e);
	return b(l.length > 0 ? l : [y(r.unavailable)], {
		"custom-update-id": t.updateId === void 0 ? void 0 : String(t.updateId),
		"custom-author-id": String(d.id),
		"custom-author-username": t.showAuthor ? d.name : void 0,
		"custom-msg-id": q(e)
	});
}
//#endregion
//#region src/telegram/commands.ts
var Ri = new Set(Object.values($r)), zi = /* @__PURE__ */ new Set(["administrator", "creator"]), Bi = 1024;
function Vi(e) {
	return e instanceof Error ? e.message : String(e);
}
function Hi(e, t) {
	return e.replaceAll("{{1}}", () => t);
}
var Ui = class {
	siyuan;
	api;
	answered = /* @__PURE__ */ new Set();
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	handle(e, t) {
		let n = Ei(t, e.me.username);
		if (n === void 0) return;
		if (!Ri.has(n)) {
			this.siyuan.logger.info(`[telegram] [commands] ignore the unknown command /${n} in chat ${t.chat.id}`);
			return;
		}
		let r = q(t);
		if (this.answered.has(r)) {
			this.siyuan.logger.debug(`[telegram] [commands] the message ${r} is already answered, skip it`);
			return;
		}
		this.answered.add(r), this.answered.size > Bi && this.answered.delete(this.answered.values().next().value), this.answer(e, t, n);
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
			this.siyuan.logger.warn(`[telegram] [commands] answer /${n} in chat ${r.id} failed:`, Vi(e));
		}
	}
	async isAdmin(e, t) {
		if (t.sender_chat) return t.sender_chat.id === t.chat.id;
		if (!t.from) return !1;
		let n = await this.api.getChatMember(e.options, t.chat.id, t.from.id);
		return zi.has(n.status);
	}
	chatIdText(e) {
		let t = this.labels(), n = [Hi(t.chat, String(e.chat.id))], r = e.sender_chat ? void 0 : e.from;
		return r && r.id !== e.chat.id && n.push(Hi(t.user, String(r.id))), n.join("\n");
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.commands?.chatid;
		return {
			chat: e?.chat || "Chat ID: {{1}}",
			user: e?.user || "User ID: {{1}}"
		};
	}
}, Wi = "custom-msg-id";
function Gi(e) {
	return e instanceof Error ? e.message : String(e);
}
function Ki(e) {
	return e.bindings.filter((e) => e.enabled && e.chat && e.doc);
}
var qi = class {
	siyuan;
	api;
	writer;
	media;
	config;
	constructor(e, t, n, r, i) {
		this.siyuan = e, this.api = t, this.writer = n, this.media = r, this.config = i;
	}
	handle(e, t, n) {
		if (Ei(t, e.me.username) !== void 0 || !Oi(t)) return;
		let r = this.config().inbox, i = String(t.chat.id), a = Ki(r).filter((e) => e.chat === i);
		if (a.length === 0) return;
		let o = r.downloadAssets;
		this.writer.enqueue(async () => {
			for (let r of a) try {
				await this.write(e, r, t, n, o);
			} catch (e) {
				this.siyuan.logger.warn(`[telegram] [inbox] write the message ${q(t)} to ${r.doc} failed:`, Gi(e));
			}
		});
	}
	async write(e, t, n, r, i) {
		let a = t.doc;
		await this.writer.prepare(a);
		let o = q(n);
		if (await this.writer.findMessage(a, Wi, o)) {
			this.siyuan.logger.debug(`[telegram] [inbox] the message ${o} is already in ${a}, skip it`);
			return;
		}
		let s = Di(n), c = {
			updateId: r,
			reference: s ? await this.writer.findMessage(a, Wi, q(s)) : void 0,
			showAuthor: n.chat.type !== "private",
			labels: this.labels()
		}, { block: l } = await this.writer.appendToTemp(a, Li(n, c));
		this.writer.remember(a, Wi, o, l), t.reply && this.reply(e, n, l), i && J(n) && await this.saveMedia(e, n, l, c), await this.writer.moveToDate(a, l, Xt(n.date * 1e3));
	}
	async saveMedia(e, t, n, r) {
		let i = await this.media.save(e, t, n);
		if (i.file || i.thumbnail) try {
			await this.writer.updateBlock(n, Li(t, {
				...r,
				assets: i
			}));
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [inbox] put the media of the message ${q(t)} into the block ${n} failed:`, Gi(e));
		}
	}
	async reply(e, t, n) {
		try {
			let r = await this.api.sendText(e.options, t.chat.id, `siyuan://blocks/${n}`, t.message_id);
			this.siyuan.logger.debug(`[telegram] [inbox] replied to the message ${q(t)} with the block ${n}, reply ${r.message_id}`);
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [inbox] reply to the message ${q(t)} with the block ${n} failed:`, Gi(e));
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
//#region src/telegram/media.ts
function Ji(e) {
	return e instanceof Error ? e.message : String(e);
}
function Yi(e) {
	let t = /\.[0-9a-z]+$/i.exec(e)?.[0]?.toLowerCase() ?? "";
	return t === ".oga" ? ".ogg" : t;
}
function Xi(e, t) {
	return e.name?.trim() || `${e.kind}${Yi(t)}`;
}
var Zi = class {
	siyuan;
	api;
	constructor(e, t) {
		this.siyuan = e, this.api = t;
	}
	async save(e, t, n) {
		let r = J(t);
		if (!r) return {};
		let i = `the ${r.kind} of the message ${q(t)}`, a = { file: await this.saveFile(e, r.file, (e) => Xi(r, e), i, n) };
		return r.thumbnail && (a.thumbnail = await this.saveFile(e, r.thumbnail, (e) => `${r.kind}-thumbnail${Yi(e)}`, `the thumbnail of ${i}`, n)), a;
	}
	async saveFile(e, t, n, r, i) {
		try {
			let a = t.file_size;
			if (a && a > 104857600) {
				this.siyuan.logger.warn(`[telegram] [media] ${r} has ${a} bytes, more than ${Qr}, keep it as a placeholder`);
				return;
			}
			let o = await this.api.getFile(e.options, t.file_id);
			if (!o.file_path) throw Error("getFile returned no file_path");
			if (Ti(o.file_path)) throw Error(`the Bot API server runs in --local mode and returned the local path ${o.file_path}, which cannot be downloaded`);
			let s = await this.api.download(e.options, o.file_path);
			if (s.byteLength > 104857600) throw Error(`downloaded ${s.byteLength} bytes, more than ${Qr}`);
			let c = await an(this.siyuan, n(o.file_path), s, i);
			return this.siyuan.logger.debug(`[telegram] [media] saved ${r} (${s.byteLength} bytes) as ${c}`), c;
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] [media] save ${r} failed, keep it as a placeholder:`, Ji(e));
			return;
		}
	}
}, Qi = {
	offline: "Inbox offline: messages of this chat are not recorded for now (device: {{1}})",
	online: "Inbox online: messages of this chat are recorded in SiYuan (device: {{1}})"
};
function $i(e) {
	return e instanceof Error ? e.message : String(e);
}
var ea = class {
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
			this.siyuan.logger.warn(`[telegram] [notices] send the ${n} notice to chat ${t} failed:`, $i(e));
		}
	}
	text(e) {
		return this.siyuan.plugin.i18n?.notices?.telegram?.[e] || Qi[e];
	}
};
//#endregion
//#region src/telegram/poller.ts
function ta(e) {
	return new Promise((t) => setTimeout(t, e));
}
function na(e) {
	return e instanceof Error ? e.message : String(e);
}
function ra(e, t) {
	return e.token === t.token && e.apiBaseUrl === t.apiBaseUrl;
}
var ia = class {
	siyuan;
	api;
	onUpdate;
	onReady;
	generation = 0;
	options;
	current = { status: "stopped" };
	constructor(e, t, n, r) {
		this.siyuan = e, this.api = t, this.onUpdate = n, this.onReady = r;
	}
	get state() {
		return { ...this.current };
	}
	update(e) {
		let t;
		try {
			t = ai(e);
		} catch (e) {
			this.stop(), this.siyuan.logger.error(`[telegram] ${na(e)}, skip receiving updates`), this.setState("failed", { error: na(e) });
			return;
		}
		if (!t) {
			this.stop(), this.siyuan.logger.info("[telegram] the token is not configured, skip receiving updates"), this.setState("unconfigured");
			return;
		}
		if (this.options && ra(this.options, t)) return;
		this.stop();
		let n = ++this.generation;
		this.options = t, this.run(n, t);
	}
	stop() {
		this.options && this.siyuan.logger.info(`[telegram] stop receiving the updates of bot ${ri(this.options.token)}`), this.generation++, this.options = void 0, this.setState("stopped");
	}
	async run(e, t) {
		let n = ri(t.token);
		this.siyuan.logger.info(`[telegram] start receiving the updates of bot ${n}`), this.setState("connecting");
		let r, i, a = 0;
		for (; e === this.generation;) try {
			if (!r) {
				let i = await this.api.getMe(t);
				if (e !== this.generation) return;
				r = i, this.siyuan.logger.info(`[telegram] bot ${n} is @${r.username ?? ""}`), this.onReady({
					options: t,
					me: r
				});
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
				this.siyuan.logger.warn(`[telegram] handle the update ${e.update_id} failed:`, na(t));
			}
		} catch (t) {
			if (e !== this.generation) return;
			if (t instanceof K && Zr.has(t.code)) {
				this.siyuan.logger.error(`[telegram] ${t.message}, stop receiving the updates of bot ${n} until the settings change`), this.generation++, this.options = void 0, this.setState("failed", { error: t.message });
				return;
			}
			a = await this.wait(t, a);
		}
	}
	async wait(e, t) {
		let n = na(e), r = e instanceof K ? e.parameters.retry_after : void 0, i = Yr, a = t + 1;
		return r === void 0 ? a >= 3 && (i = Xr, a = 0) : (i = r * 1e3, a = t), this.siyuan.logger.warn(`[telegram] ${n}, retry in ${i} ms`), this.setState("reconnecting", {
			error: n,
			retryAt: new Date(Date.now() + i).toISOString()
		}), await ta(i), a;
	}
	setState(e, t = {}) {
		this.current = {
			status: e,
			since: (/* @__PURE__ */ new Date()).toISOString(),
			...t
		};
	}
}, aa = "https://ilinkai.weixin.qq.com", oa = "https://novac2c.cdn.weixin.qq.com/c2c", sa = "siyuan-plugin-im-bot", ca = 48e4, la = 1e3, ua = 2e3, da = 3e4, fa = 104857600, pa = /* @__PURE__ */ function(e) {
	return e[e.USER = 1] = "USER", e[e.BOT = 2] = "BOT", e;
}({}), ma = /* @__PURE__ */ function(e) {
	return e[e.NEW = 0] = "NEW", e[e.GENERATING = 1] = "GENERATING", e[e.FINISH = 2] = "FINISH", e;
}({}), Y = /* @__PURE__ */ function(e) {
	return e[e.TEXT = 1] = "TEXT", e[e.IMAGE = 2] = "IMAGE", e[e.VOICE = 3] = "VOICE", e[e.FILE = 4] = "FILE", e[e.VIDEO = 5] = "VIDEO", e;
}({}), ha = /* @__PURE__ */ new Set([
	"\"message_id\"",
	"\"msg_id\"",
	"\"svr_id\""
]), ga = /\s/, _a = /\d/;
function va(e) {
	return e instanceof Error ? e.message : String(e);
}
function ya(e) {
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
		if (!ha.has(e.slice(i, r))) continue;
		let a = r;
		for (; ga.test(e[a] ?? "");) a++;
		if (e[a] !== ":") continue;
		for (a++; ga.test(e[a] ?? "");) a++;
		let o = a;
		e[a] === "-" && a++;
		let s = a;
		for (; _a.test(e[a] ?? "");) a++;
		a > s && (t.push(e.slice(n, o), "\"", e.slice(o, a), "\""), n = a, r = a);
	}
	return t.push(e.slice(n)), JSON.parse(t.join(""));
}
function ba(e) {
	let [t = 0, n = 0, r = 0] = e.split(".").map((e) => Number.parseInt(e, 10) || 0);
	return String((t & 255) << 16 | (n & 255) << 8 | r & 255);
}
function X(e) {
	return e.ret || e.errcode || 0;
}
function xa(e, t) {
	return `${e.replace(/\/+$/, "")}/${t}`;
}
function Sa() {
	return Math.floor(Math.random() * 4294967296);
}
function Ca() {
	return Buffer.from(String(Sa()), "utf8").toString("base64");
}
var wa = class {
	siyuan;
	constructor(e) {
		this.siyuan = e;
	}
	async getQRCode() {
		return this.post("get_bot_qrcode", aa, "ilink/bot/get_bot_qrcode?bot_type=3", { local_token_list: [] });
	}
	async getQRCodeStatus(e, t, n) {
		let r = `ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(t)}`;
		n && (r += `&verify_code=${encodeURIComponent(n)}`);
		try {
			let t = await g(this.siyuan, {
				url: xa(e, r),
				method: "GET",
				headers: this.commonHeaders()
			});
			return this.parse("get_qrcode_status", t);
		} catch (e) {
			let n = va(e).replaceAll(encodeURIComponent(t), "***").replaceAll(t, "***");
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
				client_id: `${sa}:${Date.now()}-${Sa().toString(16).padStart(8, "0")}`,
				message_type: pa.BOT,
				message_state: ma.FINISH,
				item_list: [{
					type: Y.TEXT,
					text_item: { text: n }
				}],
				context_token: r
			},
			base_info: this.baseInfo()
		}, e.token), a = X(i);
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
			bot_agent: `${sa}/${e}`
		};
	}
	commonHeaders() {
		return {
			"iLink-App-Id": ["bot"],
			"iLink-App-ClientVersion": [ba(this.version())]
		};
	}
	async post(e, t, n, r, i) {
		let a = {
			AuthorizationType: ["ilink_bot_token"],
			"X-WECHAT-UIN": [Ca()],
			...this.commonHeaders()
		};
		i && (a.Authorization = [`Bearer ${i}`]);
		let o = await g(this.siyuan, {
			url: xa(t, n),
			method: "POST",
			headers: a,
			json: r
		});
		return this.parse(e, o);
	}
	parse(e, t) {
		if (t.status < 200 || t.status >= 300) throw Error(`${e} failed: HTTP ${t.status} ${t.body.slice(0, 200)}`);
		try {
			return ya(t.body);
		} catch {
			throw Error(`${e} returned invalid JSON: ${t.body.slice(0, 200)}`);
		}
	}
}, Ta = 32;
function Z(e) {
	return e.message_id?.trim() || e.item_list?.map((e) => e.msg_id?.trim()).find(Boolean) || void 0;
}
function Ea(e) {
	return e.item_list?.find((e) => e.ref_msg);
}
function Da(e) {
	let t = Ea(e)?.ref_msg;
	return t?.svr_id?.trim() || t?.message_item?.msg_id?.trim() || void 0;
}
function Oa(e, t) {
	switch (e.type) {
		case Y.TEXT: return e.text_item?.text ?? "";
		case Y.VOICE: return [t.voice, e.voice_item?.text].filter(Boolean).join(" ");
		case Y.IMAGE: return t.image;
		case Y.FILE: return [t.file, e.file_item?.file_name].filter(Boolean).join(" ");
		case Y.VIDEO: return t.video;
		default: return "";
	}
}
function ka(e, t) {
	return (e.item_list ?? []).map((e) => Oa(e, t).trim()).filter(Boolean).join(" ");
}
function Aa(e, t, n) {
	if (e.type === Y.TEXT) return { inline: T(e.text_item?.text ?? "") };
	if (n) switch (e.type) {
		case Y.IMAGE: return { inline: C(n, t.image) };
		case Y.VOICE: return { inline: `${w(t.voice, n)} ${y(e.voice_item?.text ?? "")}` };
		case Y.FILE: return { inline: `${y(t.file)} ${w(e.file_item?.file_name?.trim() || n.replace(/^.*\//, ""), n)}` };
		case Y.VIDEO: return { block: E(n) };
	}
	return { inline: y(Oa(e, t)) };
}
function ja(e, t) {
	let n = Ea(e)?.ref_msg;
	return [n?.title?.trim(), n?.message_item ? Oa(n.message_item, t).trim() : ""].filter(Boolean).join(" | ");
}
function Ma(e) {
	let t = e.replace(/\s+/g, " ").trim();
	return t.length > Ta ? `${t.slice(0, Ta)}...` : t;
}
function Na(e, t) {
	let { assets: n, labels: r, reference: i, referenceText: a } = t, o = [], s = (e.item_list ?? []).map((e, t) => Aa(e, r, n?.[t])).filter((e) => "block" in e || x(e.inline));
	if (Ea(e)) {
		let t = ja(e, r);
		o.push(S([i ? Ve(i, Ma(t) || Ma(a ?? "") || r.quote) : y(t || r.quote)]));
	}
	return o.push(...s.map((e) => "block" in e ? e.block : x(e.inline))), b(o.length > 0 ? o : [y(r.unavailable)], {
		"custom-author-id": e.from_user_id,
		"custom-msg-id": Z(e)
	});
}
//#endregion
//#region src/weixin/inbox.ts
var Pa = "custom-msg-id", Fa = 1024, Ia = /(?:^|\s)assets\/\S*?\d{14}-[0-9a-z]{7}\S*/g;
function La(e) {
	return e instanceof Error ? e.message : String(e);
}
function Ra(e) {
	return e.replace(Ia, " ").replace(/\s+/g, " ").trim();
}
var za = class {
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
		if (t.message_type !== pa.USER) return;
		let n = { ...this.config().inbox };
		n.enabled && n.doc && this.writer.enqueue(async () => {
			try {
				await this.write(e, n, t);
			} catch (e) {
				this.siyuan.logger.warn(`[weixin] [inbox] write the message ${Z(t)} to ${n.doc} failed:`, La(e));
			}
		});
	}
	async write(e, t, n) {
		let r = t.doc;
		await this.writer.prepare(r);
		let i = Z(n);
		if (i && await this.writer.findMessage(r, Pa, i)) {
			this.siyuan.logger.debug(`[weixin] [inbox] the message ${i} is already in ${r}, skip it`);
			return;
		}
		let a = this.labels(), o = Da(n), s = o ? await this.writer.findMessage(r, Pa, o) : void 0, c = {
			reference: s,
			referenceText: s ? this.texts.get(s) ?? Ra(await this.writer.blockText(s)) : void 0,
			labels: a
		}, { block: l } = await this.writer.appendToTemp(r, Na(n, c));
		i && this.writer.remember(r, Pa, i, l), this.texts.set(l, ka(n, a)), this.texts.size > Fa && this.texts.delete(this.texts.keys().next().value), t.reply && this.reply(e, n, l), t.downloadAssets && await this.saveMedia(n, l, c), await this.writer.moveToDate(r, l, Xt(n.create_time_ms));
	}
	async saveMedia(e, t, n) {
		let r = await this.media.save(e, t);
		if (r.length !== 0) try {
			await this.writer.updateBlock(t, Na(e, {
				...n,
				assets: r
			}));
		} catch (n) {
			this.siyuan.logger.warn(`[weixin] [inbox] put the media of the message ${Z(e)} into the block ${t} failed:`, La(n));
		}
	}
	async reply(e, t, n) {
		let r = t.from_user_id;
		if (r) try {
			let i = await this.api.sendText(e, r, `siyuan://blocks/${n}`, t.context_token);
			i ? this.siyuan.logger.debug(`[weixin] [inbox] replied to the message ${Z(t)} with the block ${n}, reply ${i}`) : this.siyuan.logger.warn(`[weixin] [inbox] the reply to the message ${Z(t)} returned no message ID, it may not be delivered`);
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] [inbox] reply to the message ${Z(t)} with the block ${n} failed:`, La(e));
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
}, Ba = /* @__PURE__ */ new Set([
	"need_verifycode",
	"scaned",
	"verifying",
	"wait"
]), Va = /^\d{1,16}$/;
function Ha(e) {
	return new Promise((t) => setTimeout(t, e));
}
function Ua(e) {
	return e instanceof Error ? e.message : String(e);
}
function Wa(e) {
	return e?.startsWith("https://") ? e : aa;
}
var Ga = class {
	siyuan;
	api;
	onConfirmed;
	session = 0;
	state = { status: "idle" };
	qrcode = "";
	codes = 0;
	baseUrl = aa;
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
				error: Ua(t)
			}), this.current();
		}
		return e === this.session && this.poll(e), this.current();
	}
	verify(e) {
		if (this.state.status !== "need_verifycode") throw Error(`the login is not waiting for a verify code, its status is ${this.state.status}`);
		let t = typeof e == "string" ? e.trim() : "";
		if (!Va.test(t)) throw Error("the verify code must be digits");
		return this.verifyCode = t, this.state = {
			...this.state,
			status: "verifying"
		}, this.current();
	}
	cancel() {
		return Ba.has(this.state.status) && this.finish({ status: "cancelled" }), this.current();
	}
	finish(e) {
		this.session++, this.qrcode = "", this.verifyCode = void 0, this.state = e;
	}
	async refresh(e) {
		if (this.codes >= 3) return !1;
		let t = await this.api.getQRCode();
		if (e !== this.session) return !0;
		let n = X(t);
		if (n !== 0 || !t.qrcode || !t.qrcode_img_content) throw Error(`get_bot_qrcode returned no QR code: ${n} ${t.errmsg ?? ""}`);
		return this.codes++, this.qrcode = t.qrcode, this.baseUrl = aa, this.verifyCode = void 0, this.state = {
			status: "wait",
			url: t.qrcode_img_content
		}, !0;
	}
	async poll(e) {
		let t = Date.now() + ca;
		for (; e === this.session;) {
			if (Date.now() >= t) {
				this.siyuan.logger.info("[weixin] [login] timed out waiting for the QR code to be scanned"), this.finish({ status: "expired" });
				return;
			}
			if (this.state.status === "need_verifycode") {
				await Ha(la);
				continue;
			}
			let n = this.verifyCode, r;
			try {
				r = await this.api.getQRCodeStatus(this.baseUrl, this.qrcode, n);
			} catch (e) {
				this.siyuan.logger.debug("[weixin] [login] query the QR code status failed, retry:", Ua(e)), r = { status: "wait" };
			}
			if (e !== this.session) return;
			try {
				if (await this.handle(e, r, n)) return;
			} catch (t) {
				e === this.session && (this.siyuan.logger.warn("[weixin] [login] login failed:", Ua(t)), this.finish({
					status: "failed",
					error: Ua(t)
				}));
				return;
			}
			await Ha(la);
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
			default: return this.siyuan.logger.debug(`[weixin] [login] unknown QR code status ${String(t.status)}, code ${X(t)}`), !1;
		}
	}
	async confirm(e, t) {
		if (!t.bot_token || !t.ilink_bot_id) throw Error("the login is confirmed without bot_token or ilink_bot_id");
		let n = await this.onConfirmed({
			botId: t.ilink_bot_id,
			token: t.bot_token,
			baseUrl: Wa(t.baseurl),
			userId: t.ilink_user_id ?? ""
		});
		this.siyuan.logger.info(`[weixin] [login] confirmed, bot ${n.botId}, user ${n.userId}`), e === this.session && this.finish({
			status: "confirmed",
			account: n
		});
	}
}, Ka = {
	[Y.IMAGE]: "image",
	[Y.VOICE]: "voice",
	[Y.FILE]: "file",
	[Y.VIDEO]: "video"
}, qa = {
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
}, Ja = {
	image: ".jpg",
	voice: ".silk",
	video: ".mp4"
}, Ya = /^[0-9a-f]{32}$/i;
function Xa(e) {
	return e instanceof Error ? e.message : String(e);
}
function Za(e) {
	return Buffer.from(e).toString("hex");
}
function Qa(e, t) {
	if (e) {
		if (!Ya.test(e)) throw Error("aeskey is not a 32-character hex string");
		return new Uint8Array(Buffer.from(e, "hex"));
	}
	if (!t) return;
	let n = Buffer.from(t, "base64");
	if (n.length === 16) return new Uint8Array(n);
	let r = n.toString("utf8");
	if (Ya.test(r)) return new Uint8Array(Buffer.from(r, "hex"));
	throw Error(`aes_key decodes to ${n.length} bytes, neither a 16-byte key nor a 32-character hex string`);
}
function $a(e) {
	switch (e.type) {
		case Y.IMAGE: {
			let t = e.image_item;
			return t?.media ? {
				kind: "image",
				media: t.media,
				key: Qa(t.aeskey, t.media.aes_key),
				name: "image",
				size: t.hd_size || t.mid_size
			} : void 0;
		}
		case Y.VOICE: {
			let t = e.voice_item?.media;
			return t?.aes_key ? {
				kind: "voice",
				media: t,
				key: Qa(void 0, t.aes_key),
				name: "voice"
			} : void 0;
		}
		case Y.FILE: {
			let t = e.file_item;
			return t?.media?.aes_key ? {
				kind: "file",
				media: t.media,
				key: Qa(void 0, t.media.aes_key),
				name: t.file_name?.trim() || "file",
				size: Number(t.len) || void 0,
				md5: t.md5
			} : void 0;
		}
		case Y.VIDEO: {
			let t = e.video_item;
			return t?.media?.aes_key ? {
				kind: "video",
				media: t.media,
				key: Qa(void 0, t.media.aes_key),
				name: "video",
				size: t.video_size,
				md5: t.video_md5
			} : void 0;
		}
		default: return;
	}
}
function eo(e) {
	return e.full_url?.startsWith("https://") ? e.full_url : e.encrypt_query_param ? `${oa}/download?encrypted_query_param=${encodeURIComponent(e.encrypt_query_param)}` : void 0;
}
function to(e, t) {
	let n = new Uint8Array(t, 0, Math.min(t.byteLength, 16));
	return qa[e].find(([, e, t]) => t.split("").every((t, r) => n[e + r] === t.charCodeAt(0)))?.[0] ?? Ja[e];
}
var no = class {
	siyuan;
	support;
	constructor(e) {
		this.siyuan = e;
	}
	async save(e, t) {
		let n = e.item_list ?? [];
		if (!n.some((e) => Ka[e.type ?? 0])) return [];
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
			this.siyuan.logger.info("[weixin] [media] siyuan.crypto of this version of SiYuan does not support AES-ECB, keep the media of messages as placeholders:", Xa(e));
			return;
		}
	}
	async saveItem(e, t, n, r) {
		let i = Ka[n.type ?? 0];
		if (!i) return;
		let a = `the ${i} of the message ${Z(t)}`;
		try {
			let t = $a(n), i = t && eo(t.media);
			if (!t || !i) return;
			if (t.size && t.size > 104857600) {
				this.siyuan.logger.warn(`[weixin] [media] ${a} has ${t.size} bytes, more than ${fa}, keep it as a placeholder`);
				return;
			}
			let o = await se(this.siyuan, {
				url: i,
				method: "GET"
			});
			if (o.status < 200 || o.status >= 300) throw Error(`the CDN responded ${o.status}`);
			if (o.body.byteLength > 104857600) throw Error(`downloaded ${o.body.byteLength} bytes, more than ${fa}`);
			let s = t.key ? await this.decrypt(e, t.key, o.body) : o.body;
			await this.verify(e, s, t.md5, a);
			let c = t.kind === "file" ? t.name : `${t.name}${to(t.kind, s)}`, l = await an(this.siyuan, c, s, r);
			return this.siyuan.logger.debug(`[weixin] [media] saved ${a} (${s.byteLength} bytes) as ${l}`), l;
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] [media] save ${a} failed, keep it as a placeholder:`, Xa(e));
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
			i = Za(await e.digest("MD5", t));
		} catch (e) {
			this.siyuan.logger.debug(`[weixin] [media] skip checking the MD5 of ${r}:`, Xa(e));
			return;
		}
		i !== n.trim().toLowerCase() && this.siyuan.logger.warn(`[weixin] [media] the MD5 of ${r} is ${i}, but the message says ${n}`);
	}
};
//#endregion
//#region src/weixin/poller.ts
function ro(e) {
	return new Promise((t) => setTimeout(t, e));
}
function Q(e) {
	return e instanceof Error ? e.message : String(e);
}
function io(e, t) {
	return e.botId === t.botId && e.token === t.token && e.baseUrl === t.baseUrl && e.userId === t.userId;
}
var ao = class {
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
		if (this.account && io(this.account, e)) return;
		this.stop();
		let t = ++this.generation;
		this.account = e, this.run(t, e);
	}
	async stop() {
		let e = this.account;
		e && (this.generation++, this.account = void 0, this.siyuan.logger.info(`[weixin] stop receiving the messages of bot ${e.botId}`), await this.notify(e, "stop"));
	}
	async removeCursor(e) {
		let t = ur(e);
		try {
			await this.siyuan.storage.remove(t);
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] remove ${t} failed:`, Q(e));
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
				r = await this.backoff(r, `getupdates failed: ${Q(t)}`);
				continue;
			}
			if (e !== this.generation) return;
			let a = X(i);
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
				this.siyuan.logger.warn(`[weixin] handle the message ${e.message_id} failed:`, Q(t));
			}
		}
	}
	async backoff(e, t) {
		let n = e + 1;
		return n >= 3 ? (this.siyuan.logger.warn(`[weixin] ${t}, ${n} consecutive failures, retry in ${da} ms`), await ro(da), 0) : (this.siyuan.logger.warn(`[weixin] ${t}, retry in ${ua} ms`), await ro(ua), n);
	}
	async notify(e, t) {
		try {
			let n = await this.api.notify(e, t), r = X(n);
			r !== 0 && this.siyuan.logger.warn(`[weixin] notify${t} failed: ${r} ${n.errmsg ?? ""}`);
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] notify${t} failed:`, Q(e));
		}
	}
	async loadCursor(e) {
		try {
			let t = await (await this.siyuan.storage.get(ur(e.botId))).json();
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
		}, r = ur(e.botId);
		try {
			await this.siyuan.storage.put(r, JSON.stringify(n));
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] save ${r} failed:`, Q(e));
		}
	}
}, oo = 1e3, so = 5e3;
function $(e) {
	return e instanceof Error ? e.message : String(e);
}
function co(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function lo(e) {
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
function uo(e) {
	return JSON.stringify(e, (e, t) => {
		if (!t || typeof t != "object" || Array.isArray(t)) return t;
		let n = {};
		for (let e of Object.keys(t).sort()) n[e] = t[e];
		return n;
	});
}
function fo(e, t) {
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
	feishuApi;
	feishuGateway;
	feishuMembers;
	feishuMedia;
	feishuInbox;
	feishuCommands;
	feishuNotices;
	config = te();
	weixinAccount;
	weixinRunning;
	weixinWatching;
	weixinExpired;
	weixinReloadTimer;
	device = "";
	deviceName = "";
	running;
	telegramRunning;
	feishuRunning;
	panelsSynced;
	reloadTimer;
	constructor() {
		this.writer = new Qt(this.siyuan, () => this.config.qq.inbox.downloadAssets), this.openapi = new Qn(this.siyuan), this.qq = new vr(this.siyuan, this.openapi, this.onQQDispatch.bind(this)), this.inbox = new Sr(this.siyuan, this.openapi, this.writer, () => this.config.qq), this.commands = new ar(this.siyuan, this.openapi, () => this.config.qq), this.panels = new jr(this.siyuan, this.openapi), this.notices = new Tr(this.siyuan, this.openapi), this.users = new Kr(this.siyuan, () => this.config.qq), this.weixinApi = new wa(this.siyuan), this.weixinLogin = new Ga(this.siyuan, this.weixinApi, this.onWeixinLogin.bind(this)), this.weixinPoller = new ao(this.siyuan, this.weixinApi, this.onWeixinMessage.bind(this), this.onWeixinExpired.bind(this)), this.weixinMedia = new no(this.siyuan), this.weixinInbox = new za(this.siyuan, this.weixinApi, this.writer, this.weixinMedia, () => this.config.weixin), this.telegramApi = new oi(this.siyuan), this.telegramPoller = new ia(this.siyuan, this.telegramApi, this.onTelegramUpdate.bind(this), this.onTelegramReady.bind(this)), this.telegramMedia = new Zi(this.siyuan, this.telegramApi), this.telegramInbox = new qi(this.siyuan, this.telegramApi, this.writer, this.telegramMedia, () => this.config.telegram), this.telegramCommands = new Ui(this.siyuan, this.telegramApi), this.telegramNotices = new ea(this.siyuan, this.telegramApi), this.feishuApi = new Ee(this.siyuan), this.feishuGateway = new Vt(this.siyuan, this.feishuApi, this.onFeishuEvent.bind(this)), this.feishuMembers = new fn(this.siyuan, this.feishuApi), this.feishuMedia = new un(this.siyuan, this.feishuApi), this.feishuInbox = new nn(this.siyuan, this.feishuApi, this.writer, this.feishuMedia, this.feishuMembers, () => this.config.feishu), this.feishuCommands = new St(this.siyuan, this.feishuApi), this.feishuNotices = new hn(this.siyuan, this.feishuApi), this.siyuan.event.handler = this.onEvent.bind(this), this.siyuan.plugin.lifecycle.onload = this.onload.bind(this), this.siyuan.plugin.lifecycle.onrunning = this.onrunning.bind(this), this.siyuan.plugin.lifecycle.onunload = this.onunload.bind(this);
	}
	async onload() {
		await this.loadConfig();
		let e = await this.loadDevice();
		this.device = e.id, this.deviceName = e.name, await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config, then connect or disconnect the QQ and Feishu bots and start or stop receiving WeChat and Telegram messages as the new config says."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.CALL_QQ_API, this.rpcCallQQApi.bind(this), "Call a QQ bot OpenAPI endpoint as the configured bot. Params: url (a path starting with /), method (GET, POST, PUT, PATCH or DELETE), body (optional, sent as JSON). Returns the response { status, headers, body }. A successful GET /v2/groups/{group_openid}/info also records the group name in qq/<AppID>/chats.json."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.GET_USERS, this.rpcGetUsers.bind(this), "Get the known groups and C2C users of the configured bot from qq/<AppID>/chats.json, including the changes not written yet. Returns { groups, users }, keyed by group_openid and user_openid."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.QQ_GET_STATE, this.rpcQQGetState.bind(this), "Get the connection state of the QQ bot on this device. Returns { status, since?, username?, error?, retryAt?, device? }."), await this.loadWeixinAccount(), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT, this.rpcWeixinGetAccount.bind(this), "Get the WeChat bot login without its token, or null when not logged in. Returns { botId, userId, device, deviceName, loginTime, expiredAt?, running }."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START, this.rpcWeixinLoginStart.bind(this), "Start a WeChat QR code login and cancel the current one. Returns the login state { status, url?, wrongCode?, error?, account? }, where url is the link to show as a QR code."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE, this.rpcWeixinLoginState.bind(this), "Get the state of the WeChat QR code login."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY, this.rpcWeixinLoginVerify.bind(this), "Submit the digits shown on the phone when the WeChat login status is need_verifycode. Params: code. Returns the login state."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL, this.rpcWeixinLoginCancel.bind(this), "Cancel the WeChat QR code login. Returns the login state."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.WEIXIN_LOGOUT, this.rpcWeixinLogout.bind(this), "Log out of WeChat: stop receiving messages, remove the login (auth.json) and the cursor of the bot, and clear weixin.botId of the config."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.TELEGRAM_GET_STATE, this.rpcTelegramGetState.bind(this), "Get the connection state of the Telegram bot on this device. Returns { status, since?, username?, error?, retryAt?, device? }."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.FEISHU_GET_STATE, this.rpcFeishuGetState.bind(this), "Get the connection state of the Feishu bot on this device. Returns { status, since?, username?, error?, retryAt?, device? }."), await this.siyuan.storage.watcher.add(".");
	}
	async onrunning() {
		await this.applyConfig();
	}
	async onunload() {
		await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.UPDATE_CONFIG), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.CALL_QQ_API), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.GET_USERS), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.QQ_GET_STATE), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.WEIXIN_GET_ACCOUNT), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_START), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_STATE), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_VERIFY), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.WEIXIN_LOGIN_CANCEL), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.WEIXIN_LOGOUT), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.TELEGRAM_GET_STATE), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.FEISHU_GET_STATE), clearTimeout(this.reloadTimer), clearTimeout(this.weixinReloadTimer), this.weixinLogin.cancel(), this.feishuInbox.flush(), await Promise.all([
			fo(this.running ? this.notify("offline") : Promise.resolve(), so),
			fo(this.telegramRunning ? this.notifyTelegram("offline") : Promise.resolve(), so),
			fo(this.feishuRunning ? this.notifyFeishu("offline") : Promise.resolve(), so),
			fo(this.weixinPoller.stop(), so)
		]), this.telegramPoller.stop(), await this.feishuGateway.stop(), await this.qq.stop(), await this.users.flush(), await this.watchWeixin(""), await this.siyuan.storage.watcher.remove(".");
	}
	async applyConfig() {
		this.applyWeixin(), this.applyTelegram(), this.applyFeishu(), await this.applyQQ();
	}
	applyFeishu() {
		let { device: e, online: t } = this.config.feishu, n = t && (!e || e === this.device), r = this.feishuRunning;
		n !== r && (this.siyuan.logger.info(n ? `[feishu] run the Feishu bot on this device ${this.device}` : t ? `[feishu] the Feishu bot runs on device ${e} only, not on this device ${this.device}` : "[feishu] the Feishu bot is offline"), this.feishuRunning = n), n ? (this.feishuGateway.update(this.config.feishu), r || this.notifyFeishu("online")) : (r && this.notifyFeishu("offline"), this.feishuGateway.stop());
	}
	async notifyFeishu(e) {
		let t;
		try {
			t = Te(this.config.feishu);
		} catch {
			return;
		}
		let n = en(this.config.feishu.inbox).filter((e) => e.notify).map((e) => e.chat);
		t && n.length !== 0 && await this.feishuNotices.send(t, n, e, this.deviceName || this.device);
	}
	applyTelegram() {
		let { device: e, online: t } = this.config.telegram, n = t && (!e || e === this.device), r = this.telegramRunning;
		n !== r && (this.siyuan.logger.info(n ? `[telegram] run the Telegram bot on this device ${this.device}` : t ? `[telegram] the Telegram bot runs on device ${e} only, not on this device ${this.device}` : "[telegram] the Telegram bot is offline"), this.telegramRunning = n), n ? (this.telegramPoller.update(this.config.telegram), r || this.notifyTelegram("online")) : (r && this.notifyTelegram("offline"), this.telegramPoller.stop());
	}
	async notifyTelegram(e) {
		let t;
		try {
			t = ai(this.config.telegram);
		} catch {
			return;
		}
		let n = Ki(this.config.telegram.inbox).filter((e) => e.notify).map((e) => e.chat);
		t && n.length !== 0 && await this.telegramNotices.send(t, n, e, this.deviceName || this.device);
	}
	async applyQQ() {
		let { device: e, online: t } = this.config.qq, n = t && (!e || e === this.device), r = this.running;
		n !== r && (this.siyuan.logger.info(n ? `[qq] run the QQ bot on this device ${this.device}` : t ? `[qq] the QQ bot runs on device ${e} only, not on this device ${this.device}` : "[qq] the QQ bot is offline"), this.running = n), n ? (await this.qq.update(this.config.qq), this.syncPanels(), r || this.notify("online")) : (r && this.notify("offline"), await this.qq.stop());
	}
	syncPanels() {
		let e = B(this.config.qq);
		if (!e) return;
		let t = this.config.qq.panels, n = uo([e, t]);
		n !== this.panelsSynced && (this.panelsSynced = n, this.panels.sync(e, [t.c2c, t.group]).then((e) => {
			!e && this.panelsSynced === n && (this.panelsSynced = void 0);
		}));
	}
	async notify(e) {
		let t = B(this.config.qq), n = xr(this.config.qq.inbox).filter((e) => e.notify).map((e) => e.chat);
		t && n.length !== 0 && await this.notices.send(t, n, e, this.deviceName || this.device);
	}
	onEvent(e) {
		if (e.type !== "fs-notify") return;
		let t = String(e.detail?.path ?? "").replace(/\\/g, "/"), n = this.config.weixin.botId;
		t === p.GLOBAL_CONFIG_NAME ? (clearTimeout(this.reloadTimer), this.reloadTimer = setTimeout(async () => {
			await this.loadConfig(), await this.loadWeixinAccount(), await this.applyConfig();
		}, oo)) : n && t === lr(n) && (clearTimeout(this.weixinReloadTimer), this.weixinReloadTimer = setTimeout(async () => {
			await this.loadWeixinAccount(), this.applyWeixin();
		}, oo));
	}
	weixinExpiredAt(e) {
		return this.weixinExpired?.token === e.token ? this.weixinExpired.time : void 0;
	}
	applyWeixin() {
		let e = this.weixinAccount, t = this.config.weixin.online, n = e && this.weixinExpiredAt(e), r = t && !!e && !n && e.device === this.device;
		e && r !== this.weixinRunning && this.siyuan.logger.info(r ? `[weixin] receive the messages of bot ${e.botId} on this device ${this.device}` : n ? `[weixin] the login of bot ${e.botId} expired at ${n}, scan the QR code again` : t ? `[weixin] bot ${e.botId} receives messages on device ${e.device} only, not on this device ${this.device}` : `[weixin] bot ${e.botId} is offline`), this.weixinRunning = r, r ? this.weixinPoller.start(e) : this.weixinPoller.stop();
	}
	async loadWeixinAccount() {
		let e = this.config.weixin.botId;
		if (await this.watchWeixin(e), !e) {
			this.weixinAccount = void 0;
			return;
		}
		let t = lr(e), n;
		try {
			n = await this.siyuan.storage.get(t);
		} catch {
			this.weixinAccount = void 0;
			return;
		}
		try {
			let t = lo(await n.json());
			if (t.botId !== e) throw Error(`it is the login of bot ${t.botId}`);
			this.weixinAccount = t;
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] ${t} is invalid, treat it as logged out:`, $(e)), this.weixinAccount = void 0;
		}
	}
	async watchWeixin(e) {
		let t = e ? cr(e) : void 0;
		if (t !== this.weixinWatching) {
			if (this.weixinWatching) {
				try {
					await this.siyuan.storage.watcher.remove(this.weixinWatching);
				} catch {}
				this.weixinWatching = void 0;
			}
			if (t) try {
				await this.siyuan.storage.watcher.add(t), this.weixinWatching = t;
			} catch (e) {
				this.siyuan.logger.debug(`[weixin] watch ${t} failed:`, $(e));
			}
		}
	}
	async saveBotId(e, t) {
		if (this.config[e].botId === t) return;
		let n = p.GLOBAL_CONFIG_NAME, r;
		try {
			r = await this.siyuan.storage.get(n);
		} catch {}
		let i = { ...this.config };
		if (r) try {
			i = JSON.parse(await r.text());
		} catch (e) {
			throw Error(`${n} is not valid JSON, fix or delete it: ${$(e)}`);
		}
		if (!co(i)) throw Error(`${n} is not a JSON object, fix or delete it`);
		let a = i[e];
		i[e] = {
			...co(a) ? a : {},
			botId: t
		}, await this.siyuan.storage.put(n, JSON.stringify(i, void 0, 4)), this.config[e].botId = t, this.siyuan.logger.info(`[${e}] ${t ? `set the bot ID ${t}` : "clear the bot ID"} in ${n}`);
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
			let e = await this.siyuan.storage.get(p.GLOBAL_CONFIG_NAME);
			this.config = te(await e.json());
		} catch (e) {
			this.siyuan.logger.info(`load ${p.GLOBAL_CONFIG_NAME} failed, keep the current config:`, String(e));
		}
	}
	async rpcUpdateConfig(e) {
		let { weixin: t, telegram: n } = this.config;
		this.config = te(e), this.config.weixin.botId = t.botId, this.config.telegram.botId = n.botId, await this.applyConfig();
	}
	async rpcCallQQApi(e, t, n) {
		let r = Xn(e, t, n), i = B(this.config.qq);
		if (!i) throw Error("QQ_BOT_APPID or QQ_BOT_SECRET is not configured");
		let a = await this.openapi.request(i, r), o = r.method === "GET" ? /^\/v2\/groups\/([\w-]+)\/info$/.exec(r.url)?.[1] : void 0, s = a.body?.group_name;
		return o && a.status >= 200 && a.status < 300 && typeof s == "string" && s && this.users.recordGroupName(i.appid, o, s), a;
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
	rpcFeishuGetState() {
		let { device: e, online: t } = this.config.feishu;
		return t ? e && e !== this.device ? {
			status: "other-device",
			device: e
		} : this.feishuGateway.state : { status: "offline" };
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
		let e = this.config.weixin.botId;
		this.weixinAccount = void 0, this.weixinRunning = !1, await this.weixinPoller.stop(), e && await this.removeWeixinLogin(e), await this.saveBotId("weixin", ""), await this.watchWeixin(""), this.siyuan.logger.info(`[weixin] logged out${e ? ` of bot ${e}` : ""}`);
	}
	async onWeixinLogin(e) {
		let t = {
			...e,
			device: this.device,
			deviceName: this.deviceName,
			loginTime: (/* @__PURE__ */ new Date()).toISOString()
		}, n = this.config.weixin.botId;
		return await this.siyuan.storage.put(lr(t.botId), JSON.stringify(t, void 0, 4)), this.weixinAccount = t, n && n !== t.botId && await this.removeWeixinLogin(n), await this.saveBotId("weixin", t.botId), await this.watchWeixin(t.botId), this.applyWeixin(), this.weixinAccountState(t);
	}
	async removeWeixinLogin(e) {
		await this.siyuan.storage.remove(lr(e)), await this.weixinPoller.removeCursor(e);
	}
	onWeixinExpired(e) {
		this.weixinExpired = {
			token: e.token,
			time: (/* @__PURE__ */ new Date()).toISOString()
		}, this.applyWeixin();
	}
	onWeixinMessage(e, t) {
		this.siyuan.logger.info("[weixin] message", t), this.config.weixin.eventLog && this.writeWeixinMessageLog(e, t), this.weixinInbox.handle(e, t);
	}
	async writeWeixinMessageLog(e, t) {
		let n = Z(t);
		if (!n) {
			this.siyuan.logger.debug("[weixin] the message has no message ID, skip the message log");
			return;
		}
		let r = dr(e.botId, n);
		try {
			await this.siyuan.storage.put(r, JSON.stringify(t));
		} catch (e) {
			this.siyuan.logger.warn(`[weixin] write message log ${r} failed:`, $(e));
		}
	}
	onTelegramReady(e) {
		this.saveBotId("telegram", String(e.me.id)).catch((e) => {
			this.siyuan.logger.warn("[telegram] save the bot ID failed:", $(e));
		});
	}
	onTelegramUpdate(e, t) {
		this.siyuan.logger.info("[telegram] update", t), this.config.telegram.eventLog && this.writeTelegramUpdateLog(e, t);
		let n = t.message ?? t.channel_post;
		n && (n.migrate_to_chat_id && this.siyuan.logger.warn(`[telegram] group ${n.chat.id} was upgraded to supergroup ${n.migrate_to_chat_id}, bind the new chat ID to keep recording its messages`), this.telegramInbox.handle(e, n, t.update_id), this.telegramCommands.handle(e, n));
		let r = t.my_chat_member;
		r && this.siyuan.logger.info(`[telegram] the bot is ${r.new_chat_member.status} in ${r.chat.type} chat ${r.chat.id} (${r.chat.title ?? r.chat.username ?? ""})`);
	}
	onFeishuEvent(e, t) {
		let n = t.header?.event_type ?? t.event?.type ?? "", r = t.header?.event_id ?? t.uuid ?? "";
		switch (this.siyuan.logger.info("[feishu] event", n, t), this.config.feishu.eventLog && this.writeFeishuEventLog(e, n, r, t), n) {
			case "im.message.receive_v1": {
				let n = Xe(t.event);
				this.feishuInbox.handle(e, n, r || void 0), this.feishuCommands.handle(e, n);
				break;
			}
			case "im.chat.member.bot.added_v1":
			case "im.chat.member.bot.deleted_v1": {
				let e = t.event;
				this.siyuan.logger.info(`[feishu] the bot is ${n === "im.chat.member.bot.added_v1" ? "added to" : "removed from"} chat ${e.chat_id} (${e.name ?? ""})`);
				break;
			}
		}
	}
	async writeFeishuEventLog(e, t, n, r) {
		if (!t || !n) {
			this.siyuan.logger.debug("[feishu] the event has no type or ID, skip the event log");
			return;
		}
		let i = pr(e.options.appId, t, n);
		try {
			await this.siyuan.storage.put(i, JSON.stringify(r));
		} catch (e) {
			this.siyuan.logger.warn(`[feishu] write event log ${i} failed:`, $(e));
		}
	}
	async writeTelegramUpdateLog(e, t) {
		let n = fr(e.me.id, t.update_id);
		try {
			await this.siyuan.storage.put(n, JSON.stringify(t));
		} catch (e) {
			this.siyuan.logger.warn(`[telegram] write update log ${n} failed:`, $(e));
		}
	}
	onQQDispatch(e) {
		this.siyuan.logger.info("[qq] event", e.t, e), this.config.qq.eventLog && this.writeEventLog(e), this.inbox.handle(e), this.commands.handle(e), this.users.handle(e);
	}
	async writeEventLog(e) {
		let t = mr(this.config.qq.appid.trim(), e);
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
