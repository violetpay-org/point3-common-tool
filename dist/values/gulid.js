"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gulid = void 0;
const ulid_1 = require("ulid");
class Gulid {
    constructor(prefix, value) {
        this._prefix = prefix;
        this._value = value;
    }
    static create(prefix) {
        return new Gulid(prefix ?? '', (0, ulid_1.ulid)());
    }
    static parse(id) {
        const lastColonIndex = id.lastIndexOf(':');
        const prefix = id.substring(0, lastColonIndex);
        const value = id.substring(lastColonIndex + 1);
        return new Gulid(prefix, value);
    }
    get prefix() {
        return this._prefix;
    }
    toString() {
        return `${this._prefix}:${this._value}`;
    }
}
exports.Gulid = Gulid;
//# sourceMappingURL=gulid.js.map