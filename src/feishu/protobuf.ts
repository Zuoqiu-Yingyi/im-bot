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

/**
 * 飞书长连接的帧: protobuf (proto2) 编码的 pbbp2.Frame, 字段编号取自官方 SDK 生成的代码 (pbbp2.js)。
 * 思源内核的 goja 运行时没有 TextEncoder 与 TextDecoder, 所以 UTF-8 与 varint 都在这里实现;
 * uint64 字段 (SeqID、LogID) 用十进制字符串表示: 服务端下发的 LogID 超过 2^53, 用 number 会丢失精度。
 */

// message Header { required string key = 1; required string value = 2; }
// message Frame {
//     required uint64 SeqID = 1; required uint64 LogID = 2; required int32 service = 3; required int32 method = 4;
//     repeated Header headers = 5; optional string payloadEncoding = 6; optional string payloadType = 7;
//     optional bytes payload = 8; optional string LogIDNew = 9;
// }

export interface IFrameHeader {
    key: string;
    value: string;
}

export interface IFrame {
    SeqID: string; // uint64 的十进制字符串
    LogID: string;
    service: number;
    method: number; // 0 为控制帧, 1 为数据帧
    headers: IFrameHeader[];
    payloadEncoding?: string;
    payloadType?: string;
    payload?: Uint8Array;
    LogIDNew?: string;
}

/* 64 位无符号整数的低 32 位与高 32 位 */
interface IUint64 {
    lo: number;
    hi: number;
}

const WIRE_VARINT = 0;
const WIRE_64BIT = 1;
const WIRE_LENGTH_DELIMITED = 2;
const WIRE_32BIT = 5;
const DECODE_CHUNK = 4096; // 解码 UTF-8 时每次转换为字符串的码元数

/* 把字符串编码为 UTF-8, 不成对的代理项编码为 U+FFFD */
export function utf8Encode(text: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
            const next = text.charCodeAt(i + 1);
            if (next >= 0xDC00 && next <= 0xDFFF) {
                code = 0x10000 + ((code - 0xD800) << 10) + (next - 0xDC00);
                i++;
            }
        }
        if (code >= 0xD800 && code <= 0xDFFF) {
            code = 0xFFFD;
        }
        if (code < 0x80) {
            bytes.push(code);
        }
        else if (code < 0x800) {
            bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
        }
        else if (code < 0x10000) {
            bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
        }
        else {
            bytes.push(0xF0 | (code >> 18), 0x80 | ((code >> 12) & 0x3F), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
        }
    }
    return new Uint8Array(bytes);
}

/* 是否为 UTF-8 的后续字节 (10xxxxxx) */
function isContinuation(byte: number | undefined): boolean {
    return byte !== undefined && (byte & 0xC0) === 0x80;
}

/* 把 UTF-8 解码为字符串, 无效的字节序列解码为 U+FFFD */
export function utf8Decode(bytes: Uint8Array): string {
    let result = "";
    let units: number[] = [];
    let i = 0;
    while (i < bytes.length) {
        const byte = bytes[i]!;
        let code = 0xFFFD;
        let size = 1;
        if (byte < 0x80) {
            code = byte;
        }
        else if (byte >= 0xC2 && byte < 0xE0 && isContinuation(bytes[i + 1])) {
            code = ((byte & 0x1F) << 6) | (bytes[i + 1]! & 0x3F);
            size = 2;
        }
        else if (byte >= 0xE0 && byte < 0xF0 && isContinuation(bytes[i + 1]) && isContinuation(bytes[i + 2])) {
            code = ((byte & 0x0F) << 12) | ((bytes[i + 1]! & 0x3F) << 6) | (bytes[i + 2]! & 0x3F);
            size = 3;
            if (code < 0x800 || (code >= 0xD800 && code <= 0xDFFF)) {
                code = 0xFFFD;
            }
        }
        else if (byte >= 0xF0 && byte < 0xF5 && isContinuation(bytes[i + 1]) && isContinuation(bytes[i + 2]) && isContinuation(bytes[i + 3])) {
            code = ((byte & 0x07) << 18) | ((bytes[i + 1]! & 0x3F) << 12) | ((bytes[i + 2]! & 0x3F) << 6) | (bytes[i + 3]! & 0x3F);
            size = 4;
            if (code < 0x10000 || code > 0x10FFFF) {
                code = 0xFFFD;
            }
        }
        if (code >= 0x10000) {
            code -= 0x10000;
            units.push(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF));
        }
        else {
            units.push(code);
        }
        if (units.length >= DECODE_CHUNK) {
            result += String.fromCharCode(...units);
            units = [];
        }
        i += size;
    }
    return result + String.fromCharCode(...units);
}

