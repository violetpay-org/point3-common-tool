"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumber = void 0;
class PhoneNumber {
    constructor(phoneNumber) {
        this.isValid(phoneNumber);
        this.phoneNumber = phoneNumber;
    }
    static create(phoneNumber) {
        return new PhoneNumber(phoneNumber);
    }
    isValid(phoneNumber) {
        if (!phoneNumber) {
            return;
        }
        if (phoneNumber.trim() === '') {
            throw new Error('Phone number cannot be an empty string.');
        }
        if (phoneNumber.split('').some(char => char < '0' || char > '9')) {
            throw new Error('Phone number should contain only digits.');
        }
        if (phoneNumber.length !== 11) {
            throw new Error('Phone number must be 11 digits long.');
        }
        if (!phoneNumber.startsWith('010')) {
            throw new Error('Phone number must start with "010".');
        }
    }
    toString() {
        return this.phoneNumber;
    }
    equal(compare) {
        return this.phoneNumber === compare.toString();
    }
}
exports.PhoneNumber = PhoneNumber;
//# sourceMappingURL=phoneNumber.js.map