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
		return t.clone !== !1 && t.isMergeableObject(e) ? g(s(e), e, t) : e;
	}
	function l(e, t, n) {
		return e.concat(t).map(function(e) {
			return c(e, n);
		});
	}
	function u(e, t) {
		if (!t.customMerge) return g;
		var n = t.customMerge(e);
		return typeof n == "function" ? n : g;
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
	function h(e, t, n) {
		var r = {};
		return n.isMergeableObject(e) && f(e).forEach(function(t) {
			r[t] = c(e[t], n);
		}), f(t).forEach(function(i) {
			m(e, i) || (r[i] = p(e, i) && n.isMergeableObject(t[i]) ? u(i, n)(e[i], t[i], n) : c(t[i], n));
		}), r;
	}
	function g(e, t, r) {
		r ||= {}, r.arrayMerge = r.arrayMerge || l, r.isMergeableObject = r.isMergeableObject || n, r.cloneUnlessOtherwiseSpecified = c;
		var i = Array.isArray(t);
		return i === Array.isArray(e) ? i ? r.arrayMerge(e, t, r) : h(e, t, r) : c(t, r);
	}
	g.all = function(e, t) {
		if (!Array.isArray(e)) throw Error("first argument should be an array");
		return e.reduce(function(e, n) {
			return g(e, n, t);
		}, {});
	}, t.exports = g;
})))(), 1);
function l(...e) {
	return c.default.all(e, { arrayMerge: (e, t, n) => t });
}
//#endregion
//#region src/configs/default.ts
var u = { qq: {
	appid: "",
	secret: "",
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
} }, d = {
	group: "",
	doc: "",
	enabled: !0,
	reply: !1,
	notify: !1
};
function f(...e) {
	let t = l(u, ...e);
	return t.qq.inbox.bindings = t.qq.inbox.bindings.map((e) => ({
		...d,
		...e
	})), t;
}
//#endregion
//#region src/constants.ts
var p = {
	GLOBAL_CONFIG_NAME: "config.json",
	USERS_FILE_NAME: "users.json",
	KERNEL_RPC_METHOD: {
		UPDATE_CONFIG: "update-config",
		CALL_QQ_API: "call-qq-api",
		GET_USERS: "get-users"
	}
}, m = "https://api.bot.qq.com/app/getAppAccessToken", h = "https://api.bot.qq.com", g = 1e4, ee = 45e3, te = 1e3, ne = 6e4, _ = /* @__PURE__ */ new Set([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
]), v = /* @__PURE__ */ function(e) {
	return e[e.DISPATCH = 0] = "DISPATCH", e[e.HEARTBEAT = 1] = "HEARTBEAT", e[e.IDENTIFY = 2] = "IDENTIFY", e[e.RESUME = 6] = "RESUME", e[e.RECONNECT = 7] = "RECONNECT", e[e.INVALID_SESSION = 9] = "INVALID_SESSION", e[e.HELLO = 10] = "HELLO", e[e.HEARTBEAT_ACK = 11] = "HEARTBEAT_ACK", e;
}({}), y = /* @__PURE__ */ function(e) {
	return e[e.NORMAL = 0] = "NORMAL", e[e.ARK = 3] = "ARK", e[e.CHAT_RECORD = 102] = "CHAT_RECORD", e[e.REFERENCE = 103] = "REFERENCE", e;
}({}), re = { OPENID: "openid" }, b = /* @__PURE__ */ new Set(["GROUP_AT_MESSAGE_CREATE", "GROUP_MESSAGE_CREATE"]), x = {
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
}, ie = /* @__PURE__ */ new Map([
	[4001, "invalid opcode"],
	[4002, "invalid payload"],
	[4010, "invalid shard"],
	[4011, "too many guilds, sharding required"],
	[4012, "invalid version"],
	[4013, "invalid intent"],
	[4014, "intent not permitted"],
	[4914, "bot is offline, only the sandbox environment is allowed"],
	[4915, "bot is banned"]
]), ae = /* @__PURE__ */ new Set([
	4006,
	4007,
	...Array.from({ length: 14 }, (e, t) => 4900 + t)
]);
//#endregion
//#region src/utils/kramdown.ts
function S(e) {
	return e.replace(/[\\`*_{}[\]()#+\-.!|~=^$<>:&"]/g, "\\$&").replace(/\r\n?|\n/g, "<br>");
}
function oe(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\r\n?|\n/g, "_esc_newline_").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}
function se(e) {
	let t = Object.entries(e).filter((e) => !!e[1]).map(([e, t]) => `${e}="${oe(t)}"`);
	return t.length > 0 ? `{: ${t.join(" ")}}` : "";
}
function ce(e, t = {}) {
	let n = e.filter(Boolean);
	return n.length === 0 ? "" : [
		"{{{row",
		n.join("\n\n"),
		"}}}",
		se(t)
	].filter(Boolean).join("\n");
}
function C(e) {
	return e.replace(/^(?:\s|<br>)+|(?:\s|<br>)+$/g, "");
}
function le(e) {
	return e.filter(Boolean).join("\n\n").split("\n").map((e) => e ? `> ${e}` : ">").join("\n");
}
function ue(e) {
	return e.replace(/[\s<>]/g, (e) => encodeURIComponent(e)).replace(/\(/g, "%28").replace(/\)/g, "%29");
}
function de(e, t = "") {
	return `![${t.replace(/[[\]\\\r\n]/g, "")}](${ue(e)})`;
}
function w(e, t) {
	return `[${S(e)}](${ue(t)})`;
}
function fe(e) {
	return `<audio controls="controls" src="${e.replace(/"/g, "%22")}"></audio>`;
}
function pe(e) {
	return `<video controls="controls" src="${e.replace(/"/g, "%22")}"></video>`;
}
function me(e) {
	return `<kbd>${e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</kbd>`;
}
function he(e, t) {
	return `((${e} "${t.replace(/"/g, "'").replace(/\s+/g, " ").trim()}"))`;
}
//#endregion
//#region src/qq/chat-record.ts
var ge = /^\[.+\]$/, _e = /^=== 消息 \d+ ===$/, ve = /^--- 第\d+条 ---$/, ye = /^\[(消息内容|发送者|消息类型|关联消息|附件\d+)\] ?(.*)$/, be = 4;
function T() {
	return {
		content: [],
		attachments: [],
		related: []
	};
}
function E(e, t) {
	for (let n = e.length - 1; n >= 0; n--) if (e[n].indent === t) return n;
	return -1;
}
function xe(e) {
	return {
		type: /(?:^| )类型:(\S+)/.exec(e)?.[1],
		filename: /(?:^| )文件名:(\S+)/.exec(e)?.[1],
		url: /(?:^| )URL:(\S+)/.exec(e)?.[1]
	};
}
function Se(e) {
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = t.findIndex((e) => e.trim() !== "");
	if (n < 0 || !ge.test(t[n].trim())) return;
	let r = [], i = [], a;
	for (let e of t.slice(n + 1)) {
		let t = e.trim();
		if (!t) continue;
		let n = e.length - e.trimStart().length;
		if (n === 0 && _e.test(t)) {
			let e = T();
			r.push(e), i = [{
				message: e,
				indent: 0
			}], a = void 0;
			continue;
		}
		if (ve.test(t)) {
			let e = E(i, n);
			if (e < 0) return;
			let t = T();
			i[e].message.related.push(t), i = [...i.slice(0, e + 1), {
				message: t,
				indent: n + be
			}], a = void 0;
			continue;
		}
		let o = ye.exec(t);
		if (o) {
			let e = E(i, n);
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
				default: t.message.attachments.push(xe(s));
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
var D = /<@all>|<@!?(\w+)>|<faceType=\d+,faceId="[^"]*",ext="([^"]*)">|(https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+)/g, O = /[.,;:!?'*]+$/, Ce = /^\[.+的聊天记录\]$/, k = 32;
function A(e, t) {
	let n = `${t}=`;
	return e.message_scene?.ext?.find((e) => e.startsWith(n))?.slice(n.length);
}
function j(e, t) {
	let n = t.mentions ?? [];
	return n.some((e) => e.scope === "all") || (t.content ?? "").includes("<@all>") ? !1 : e === "GROUP_AT_MESSAGE_CREATE" || n.some((e) => e.is_you === !0);
}
function we(e) {
	try {
		let t = JSON.parse(Buffer.from(e, "base64").toString("utf8"));
		return t.text ? `[${t.text}]` : "";
	} catch {
		return "";
	}
}
function M(e, t) {
	return e.split(t).length - 1;
}
function Te(e) {
	let t = e.replace(O, "");
	for (; t.endsWith(")") && M(t, ")") > M(t, "(");) t = t.slice(0, -1).replace(O, "");
	return t;
}
function Ee(e, t) {
	return `@${(e ? t?.find((t) => t.id === e || t.member_openid === e) : t?.find((e) => e.scope === "all"))?.username || e || "all"}`;
}
function N(e, t, n, r, i) {
	let a = "", o = 0;
	D.lastIndex = 0;
	for (let s = D.exec(e); s; s = D.exec(e)) {
		let [c, l, u, d] = s;
		if (a += n(e.slice(o, s.index)), o = s.index + c.length, d) {
			let e = Te(d);
			a += r(e) + n(d.slice(e.length));
		} else a += u === void 0 ? i(Ee(l, t)) : n(we(u));
	}
	return a + n(e.slice(o));
}
function De(e, t) {
	return N(e, t, S, (e) => w(e, e), me);
}
function Oe(e, t) {
	let n = (e) => e, r = N(e, t, n, n, n).replace(/\s+/g, " ").trim();
	return r.length > k ? `${r.slice(0, k)}...` : r;
}
function P(e) {
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
function F(e, t, n, r, i = "") {
	e.media += r.length;
	let a = [C(i + r.filter((e) => e.kind === "image").map((e) => de(e.url, e.name)).join("") + De(t, n))];
	for (let e of r) switch (e.kind) {
		case "voice":
			a.push(fe(e.url)), e.asr && a.push(C(S(e.asr)));
			break;
		case "video":
			a.push(pe(e.url));
			break;
		case "file": a.push(C(w(e.name || e.url, e.url)));
	}
	return a.filter(Boolean);
}
function ke(e, t, n) {
	let r = A(t, "ref_msg_idx"), i = t.msg_elements?.find((e) => e.msg_idx === r) ?? t.msg_elements?.[0], a = (t.attachments ?? []).map(P);
	if (n) {
		let r = Oe(i?.content ?? "", t.mentions) || e.labels.quote;
		return F(e, t.content.trim(), t.mentions, a, `${he(n, r)} `);
	}
	let o = i ? F(e, i.content ?? "", t.mentions, (i.attachments ?? []).map(P)) : [];
	return [le(o.length > 0 ? o : [S(e.labels.quote)]), ...F(e, t.content.trim(), t.mentions, a)];
}
function I(e, t) {
	let n = [...F(e, t.related.length > 0 && t.content.length === 1 && Ce.test(t.content[0]) ? "" : t.content.join("\n"), void 0, t.attachments.filter((e) => e.url).map((e) => ({
		kind: e.type === "图片" ? "image" : e.type === "视频" ? "video" : "file",
		url: e.url,
		name: e.filename
	}))), ...t.related.map((t) => I(e, t))].filter(Boolean);
	return ce(n.length > 0 ? n : [S(e.labels.unavailable)], { "custom-author-username": t.sender });
}
function Ae(e, t) {
	let n = {
		labels: t.labels,
		media: 0
	}, r;
	switch (e.message_type) {
		case y.CHAT_RECORD: {
			let t = Se(e.content);
			r = t ? t.map((e) => I(n, e)) : F(n, e.content, e.mentions, (e.attachments ?? []).map(P));
			break;
		}
		case y.REFERENCE:
			r = ke(n, e, t.reference);
			break;
		default: r = F(n, e.content, e.mentions, (e.attachments ?? []).map(P));
	}
	return {
		kramdown: ce(r.length > 0 ? r : [S(t.labels.unavailable)], {
			"custom-event-id": t.eventId,
			"custom-author-id": e.author?.id,
			"custom-author-username": e.author?.username,
			"custom-msg-idx": A(e, "msg_idx")
		}),
		media: n.media
	};
}
//#endregion
//#region src/qq/proxy.ts
var je = "siyuan-proxy-";
function L(e) {
	try {
		return JSON.parse(e);
	} catch {
		return;
	}
}
function R(e) {
	return Buffer.from(e, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function z(e, t) {
	let n = t.headers ? `&h=${R(JSON.stringify(t.headers))}` : "", r = await e.client.fetch(`/api/network/proxy?u=${R(t.url)}&t=${g}ms${n}`, t.json === void 0 ? { method: t.method } : {
		method: t.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(t.json)
	}), i = await r.text();
	if (!r.headers["Content-Type"]?.startsWith("application/octet-stream")) {
		let e = L(i);
		throw Error(`proxy ${t.method} ${t.url} failed: ${r.status} ${e?.msg ?? i}`);
	}
	let a = {};
	for (let [e, t] of Object.entries(r.headers)) e.toLowerCase().startsWith(je) && (a[e.slice(13)] = t);
	return {
		status: r.status,
		headers: a,
		body: i
	};
}
//#endregion
//#region src/qq/openapi.ts
var B = class extends Error {};
function Me(e, t, n) {
	if (typeof e != "string" || !e.startsWith("/")) throw TypeError(`url must be a path starting with "/", got ${JSON.stringify(e)}`);
	let r = typeof t == "string" ? t.toUpperCase() : "";
	if (!_.has(r)) throw TypeError(`method must be one of ${[..._].join(", ")}, got ${JSON.stringify(t)}`);
	return {
		url: e,
		method: r,
		body: n ?? void 0
	};
}
function V(e) {
	let t = e.appid.trim(), n = e.secret.trim();
	return t && n ? {
		appid: t,
		secret: n
	} : void 0;
}
function Ne(e) {
	if (!e) return null;
	let t = L(e);
	return t === void 0 ? e : t;
}
var Pe = class {
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
		let n = await this.accessToken(e), r = await z(this.siyuan, {
			url: `${h}${t.url}`,
			method: t.method,
			headers: { Authorization: [`QQBot ${n}`] },
			json: t.body
		});
		return r.status === 401 && this.token?.value === n && (this.token = void 0), {
			status: r.status,
			headers: r.headers,
			body: Ne(r.body)
		};
	}
	async fetchAccessToken(e, t) {
		let n = await z(this.siyuan, {
			url: m,
			method: "POST",
			json: {
				appId: e,
				clientSecret: t
			}
		}), r = L(n.body);
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
		throw n.status === 429 || n.status >= 500 || r?.code === 100001 ? Error(i) : new B(`${i}, check QQ_BOT_APPID and QQ_BOT_SECRET`);
	}
}, Fe = /^\/(\S+)/, Ie = "owner", Le = /<@!?(\w+)>/g, Re = 1024;
function ze(e) {
	return e instanceof Error ? e.message : String(e);
}
function Be(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.mentions ?? []) if (n.is_you) for (let e of [n.id, n.member_openid]) e && t.add(e);
	return (e.content ?? "").replace(Le, (e, n) => t.has(n) ? "" : e);
}
var Ve = class {
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
		} else if (e.t && b.has(e.t)) {
			let i = e.d, a = i.author?.member_openid || i.author?.id;
			if (!a || !i.group_openid || !j(e.t, i)) return;
			t = i, n = Be(i), r = {
				path: `/v2/groups/${encodeURIComponent(i.group_openid)}/messages`,
				user: a,
				group: i.group_openid
			};
		} else return;
		let i = Fe.exec(n.trim())?.[1];
		if (i !== re.OPENID || this.isAnswered(t)) return;
		let a = t.author?.member_role;
		if (r.group && a !== Ie) {
			this.siyuan.logger.info(`[qq] [commands] ignore /${i} from ${r.user} in group ${r.group}: only the group owner can send commands, and the member_role is ${a || "empty"}`);
			return;
		}
		this.remember(t), this.siyuan.logger.info(`[qq] [commands] /${i} from ${r.user}${r.group ? ` in group ${r.group}` : ""}`), this.reply(t, r, this.openIdText(r));
	}
	keys(e) {
		let t = A(e, "msg_idx");
		return [`id:${e.id}`, ...t ? [`idx:${t}`] : []];
	}
	isAnswered(e) {
		return this.keys(e).some((e) => this.answered.has(e)) ? (this.siyuan.logger.debug(`[qq] [commands] the message ${e.id} is already answered, skip it`), !0) : !1;
	}
	remember(e) {
		for (let t of this.keys(e)) this.answered.add(t);
		for (; this.answered.size > Re * 2;) this.answered.delete(this.answered.values().next().value);
	}
	openIdText(e) {
		let t = this.openIdLabels(), n = [t.user.replaceAll("{{1}}", e.user)];
		return e.group && n.push(t.group.replaceAll("{{1}}", e.group)), n.join("\n");
	}
	async reply(e, t, n) {
		let r = V(this.config());
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
			this.siyuan.logger.warn(`[qq] [commands] reply to the message ${e.id} failed:`, ze(t));
		}
	}
	openIdLabels() {
		let e = this.siyuan.plugin.i18n?.commands?.openid;
		return {
			user: e?.user || "User OpenID: {{1}}",
			group: e?.group || "Group OpenID: {{1}}"
		};
	}
}, He = "logs/events";
function H(e) {
	return e.replace(/[^\w-]/g, "_");
}
function Ue(e) {
	let t = e.t, n = `${t}:`, r = e.id?.startsWith(n) ? e.id.slice(n.length) : e.id;
	if (t && r) return `${He}/${H(t)}/${H(r)}.json`;
}
//#endregion
//#region src/qq/intents.ts
function We(e) {
	let t = 0;
	for (let [n, r] of Object.entries(x)) e[n] === !0 && (t |= r);
	return t;
}
function Ge(e) {
	return `${Object.entries(x).filter(([, t]) => e & t).map(([e]) => e).join("|")} (${e})`;
}
//#endregion
//#region src/qq/gateway.ts
function U(e) {
	return e instanceof Error ? e.message : String(e);
}
var Ke = class {
	siyuan;
	openapi;
	onDispatch;
	options;
	socket;
	connection = 0;
	token = "";
	sessionId = "";
	seq = 0;
	heartbeatInterval = ee;
	heartbeatTimer;
	heartbeatAcked = !0;
	reconnectTimer;
	reconnectAttempts = 0;
	constructor(e, t, n) {
		this.siyuan = e, this.openapi = t, this.onDispatch = n;
	}
	async update(e) {
		let t = this.resolveOptions(e);
		t && this.options && t.appid === this.options.appid && t.secret === this.options.secret && t.intents === this.options.intents || (await this.stop(), t && (this.options = t, this.siyuan.logger.info(`[qq] connecting, intents: ${Ge(t.intents)}`), this.connect()));
	}
	async stop() {
		this.options = void 0, this.clearReconnect(), this.resetSession(), await this.detach(1e3, "stop");
	}
	resolveOptions(e) {
		let t = e.appid.trim(), n = e.secret.trim();
		if (!t || !n) {
			this.siyuan.logger.info("[qq] QQ_BOT_APPID or QQ_BOT_SECRET is not configured, skip connecting");
			return;
		}
		let r = We(e.intents);
		if (r === 0) {
			this.siyuan.logger.warn("[qq] no event is subscribed in QQ_BOT_INTENTS, skip connecting");
			return;
		}
		return {
			appid: t,
			secret: n,
			intents: r
		};
	}
	async connect() {
		let e = this.options;
		if (!e) return;
		let t = ++this.connection;
		try {
			let n = await this.openapi.accessToken(e), r = await this.fetchGateway(e);
			if (t !== this.connection) return;
			this.token = n;
			let i = r.session_start_limit;
			if (this.siyuan.logger.debug(`[qq] gateway: ${r.url}, session start limit: ${JSON.stringify(i)}`), !this.sessionId && i && i.remaining <= 0) {
				this.siyuan.logger.warn(`[qq] no session starts remaining, retry in ${i.reset_after} ms`), this.scheduleReconnect(i.reset_after);
				return;
			}
			let a = await this.siyuan.client.socket(`/ws/network/proxy?u=${R(r.url)}`);
			if (t !== this.connection) {
				a.close().catch(() => {});
				return;
			}
			this.socket = a, a.onmessage = (e) => this.onMessage(t, e), a.onclose = (e) => this.onDisconnect(t, `closed ${e.code} ${e.reason}`, e.code), a.onerror = (e) => {
				setTimeout(() => this.onDisconnect(t, `error ${U(e.error)}`), 0);
			}, await a.open();
		} catch (e) {
			if (t !== this.connection) return;
			if (e instanceof B) {
				this.siyuan.logger.error(`[qq] ${e.message}, stop connecting`), this.options = void 0;
				return;
			}
			this.onDisconnect(t, `connect failed: ${U(e)}`);
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
			case v.HELLO:
				this.heartbeatInterval = n.d?.heartbeat_interval || 45e3, this.siyuan.logger.debug(`[qq] hello, heartbeat interval: ${this.heartbeatInterval} ms`), this.sessionId ? this.resume(e) : this.identify(e);
				break;
			case v.DISPATCH:
				typeof n.s == "number" && (this.seq = n.s), n.t === "READY" ? (this.sessionId = n.d.session_id, this.onSessionReady(e)) : n.t === "RESUMED" && this.onSessionReady(e), this.onDispatch(n);
				break;
			case v.HEARTBEAT:
				this.sendHeartbeat(e);
				break;
			case v.HEARTBEAT_ACK:
				this.heartbeatAcked = !0, this.siyuan.logger.trace("[qq] heartbeat ACK");
				break;
			case v.RECONNECT:
				this.onDisconnect(e, "the gateway requests a reconnect");
				break;
			case v.INVALID_SESSION:
				this.resetSession(), this.onDisconnect(e, "invalid session");
				break;
			default: this.siyuan.logger.debug(`[qq] unhandled payload: ${t.data}`);
		}
	}
	onSessionReady(e) {
		this.reconnectAttempts = 0, this.stopHeartbeat(), this.sendHeartbeat(e), this.heartbeatTimer = setInterval(() => {
			if (!this.heartbeatAcked) {
				this.onDisconnect(e, "no heartbeat ACK within the heartbeat interval");
				return;
			}
			this.sendHeartbeat(e);
		}, this.heartbeatInterval);
	}
	onDisconnect(e, t, n) {
		if (e === this.connection) {
			if (this.detach(4e3, "reconnect"), n !== void 0 && ie.has(n)) {
				this.siyuan.logger.error(`[qq] disconnected (${t}): ${ie.get(n)}, stop reconnecting`), this.options = void 0, this.resetSession();
				return;
			}
			n !== void 0 && ae.has(n) && this.resetSession(), this.siyuan.logger.warn(`[qq] disconnected (${t}), will ${this.sessionId ? "resume" : "identify"}`), this.scheduleReconnect();
		}
	}
	async detach(e, t) {
		this.connection++, this.stopHeartbeat();
		let n = this.socket;
		this.socket = void 0, await n?.close(e, t).catch(() => {});
	}
	scheduleReconnect(e = this.nextReconnectDelay()) {
		this.options && (this.clearReconnect(), this.siyuan.logger.info(`[qq] reconnect in ${e} ms`), this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = void 0, this.connect();
		}, e));
	}
	nextReconnectDelay() {
		let e = Math.min(te * 2 ** this.reconnectAttempts, ne);
		return this.reconnectAttempts++, e;
	}
	clearReconnect() {
		this.reconnectTimer !== void 0 && (clearTimeout(this.reconnectTimer), this.reconnectTimer = void 0);
	}
	resetSession() {
		this.sessionId = "", this.seq = 0;
	}
	identify(e) {
		this.send(e, {
			op: v.IDENTIFY,
			d: {
				token: `QQBot ${this.token}`,
				intents: this.options?.intents,
				shard: [0, 1]
			}
		});
	}
	resume(e) {
		this.send(e, {
			op: v.RESUME,
			d: {
				token: `QQBot ${this.token}`,
				session_id: this.sessionId,
				seq: this.seq
			}
		});
	}
	sendHeartbeat(e) {
		this.heartbeatAcked = !1, this.siyuan.logger.trace(`[qq] heartbeat, seq: ${this.seq}`), this.send(e, {
			op: v.HEARTBEAT,
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
			this.siyuan.logger.warn(`[qq] send op ${t.op} failed: ${U(e)}`);
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
}, W = ".temp", qe = /^\d{14}-[0-9a-z]{7}$/, Je = 1024, Ye = 2e3, Xe = 18e5;
function Ze(e) {
	return new Promise((t) => setTimeout(t, e));
}
function G(e) {
	return e instanceof Error ? e.message : String(e);
}
function Qe(e) {
	let t = String(e.getMonth() + 1).padStart(2, "0"), n = String(e.getDate()).padStart(2, "0");
	return `${e.getFullYear()}-${t}-${n}`;
}
function $e(e) {
	let t = new Date(e);
	return Qe(Number.isNaN(t.getTime()) ? /* @__PURE__ */ new Date() : t);
}
function et(e) {
	return `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}`;
}
function tt(e) {
	return e.bindings.filter((e) => e.enabled && e.group && e.doc);
}
var nt = class {
	siyuan;
	openapi;
	config;
	queue = Promise.resolve();
	messages = /* @__PURE__ */ new Map();
	children = /* @__PURE__ */ new Map();
	recovered = /* @__PURE__ */ new Set();
	constructor(e, t, n) {
		this.siyuan = e, this.openapi = t, this.config = n;
	}
	handle(e) {
		if (!e.t || !b.has(e.t)) return;
		let t = e.d;
		if (j(e.t, t)) return;
		let n = tt(this.config().inbox).filter((e) => e.group === t.group_openid);
		n.length !== 0 && (this.queue = this.queue.then(async () => {
			for (let [r, i] of n.entries()) try {
				await this.write(i, e.id ?? "", t, r + 1);
			} catch (e) {
				this.siyuan.logger.warn(`[qq] [inbox] write the message ${t.id} of group ${i.group} to ${i.doc} failed:`, G(e));
			}
		}));
	}
	async write(e, t, n, r) {
		let i = e.doc;
		if (!qe.test(i)) throw Error(`invalid document ID ${i}`);
		await this.waitForSync(await this.childDoc(i, W)), await this.recover(i);
		let a = A(n, "msg_idx");
		if (a && await this.findMessage(i, a)) {
			this.siyuan.logger.debug(`[qq] [inbox] the message ${a} is already in ${i}, skip it`);
			return;
		}
		let o = n.message_type === y.REFERENCE ? A(n, "ref_msg_idx") : void 0, s = Ae(n, {
			eventId: t,
			reference: o ? await this.findMessage(i, o) : void 0,
			labels: this.labels()
		}), { block: c, temp: l } = await this.appendToTemp(i, s.kramdown);
		a && this.remember(i, a, c), e.reply && this.reply(n, c, r), s.media > 0 && this.config().inbox.downloadAssets && await this.downloadAssets(l), await this.moveToDate(i, c, $e(n.timestamp));
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
	async appendToTemp(e, t) {
		let n = await this.childDoc(e, W);
		try {
			return {
				block: await this.append(n, t),
				temp: n
			};
		} catch (r) {
			this.siyuan.logger.debug(`[qq] [inbox] append to ${n} failed, retry after refreshing the documents:`, G(r)), this.children.clear();
			let i = await this.childDoc(e, W);
			return {
				block: await this.append(i, t),
				temp: i
			};
		}
	}
	async moveToDate(e, t, n) {
		try {
			await this.moveToEnd(t, await this.dateDoc(e, n));
		} catch (r) {
			this.siyuan.logger.debug(`[qq] [inbox] move ${t} failed, retry after refreshing the documents:`, G(r)), this.children.clear(), await this.moveToEnd(t, await this.dateDoc(e, n));
		}
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
	async downloadAssets(e) {
		try {
			await this.request("/api/format/netAssets2LocalAssets", { id: e });
			return;
		} catch (t) {
			this.siyuan.logger.warn(`[qq] [inbox] download the assets of ${e} failed, wait for the kernel to finish:`, G(t));
		}
		await this.waitForSync(e);
	}
	async waitForSync(e) {
		let t = Date.now() + Xe;
		for (; await this.isSyncing(e);) {
			if (Date.now() > t) throw Error(`${e} is still syncing after ${Xe} ms`);
			await Ze(Ye);
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
				let t = await this.childDoc(e, W), n = [];
				for (let e of await this.request("/api/block/getChildBlocks", { id: t })) e.type === "s" && (await this.request("/api/attr/getBlockAttrs", { id: e.id }))["custom-event-id"] && n.push(e.id);
				if (n.length === 0) return;
				this.siyuan.logger.info(`[qq] [inbox] move ${n.length} leftover message(s) out of ${t}`), this.config().inbox.downloadAssets && await this.downloadAssets(t);
				for (let t of n) await this.moveToDate(e, t, et(t));
			} catch (t) {
				this.siyuan.logger.warn(`[qq] [inbox] move the leftover messages of ${e} failed:`, G(t));
			}
		}
	}
	async reply(e, t, n) {
		let r = V(this.config());
		if (!r) return;
		let i = A(e, "msg_idx");
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
			this.siyuan.logger.warn(`[qq] [inbox] reply to the message ${e.id} with the block ${t} failed:`, G(n));
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
	async findMessage(e, t) {
		return this.messages.get(`${e} ${t}`) || (await this.request("/api/query/sql", { stmt: `SELECT block_id FROM attributes WHERE name = 'custom-msg-idx' AND value = '${t.replace(/'/g, "''")}' AND path LIKE '%/${e}/%' LIMIT 1` }))[0]?.block_id;
	}
	remember(e, t, n) {
		this.messages.set(`${e} ${t}`, n), this.messages.size > Je && this.messages.delete(this.messages.keys().next().value);
	}
	labels() {
		let e = this.siyuan.plugin.i18n?.inbox;
		return {
			quote: e?.quote || "Quoted message",
			unavailable: e?.unavailable || "[Message not available]"
		};
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
}, rt = {
	offline: "Inbox offline: messages of this group are not recorded for now (device: {{1}})",
	online: "Inbox online: messages of this group are recorded in SiYuan (device: {{1}})"
};
function it(e) {
	return e instanceof Error ? e.message : String(e);
}
var at = class {
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
			this.siyuan.logger.warn(`[qq] [notices] send the ${n} notice to group ${t} failed:`, it(e));
		}
	}
	text(e) {
		return this.siyuan.plugin.i18n?.notices?.[e] || rt[e];
	}
}, ot = 50, st = 10;
function ct(e) {
	return e instanceof Error ? e.message : String(e);
}
function lt(e) {
	return {
		type: e.type ?? "command",
		name: e.name ?? "",
		desc: e.desc ?? "",
		only_admin: e.only_admin ?? !1,
		link: e.link ?? ""
	};
}
function ut(e, t) {
	let n = (e) => JSON.stringify({
		items: (e?.items ?? []).map(lt),
		remark: e?.remark ?? ""
	});
	return n(e) === n(t);
}
var dt = class {
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
			n = !1, this.siyuan.logger.warn(`[qq] [panels] sync the ${r?.scope} panel ${JSON.stringify(r?.panel?.remark)} failed:`, ct(e));
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
		if (t.target_type && a.target_type && t.target_type !== a.target_type && this.siyuan.logger.warn(`[qq] [panels] the ${r} panel "${n}" (${a.panel_id}) has target_type ${a.target_type} instead of ${t.target_type}, which an update cannot change`), ut(a.panel, i)) {
			this.siyuan.logger.debug(`[qq] [panels] the ${r} panel "${n}" (${a.panel_id}) is up to date`);
			return;
		}
		let o = await this.call(e, "PUT", `/v2/panels/${encodeURIComponent(a.panel_id)}`, { panel: i });
		this.siyuan.logger.info(`[qq] [panels] updated the ${r} panel "${n}" (${a.panel_id}) to version ${o.version}`);
	}
	async find(e, t, n) {
		let r = "";
		for (let i = 0; i < st; i++) {
			let i = `scope=${encodeURIComponent(t)}&limit=${ot}${r ? `&cursor=${encodeURIComponent(r)}` : ""}`, a = await this.call(e, "GET", `/v2/panels?${i}`), o = a.records?.find((e) => e.panel?.remark === n);
			if (o) return o;
			if (a.is_end || !a.next_cursor) return;
			r = a.next_cursor;
		}
		throw Error(`the ${t} panels have more than ${st} pages`);
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
}, ft = 5e3;
function pt(e) {
	return e instanceof Error ? e.message : String(e);
}
function K(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function q(e) {
	let t = typeof e == "number" ? e * 1e3 : typeof e == "string" ? Date.parse(e) : NaN, n = new Date(t);
	return (Number.isNaN(n.getTime()) ? /* @__PURE__ */ new Date() : n).toISOString();
}
function J(e) {
	return typeof e == "string" ? Date.parse(e) : NaN;
}
function Y(e, t) {
	return t ? e && J(e.time) > J(t.time) ? e : t : e;
}
function mt(e, t) {
	let n = Y(e, t), r = n === t ? e : t;
	return n && !n.username && r?.username && r.openid === n.openid ? {
		...n,
		username: r.username
	} : n;
}
function ht(e, t) {
	return J(e) < J(t) ? e : t;
}
function X(e, ...t) {
	let n = J(e?.time);
	return Number.isNaN(n) || t.some((e) => J(e?.time) > n) ? "added" : "removed";
}
function Z(e, t) {
	let n = K(e) ? e[t] : void 0;
	return K(n) ? n : void 0;
}
function gt(e) {
	let t = {};
	for (let [n, r] of Object.entries(e ?? {})) K(r) && (t[n] = r);
	return t;
}
function _t(e, t) {
	let n = Y(e?.added, t.added), r = Y(e?.removed, t.removed), i = Y(e?.lastMessage, t.lastMessage);
	return {
		...e,
		status: X(r, n, i),
		firstSeen: ht(e?.firstSeen, t.firstSeen),
		added: n,
		removed: r,
		proactive: Y(e?.proactive, t.proactive),
		lastMessage: i,
		owner: mt(e?.owner, t.owner)
	};
}
function vt(e, t) {
	let n = Y(e?.added, t.added), r = Y(e?.removed, t.removed), i = mt(e?.lastMessage, t.lastMessage);
	return {
		...e,
		status: X(r, n, i),
		firstSeen: ht(e?.firstSeen, t.firstSeen),
		unionOpenid: t.unionOpenid || e?.unionOpenid,
		added: n,
		removed: r,
		proactive: Y(e?.proactive, t.proactive),
		lastMessage: i
	};
}
function Q(e, t) {
	let n = { ...e };
	for (let [r, i] of Object.entries(t)) {
		let t = Z(e, r), a = { ...Z(t, "groups") };
		for (let [e, t] of Object.entries(i.groups)) a[e] = _t(Z(a, e), t);
		let o = { ...Z(t, "users") };
		for (let [e, t] of Object.entries(i.users)) o[e] = vt(Z(o, e), t);
		n[r] = {
			...t,
			groups: a,
			users: o
		};
	}
	return n;
}
function yt(e, t) {
	return {
		groups: { [e]: _t(void 0, t) },
		users: {}
	};
}
function $(e, t) {
	return {
		groups: {},
		users: { [e]: vt(void 0, t) }
	};
}
function bt(e) {
	switch (e.t) {
		case "GROUP_ADD_ROBOT":
		case "GROUP_DEL_ROBOT":
		case "GROUP_MSG_RECEIVE":
		case "GROUP_MSG_REJECT": {
			let t = e.d;
			if (!t?.group_openid) return;
			let n = q(t.timestamp), r = {
				time: n,
				operator: t.op_member_openid || void 0
			};
			return yt(t.group_openid, {
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
			let n = q(t.timestamp), r = t.author?.member_openid || t.author?.id;
			return yt(t.group_openid, {
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
			let n = q(t.timestamp);
			return $(t.openid, {
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
			let r = q(t.timestamp);
			return $(n, {
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
var xt = class {
	siyuan;
	config;
	pending = {};
	timer;
	queue = Promise.resolve();
	constructor(e, t) {
		this.siyuan = e, this.config = t;
	}
	handle(e) {
		let t = this.config().appid.trim(), n = t ? bt(e) : void 0;
		n && (this.pending = Q(this.pending, { [t]: n }), this.timer === void 0 && (this.timer = setTimeout(() => void this.flush(), ft)));
	}
	flush() {
		return clearTimeout(this.timer), this.timer = void 0, this.queue = this.queue.then(() => this.write()), this.queue;
	}
	list(e) {
		let t = this.queue.then(async () => {
			let t = Z(Q(await this.read(), this.pending), e);
			return {
				groups: gt(Z(t, "groups")),
				users: gt(Z(t, "users"))
			};
		});
		return this.queue = t.then(() => void 0, () => void 0), t;
	}
	async write() {
		let e = this.pending;
		if (Object.keys(e).length !== 0) {
			this.pending = {};
			try {
				let t = Q(await this.read(), e);
				await this.siyuan.storage.put(p.USERS_FILE_NAME, JSON.stringify(t, void 0, 4)), this.siyuan.logger.debug(`[qq] [users] updated ${p.USERS_FILE_NAME}`);
			} catch (t) {
				this.pending = Q(e, this.pending), this.siyuan.logger.warn(`[qq] [users] update ${p.USERS_FILE_NAME} failed, retry with the next change:`, pt(t));
			}
		}
	}
	async read() {
		let e = p.USERS_FILE_NAME;
		if (!(await this.siyuan.storage.list(".")).some((t) => t.name === e)) return {};
		let t = await (await this.siyuan.storage.get(e)).text(), n;
		try {
			n = JSON.parse(t);
		} catch (t) {
			throw Error(`${e} is not valid JSON, fix or delete it: ${pt(t)}`);
		}
		if (!K(n)) throw Error(`${e} is not a JSON object, fix or delete it`);
		return n;
	}
}, St = 1e3, Ct = 5e3;
function wt(e, t) {
	return new Promise((n) => {
		let r = setTimeout(n, t), i = () => {
			clearTimeout(r), n();
		};
		e.then(i, i);
	});
}
new class {
	siyuan = siyuan;
	openapi;
	qq;
	inbox;
	commands;
	panels;
	notices;
	users;
	config = f();
	device = "";
	deviceName = "";
	running;
	panelsSynced;
	reloadTimer;
	constructor() {
		this.openapi = new Pe(this.siyuan), this.qq = new Ke(this.siyuan, this.openapi, this.onQQDispatch.bind(this)), this.inbox = new nt(this.siyuan, this.openapi, () => this.config.qq), this.commands = new Ve(this.siyuan, this.openapi, () => this.config.qq), this.panels = new dt(this.siyuan, this.openapi), this.notices = new at(this.siyuan, this.openapi), this.users = new xt(this.siyuan, () => this.config.qq), this.siyuan.event.handler = this.onEvent.bind(this), this.siyuan.plugin.lifecycle.onload = this.onload.bind(this), this.siyuan.plugin.lifecycle.onrunning = this.onrunning.bind(this), this.siyuan.plugin.lifecycle.onunload = this.onunload.bind(this);
	}
	async onload() {
		await this.loadConfig();
		let e = await this.loadDevice();
		this.device = e.id, this.deviceName = e.name, await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.UPDATE_CONFIG, this.rpcUpdateConfig.bind(this), "Update the plugin config and reconnect the QQ bot if its config changed."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.CALL_QQ_API, this.rpcCallQQApi.bind(this), "Call a QQ bot OpenAPI endpoint as the configured bot. Params: url (a path starting with /), method (GET, POST, PUT, PATCH or DELETE), body (optional, sent as JSON). Returns the response { status, headers, body }."), await this.siyuan.rpc.bind(p.KERNEL_RPC_METHOD.GET_USERS, this.rpcGetUsers.bind(this), "Get the known groups and C2C users of the configured bot from users.json, including the changes not written yet. Returns { groups, users }, keyed by group_openid and user_openid."), await this.siyuan.storage.watcher.add(".");
	}
	async onrunning() {
		await this.applyConfig(), this.notify("online");
	}
	async onunload() {
		await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.UPDATE_CONFIG), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.CALL_QQ_API), await this.siyuan.rpc.unbind(p.KERNEL_RPC_METHOD.GET_USERS), clearTimeout(this.reloadTimer), await wt(this.notify("offline"), Ct), await this.qq.stop(), await this.users.flush(), await this.siyuan.storage.watcher.remove(".");
	}
	async applyConfig() {
		let e = this.config.qq.device, t = !e || e === this.device;
		t !== this.running && (this.siyuan.logger.info(t ? `[qq] run the QQ bot on this device ${this.device}` : `[qq] the QQ bot runs on device ${e} only, not on this device ${this.device}`), this.running = t), t ? (await this.qq.update(this.config.qq), this.syncPanels()) : await this.qq.stop();
	}
	syncPanels() {
		let e = V(this.config.qq);
		if (!e) return;
		let t = this.config.qq.panels, n = JSON.stringify([e, t]);
		n !== this.panelsSynced && (this.panelsSynced = n, this.panels.sync(e, [t.c2c, t.group]).then((e) => {
			!e && this.panelsSynced === n && (this.panelsSynced = void 0);
		}));
	}
	async notify(e) {
		let t = V(this.config.qq), n = tt(this.config.qq.inbox).filter((e) => e.notify).map((e) => e.group);
		this.running && t && n.length !== 0 && await this.notices.send(t, n, e, this.deviceName || this.device);
	}
	onEvent(e) {
		e.type === "fs-notify" && e.detail?.path === p.GLOBAL_CONFIG_NAME && (clearTimeout(this.reloadTimer), this.reloadTimer = setTimeout(async () => {
			await this.loadConfig(), await this.applyConfig();
		}, St));
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
			this.config = f(await e.json());
		} catch (e) {
			this.siyuan.logger.info(`load ${p.GLOBAL_CONFIG_NAME} failed, keep the current config:`, String(e));
		}
	}
	async rpcUpdateConfig(e) {
		this.config = f(e), await this.applyConfig();
	}
	async rpcCallQQApi(e, t, n) {
		let r = Me(e, t, n), i = V(this.config.qq);
		if (!i) throw Error("QQ_BOT_APPID or QQ_BOT_SECRET is not configured");
		return this.openapi.request(i, r);
	}
	async rpcGetUsers() {
		let e = this.config.qq.appid.trim();
		if (!e) throw Error("QQ_BOT_APPID is not configured");
		return this.users.list(e);
	}
	onQQDispatch(e) {
		this.siyuan.logger.info("[qq] event", e.t, e), this.config.qq.eventLog && this.writeEventLog(e), this.inbox.handle(e), this.commands.handle(e), this.users.handle(e);
	}
	async writeEventLog(e) {
		let t = Ue(e);
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
