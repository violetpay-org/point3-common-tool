"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gulid = void 0;
const ulid_1 = require("ulid");
class Gulid {
    constructor(prefix, ulidValue) {
        this._prefix = prefix;
        this._ulid = ulidValue;
    }
    static create(prefix) {
        if (!prefix || prefix.length === 0) {
            throw new Error('Prefix is required');
        }
        if (prefix.includes(':')) {
            throw new Error('Prefix must not contain ":"');
        }
        return new Gulid(prefix, (0, ulid_1.ulid)());
    }
    static parse(id) {
        const colonCount = (id.match(/:/g) || []).length;
        if (colonCount === 0) {
            throw new Error('Invalid Gulid format: missing ":" separator');
        }
        if (colonCount > 1) {
            throw new Error('Invalid Gulid format: multiple ":" not allowed');
        }
        const colonIndex = id.indexOf(':');
        const prefix = id.substring(0, colonIndex);
        const ulidPart = id.substring(colonIndex + 1);
        if (!prefix || prefix.length === 0) {
            throw new Error('Invalid Gulid format: empty prefix');
        }
        if (ulidPart.length !== 26) {
            throw new Error(`Invalid Gulid format: ULID must be 26 chars, got ${ulidPart.length}`);
        }
        return new Gulid(prefix, ulidPart);
    }
    get Prefix() {
        return this._prefix;
    }
    get prefix() {
        return this._prefix;
    }
    get ULID() {
        return this._ulid;
    }
    toString() {
        return `${this._prefix}:${this._ulid}`;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return this._prefix === other._prefix && this._ulid === other._ulid;
    }
}
exports.Gulid = Gulid;
//# sourceMappingURL=gulid.js.map