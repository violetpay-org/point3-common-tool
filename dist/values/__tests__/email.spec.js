"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const email_1 = require("../email");
describe('Email', () => {
    it('유효한 이메일로 생성되어야 한다', () => {
        const email = email_1.Email.create('test@example.com');
        expect(email.toString()).toBe('test@example.com');
    });
    it('유효하지 않은 이메일로 생성 시 예외가 발생해야 한다', () => {
        expect(() => email_1.Email.create('invalid-email')).toThrow();
        expect(() => email_1.Email.create('test@.com')).toThrow();
        expect(() => email_1.Email.create('test@com')).toThrow();
    });
    it('동일한 이메일은 equals가 true여야 한다', () => {
        const email1 = email_1.Email.create('test@example.com');
        const email2 = email_1.Email.create('test@example.com');
        expect(email1.equals(email2)).toBe(true);
    });
    it('다른 이메일은 equals가 false여야 한다', () => {
        const email1 = email_1.Email.create('test1@example.com');
        const email2 = email_1.Email.create('test2@example.com');
        expect(email1.equals(email2)).toBe(false);
    });
    it('Provider는 @ 뒤의 도메인을 반환해야 한다', () => {
        const email = email_1.Email.create('user@domain.com');
        expect(email.Provider).toBe('domain.com');
    });
});
//# sourceMappingURL=email.spec.js.map