/* uint64 转为十进制字符串: 按 4 个 16 位的分段做除法 */
function uint64ToString({ lo, hi }: IUint64): string {
    const limbs = [hi >>> 16, hi & 0xFFFF, lo >>> 16, lo & 0xFFFF];
    let text = "";
    while (limbs.some((limb) => limb !== 0)) {
        let remainder = 0;
        for (let i = 0; i < limbs.length; i++) {
            const current = remainder * 0x10000 + limbs[i]!;
            limbs[i] = Math.floor(current / 10);
            remainder = current % 10;
        }
        text = remainder + text;
    }
    return text || "0";
}

/* 十进制字符串转为 uint64 */
function uint64FromString(text: string): IUint64 {
    if (!/^\d+$/.test(text)) {
        throw new Error(`invalid uint64 ${text}`);
    }
    const limbs = [0, 0, 0, 0];
    for (const digit of text) {
        let carry = digit.charCodeAt(0) - 48;
        for (let i = limbs.length - 1; i >= 0; i--) {
            const current = limbs[i]! * 10 + carry;
            limbs[i] = current & 0xFFFF;
            carry = Math.floor(current / 0x10000);
        }
        if (carry) {
            throw new Error(`uint64 overflow ${text}`);
        }
    }
    return {
        lo: ((limbs[2]! << 16) | limbs[3]!) >>> 0,
        hi: ((limbs[0]! << 16) | limbs[1]!) >>> 0,
    };
}

class Writer {
    private readonly bytes: number[] = [];

    public varint({ lo, hi }: IUint64): void {
        while (hi > 0 || lo > 0x7F) {
            this.bytes.push((lo & 0x7F) | 0x80);
            lo = ((lo >>> 7) | (hi << 25)) >>> 0;
            hi >>>= 7;
        }
        this.bytes.push(lo);
    }

    public tag(field: number, wire: number): void {
        this.varint({ lo: ((field << 3) | wire) >>> 0, hi: 0 });
    }

    /* int32 的负数按 64 位补码编码 */
    public int32(field: number, value: number): void {
        this.tag(field, WIRE_VARINT);
        this.varint({ lo: value >>> 0, hi: value < 0 ? 0xFFFFFFFF : 0 });
    }

    public uint64(field: number, value: string): void {
        this.tag(field, WIRE_VARINT);
        this.varint(uint64FromString(value));
    }

    public bytesField(field: number, data: Uint8Array): void {
        this.tag(field, WIRE_LENGTH_DELIMITED);
        this.varint({ lo: data.length, hi: 0 });
        for (const byte of data) {
            this.bytes.push(byte);
        }
    }

    public string(field: number, value: string): void {
        this.bytesField(field, utf8Encode(value));
    }

    public finish(): Uint8Array {
        return new Uint8Array(this.bytes);
    }
}

