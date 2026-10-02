// Copyright (C) 2026 Zuoqiu Yingyi
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { resultCode } from "./api";
import {
    API_BASE_URL,
    LOGIN_POLL_INTERVAL,
    LOGIN_TIMEOUT,
    MAX_QR_CODES,
} from "./constants";

import type * as kernel from "siyuan/kernel";

import type {
    IQRCodeStatusResponse,
    IWeixinAccountState,
    IWeixinLoginState,
    TWeixinLoginStatus,
} from "@/types/weixin";

import type { WeixinApi } from "./api";

/* 扫码确认后得到的登录信息 */
export interface IConfirmedLogin {
    botId: string;
    token: string;
    baseUrl: string; // https 接口地址
    userId: string;
}

/* 进行中的登录的状态 */
const ACTIVE_STATUSES = new Set<TWeixinLoginStatus>([
    "need_verifycode",
    "scaned",
    "verifying",
    "wait",
]);

const VERIFY_CODE = /^\d{1,16}$/;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/* 服务端返回的接口地址; 不是 https 地址时使用默认地址, 因为 bot_token 会发送给该地址 */
function resolveBaseUrl(baseurl: string | undefined): string {
    return baseurl?.startsWith("https://") ? baseurl : API_BASE_URL;
}

/**
 * 微信扫码登录: 获取二维码, 在后台长轮询扫码状态, 确认后交给 onConfirmed 保存登录信息。
 * 流程与官方客户端的 auth/login-qr.ts 相同: 处理验证码与换机房 (scaned_but_redirect);
 * 二维码过期或验证码被锁定时获取新的二维码, 一次登录最多 3 个二维码, 最长 480 秒。
 * 同一时间只有一个登录, 开始新的登录或取消时, 旧登录的轮询在当前请求返回后退出。
 * WeChat QR code login: fetches a QR code, long-polls its status in the
 * background and hands the confirmed login to onConfirmed.
 */
export class WeixinLogin {
    private readonly siyuan: kernel.ISiyuan;
    private readonly api: WeixinApi;
    private readonly onConfirmed: (login: IConfirmedLogin) => Promise<IWeixinAccountState>;

    private session = 0; // 登录序号, 开始或结束登录时递增, 旧登录的轮询据此退出
    private state: IWeixinLoginState = { status: "idle" };
    private qrcode = ""; // 当前二维码的 ID
    private codes = 0; // 本次登录已获取的二维码数
    private baseUrl = API_BASE_URL; // 查询扫码状态的接口地址
    private verifyCode?: string; // 用户输入、下次查询时提交的数字

    /**
     * @param siyuan - 内核插件全局对象
     * @param api - 微信接口客户端
     * @param onConfirmed - 保存登录信息并开始接收消息, 返回给前端的登录信息; 失败时抛出错误, 登录状态变为 failed
     */
    constructor(siyuan: kernel.ISiyuan, api: WeixinApi, onConfirmed: (login: IConfirmedLogin) => Promise<IWeixinAccountState>) {
        this.siyuan = siyuan;
        this.api = api;
        this.onConfirmed = onConfirmed;
    }

    /* 当前状态的副本 */
    public current(): IWeixinLoginState {
        return { ...this.state };
    }

    /**
     * 开始新的扫码登录, 并取消进行中的登录
     * @returns 获取到二维码后的状态; 获取失败时为 failed
     */
    public async start(): Promise<IWeixinLoginState> {
        const session = ++this.session;
        this.codes = 0;
        this.verifyCode = undefined;
        this.state = { status: "wait" };
        try {
            await this.refresh(session);
        }
        catch (error) {
            if (session === this.session) {
                this.finish({ status: "failed", error: errorMessage(error) });
            }
            return this.current();
        }
        if (session === this.session) {
            void this.poll(session);
        }
        return this.current();
    }

    /**
     * 提交手机上显示的数字, 下次查询扫码状态时带上
     * @throws 登录没有在等待输入数字, 或输入的不是数字
     */
    public verify(code: unknown): IWeixinLoginState {
        if (this.state.status !== "need_verifycode") {
            throw new Error(`the login is not waiting for a verify code, its status is ${this.state.status}`);
        }
        const value = typeof code === "string" ? code.trim() : "";
        if (!VERIFY_CODE.test(value)) {
            throw new Error("the verify code must be digits");
        }
        this.verifyCode = value;
        this.state = { ...this.state, status: "verifying" };
        return this.current();
    }

    /* 取消进行中的登录 */
    public cancel(): IWeixinLoginState {
        if (ACTIVE_STATUSES.has(this.state.status)) {
            this.finish({ status: "cancelled" });
        }
        return this.current();
    }

    /* 结束登录, 递增序号使轮询退出 */
    private finish(state: IWeixinLoginState): void {
        this.session++;
        this.qrcode = "";
        this.verifyCode = undefined;
        this.state = state;
    }

