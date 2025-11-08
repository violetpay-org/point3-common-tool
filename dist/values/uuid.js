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
    toString() { return this.value; }
    ;
    equals(other) {
        return this.value === other.value;
    }
}
exports.UUID = UUID;
//# sourceMappingURL=uuid.js.map