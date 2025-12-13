"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = void 0;
class UUID {
    constructor(value) {
        this.value = value;
    }
    static parse(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        if (!uuidRegex.test(uuid)) {
            throw new Error('올바르지 않은 UUID 형식입니다.');
        }
        return new UUID(uuid);
    }
    static fromBigInt(bigint) {
        const strVal = BigInt(bigint).toString(16).padStart(32, '0');
        return new UUID(strVal.substring(0, 8) + '-' +
            strVal.substring(8, 12) + '-' +
            strVal.substring(12, 16) + '-' +
            strVal.substring(16, 20) + '-' +
            strVal.substring(20));
    }
    toBigInt() {
        return BigInt('0x' + this.value.split('-').join(''));
    }
    toString() { return this.value; }
    ;
    equals(other) {
        return this.value === other.value;
    }
}
exports.UUID = UUID;
//# sourceMappingURL=uuid.js.map