    /**
     * 获取新的二维码, 显示的链接随之更新
     * @returns 已达到一次登录的二维码数上限时为 false
     * @throws 请求失败或没有返回二维码
     */
    private async refresh(session: number): Promise<boolean> {
        if (this.codes >= MAX_QR_CODES) {
            return false;
        }
        const response = await this.api.getQRCode();
        if (session !== this.session) {
            return true;
        }
        const code = resultCode(response);
        if (code !== 0 || !response.qrcode || !response.qrcode_img_content) {
            // 响应中的 qrcode 可以用来取得 bot_token, 不写入错误信息
            throw new Error(`get_bot_qrcode returned no QR code: ${code} ${response.errmsg ?? ""}`);
        }
        this.codes++;
        this.qrcode = response.qrcode;
        this.baseUrl = API_BASE_URL;
        this.verifyCode = undefined;
        this.state = { status: "wait", url: response.qrcode_img_content };
        return true;
    }

    /* 在后台查询扫码状态, 直到登录结束、超时或被新的登录取代 */
    private async poll(session: number): Promise<void> {
        const deadline = Date.now() + LOGIN_TIMEOUT;
        while (session === this.session) {
            if (Date.now() >= deadline) {
                void this.siyuan.logger.info("[weixin] [login] timed out waiting for the QR code to be scanned");
                this.finish({ status: "expired" });
                return;
            }
            if (this.state.status === "need_verifycode") {
                // 等待用户输入手机上显示的数字
                await sleep(LOGIN_POLL_INTERVAL);
                continue;
            }

            const code = this.verifyCode;
            let response: IQRCodeStatusResponse;
            try {
                response = await this.api.getQRCodeStatus(this.baseUrl, this.qrcode, code);
            }
            catch (error) {
                // 网络错误与网关超时都视为仍在等待, 与官方客户端相同
                void this.siyuan.logger.debug("[weixin] [login] query the QR code status failed, retry:", errorMessage(error));
                response = { status: "wait" };
            }
            if (session !== this.session) {
                return;
            }

            try {
                if (await this.handle(session, response, code)) {
                    return;
                }
            }
            catch (error) {
                if (session === this.session) {
                    void this.siyuan.logger.warn("[weixin] [login] login failed:", errorMessage(error));
                    this.finish({ status: "failed", error: errorMessage(error) });
                }
                return;
            }
            await sleep(LOGIN_POLL_INTERVAL);
        }
    }

    /**
     * 处理一次查询到的扫码状态
     * @param session - 登录序号
     * @param response - 查询结果
     * @param code - 这次查询提交的数字
     * @returns 登录是否已结束
     * @throws 登录失败
     */
    private async handle(session: number, response: IQRCodeStatusResponse, code: string | undefined): Promise<boolean> {
        switch (response.status) {
            case "wait":
                return false;

            case "scaned":
            case "scaned_but_redirect":
                // 提交数字后返回已扫码, 说明数字正确, 之后的查询不再带上它
                if (code !== undefined && this.verifyCode === code) {
                    this.verifyCode = undefined;
                }
                // 换到其他机房继续查询
                if (response.status === "scaned_but_redirect" && response.redirect_host) {
                    this.baseUrl = `https://${response.redirect_host}`;
                }
                this.state = { ...this.state, status: "scaned", wrongCode: false };
                return false;

            case "need_verifycode":
                // 提交数字后仍返回 need_verifycode, 说明数字不正确
                this.verifyCode = undefined;
                this.state = { ...this.state, status: "need_verifycode", wrongCode: code !== undefined };
                return false;

            case "expired":
            case "verify_code_blocked":
                void this.siyuan.logger.info(`[weixin] [login] ${response.status}, get a new QR code`);
                if (await this.refresh(session)) {
                    return false;
                }
                this.finish(response.status === "expired"
                    ? { status: "expired" }
                    : { status: "failed", error: "verify_code_blocked" });
                return true;

            case "confirmed":
                await this.confirm(session, response);
                return true;

            case "binded_redirect":
                // 只在 local_token_list 中有已绑定该用户的 bot_token 时返回, 本插件总是发送空列表
                throw new Error("binded_redirect: the bot is already bound to this client");

            default:
                void this.siyuan.logger.debug(`[weixin] [login] unknown QR code status ${String(response.status)}, code ${resultCode(response)}`);
                return false;
        }
    }

    /* 扫码确认: 保存登录信息并开始接收消息 */
    private async confirm(session: number, response: IQRCodeStatusResponse): Promise<void> {
        if (!response.bot_token || !response.ilink_bot_id) {
            throw new Error("the login is confirmed without bot_token or ilink_bot_id");
        }
        const account = await this.onConfirmed({
            botId: response.ilink_bot_id,
            token: response.bot_token,
            baseUrl: resolveBaseUrl(response.baseurl),
            userId: response.ilink_user_id ?? "",
        });
        void this.siyuan.logger.info(`[weixin] [login] confirmed, bot ${account.botId}, user ${account.userId}`);
        if (session === this.session) {
            this.finish({ status: "confirmed", account });
        }
    }
}
