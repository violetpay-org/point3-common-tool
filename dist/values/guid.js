"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guid = void 0;
const uuid_1 = require("uuid");
class Guid {
    constructor(prefix, uuid) {
        if (prefix.includes('-')) {
            throw new Error('Prefix should not contain "-"');
        }
        this.prefix = prefix;
        this.uuid = uuid;
    }
    toString() {
        return this.prefix + '-' + this.uuid;
    }
    static parse(guid) {
        const sectionedId = guid.split('-');
        if (sectionedId.length !== 6) {
            throw new Error('Invalid Guid');
        }
        const prefix = sectionedId[0];
        const uuid = sectionedId.slice(1).join('-');
        return new Guid(prefix, uuid);
    }
    static create(prefix) {
        const hash = (0, uuid_1.v7)();
        if (prefix.includes('-')) {
            throw new Error('Prefix should not contain "-"');
        }
        return new Guid(prefix, hash);
    }
    equals(other) {
        return ((this.prefix + '-' + this.uuid) === other.toString());
    }
}
exports.Guid = Guid;
//# sourceMappingURL=guid.js.map