"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checksum = void 0;
const crypto_1 = require("crypto");
class Checksum {
    constructor(bigint, md5Hex) {
        this.bigIntValue = bigint;
        this.md5Hex = md5Hex;
    }
    static from(input) {
        if (typeof input === "string") {
            if (!/^[0-9a-f]{32}$/i.test(input)) {
                throw new Error("MD5 해시는 반드시 32자리 16진수(0-9, a-f) 문자열이어야 합니다.");
            }
            return new Checksum(BigInt("0x" + input), input);
        }
        return new Checksum(BigInt(input), input.toString(16).padStart(32, "0"));
    }
    static parse(...args) {
        args = args.sort();
        const content = args.join(this.SEPARATOR);
        return this.from((0, crypto_1.createHash)("md5").update(content).digest("hex"));
    }
    toBigInt() {
        return this.bigIntValue;
    }
    ;
    toString() {
        return this.md5Hex;
    }
    ;
    equals(another) {
        return this.toBigInt() == another.toBigInt() &&
            this.toString() == another.toString();
    }
    ;
}
exports.Checksum = Checksum;
Checksum.SEPARATOR = "<|separation|>";
;
//# sourceMappingURL=checksum.js.map