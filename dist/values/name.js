"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Name = void 0;
class Name {
    constructor(_name) {
        this._name = _name;
        this._name = _name;
    }
    static create(name) {
        return new Name(name);
    }
    toString() {
        return this._name;
    }
    equals(name) {
        return this._name === name._name;
    }
    get Masked() {
        const len = this._name.length;
        if (len === 2) {
            return (this._name[0] + '*');
        }
        else if (len === 3) {
            return (this._name[0] + '*' + this._name[2]);
        }
        else if (len > 3) {
            return (this._name.slice(0, 2) + '*' + this._name.slice(-1));
        }
        else {
            return this._name;
        }
    }
}
exports.Name = Name;
//# sourceMappingURL=name.js.map