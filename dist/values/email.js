"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
class Email {
    constructor(_email) {
        this._email = _email;
        this._email = _email;
    }
    toString() {
        return this._email;
    }
    equals(email) {
        return this._email === email._email;
    }
    get Provider() {
        return this._email.split('@')[1];
    }
    static create(email) {
        if (!this.isValid(email))
            throw new Error('Invalid email');
        return new Email(email);
    }
    static isValid(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}
exports.Email = Email;
//# sourceMappingURL=email.js.map