"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumber = void 0;
class PhoneNumber {
    constructor(phoneNumber) {
        if (this.isMobile(phoneNumber))
            this.phoneNumberType = "mobile";
        else if (this.isLandline(phoneNumber))
            this.phoneNumberType = "landline";
        else
            throw new Error(`올바르지 않은 형식의 전화번호입니다.\n입력값: ${phoneNumber}`);
        this.phoneNumber = phoneNumber;
    }
    static create(phoneNumber) {
        return new PhoneNumber(phoneNumber);
    }
    static get Mobile() {
        return "mobile";
    }
    static get Landline() {
        return "landline";
    }
    isMobile(phoneNumber) {
        if (!phoneNumber) {
            return false;
        }
        if (phoneNumber.trim() === '') {
            return false;
        }
        if (phoneNumber.split('').some(char => char < '0' || char > '9')) {
            return false;
        }
        if (phoneNumber.length !== 11) {
            return false;
        }
        if (!phoneNumber.startsWith('010')) {
            return false;
        }
        return true;
    }
    isLandline(phoneNumber) {
        if (!phoneNumber) {
            return false;
        }
        if (phoneNumber.trim() === '') {
            return false;
        }
        const normalizedNumber = phoneNumber.replace(/-/g, '');
        const areaCodePatterns = [
            /^02\d{8}$/,
            /^0[3-6]\d{8}$/,
        ];
        const isValid = areaCodePatterns.some(pattern => pattern.test(normalizedNumber));
        if (isValid) {
            if (phoneNumber.includes('-')) {
                const parts = phoneNumber.split('-');
                if (parts[0] === '02') {
                    return parts.length === 3 && parts[1].length === 4 && parts[2].length === 4;
                }
                else {
                    return parts.length === 3 && parts[1].length === 3 && parts[2].length === 4;
                }
            }
            return true;
        }
        return false;
    }
    Type() {
        return this.phoneNumberType;
    }
    toString() {
        return this.phoneNumber.replace(/-/g, '');
    }
    toMaskedString() {
        const normalizedNumber = this.toString();
        if (this.phoneNumberType === PhoneNumber.Mobile) {
            const prefix = normalizedNumber.substring(0, 3);
            const suffix = normalizedNumber.substring(7);
            return `${prefix}****${suffix}`;
        }
        else {
            if (normalizedNumber.startsWith('02')) {
                const prefix = normalizedNumber.substring(0, 2);
                const suffix = normalizedNumber.substring(6);
                return `${prefix}****${suffix}`;
            }
            else {
                const prefix = normalizedNumber.substring(0, 3);
                const suffix = normalizedNumber.substring(7);
                return `${prefix}****${suffix}`;
            }
        }
    }
    equal(compare) {
        return this.toString() === compare.toString() && this.phoneNumberType === compare.phoneNumberType;
    }
}
exports.PhoneNumber = PhoneNumber;
//# sourceMappingURL=phoneNumber.js.map