class Reader {
    private readonly buffer: Uint8Array;
    private position = 0;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer;
    }

    public get done(): boolean {
        return this.position >= this.buffer.length;
    }

    public varint(): IUint64 {
        let lo = 0;
        let hi = 0;
        for (let i = 0; i < 4; i++) {
            const byte = this.byte();
            lo |= (byte & 0x7F) << (i * 7);
            if (byte < 0x80) {
                return { lo: lo >>> 0, hi: 0 };
            }
        }
        let byte = this.byte();
        lo |= (byte & 0x0F) << 28;
        hi = (byte & 0x7F) >> 4;
        if (byte < 0x80) {
            return { lo: lo >>> 0, hi };
        }
        for (let i = 0; i < 5; i++) {
            byte = this.byte();
            hi |= (byte & 0x7F) << (i * 7 + 3);
            if (byte < 0x80) {
                return { lo: lo >>> 0, hi: hi >>> 0 };
            }
        }
        throw new Error("protobuf: the varint is too long");
    }

    public bytes(): Uint8Array {
        const length = this.varint().lo;
        if (this.position + length > this.buffer.length) {
            throw new Error("protobuf: the length is out of range");
        }
        const bytes = this.buffer.subarray(this.position, this.position + length);
        this.position += length;
        return bytes;
    }

    public string(): string {
        return utf8Decode(this.bytes());
    }

    /* 跳过未知的字段 */
    public skip(wire: number): void {
        switch (wire) {
            case WIRE_VARINT:
                this.varint();
                return;
            case WIRE_64BIT:
                this.advance(8);
                return;
            case WIRE_LENGTH_DELIMITED:
                this.bytes();
                return;
            case WIRE_32BIT:
                this.advance(4);
                return;
            default:
                throw new Error(`protobuf: unsupported wire type ${wire}`);
        }
    }

    private byte(): number {
        if (this.position >= this.buffer.length) {
            throw new Error("protobuf: unexpected end of data");
        }
        return this.buffer[this.position++]!;
    }

    private advance(length: number): void {
        if (this.position + length > this.buffer.length) {
            throw new Error("protobuf: unexpected end of data");
        }
        this.position += length;
    }
}

function decodeHeader(bytes: Uint8Array): IFrameHeader {
    const reader = new Reader(bytes);
    const header: IFrameHeader = { key: "", value: "" };
    while (!reader.done) {
        const tag = reader.varint().lo;
        const wire = tag & 7;
        switch (tag >>> 3) {
            case 1:
                header.key = reader.string();
                break;
            case 2:
                header.value = reader.string();
                break;
            default:
                reader.skip(wire);
                break;
        }
    }
    return header;
}

/**
 * 解码一个帧
 * @throws 数据不是有效的 protobuf
 */
export function decodeFrame(bytes: Uint8Array): IFrame {
    const reader = new Reader(bytes);
    const frame: IFrame = { SeqID: "0", LogID: "0", service: 0, method: 0, headers: [] };
    while (!reader.done) {
        const tag = reader.varint().lo;
        const wire = tag & 7;
        const field = tag >>> 3;
        // 字段 1–4 是 varint, 5–9 是 length-delimited; 线类型不符的字段当作未知字段跳过
        if ((field <= 4 && wire !== WIRE_VARINT) || (field > 4 && wire !== WIRE_LENGTH_DELIMITED)) {
            reader.skip(wire);
            continue;
        }
        switch (field) {
            case 1:
                frame.SeqID = uint64ToString(reader.varint());
                break;
            case 2:
                frame.LogID = uint64ToString(reader.varint());
                break;
            case 3:
                frame.service = reader.varint().lo | 0;
                break;
            case 4:
                frame.method = reader.varint().lo | 0;
                break;
            case 5:
                frame.headers.push(decodeHeader(reader.bytes()));
                break;
            case 6:
                frame.payloadEncoding = reader.string();
                break;
            case 7:
                frame.payloadType = reader.string();
                break;
            case 8:
                frame.payload = reader.bytes().slice();
                break;
            case 9:
                frame.LogIDNew = reader.string();
                break;
            default:
                reader.skip(wire);
                break;
        }
    }
    return frame;
}

/* 编码一个帧; SeqID、LogID、service 与 method 是 required 字段, 为 0 时也要写入 */
export function encodeFrame(frame: IFrame): Uint8Array {
    const writer = new Writer();
    writer.uint64(1, frame.SeqID);
    writer.uint64(2, frame.LogID);
    writer.int32(3, frame.service);
    writer.int32(4, frame.method);
    for (const header of frame.headers) {
        const item = new Writer();
        item.string(1, header.key);
        item.string(2, header.value);
        writer.bytesField(5, item.finish());
    }
    if (frame.payloadEncoding !== undefined) {
        writer.string(6, frame.payloadEncoding);
    }
    if (frame.payloadType !== undefined) {
        writer.string(7, frame.payloadType);
    }
    if (frame.payload !== undefined) {
        writer.bytesField(8, frame.payload);
    }
    if (frame.LogIDNew !== undefined) {
        writer.string(9, frame.LogIDNew);
    }
    return writer.finish();
}

/* 帧头中键为 key 的值 */
export function frameHeader(frame: IFrame, key: string): string | undefined {
    return frame.headers.find((header) => header.key === key)?.value;
}
