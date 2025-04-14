"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phoneNumber_1 = require("../phoneNumber");
describe('전화번호 클래스 테스트', () => {
    describe('전화번호 생성', () => {
        it('휴대폰 번호 인스턴스를 생성해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('01012345678');
            expect(phoneNumber.toString()).toBe('01012345678');
            expect(phoneNumber.Type()).toBe(phoneNumber_1.PhoneNumber.Mobile);
        });
        it('서울 지역번호를 가진 유선전화 인스턴스를 생성해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('0212345678');
            expect(phoneNumber.toString()).toBe('0212345678');
            expect(phoneNumber.Type()).toBe(phoneNumber_1.PhoneNumber.Landline);
        });
        it('다른 지역번호를 가진 유선전화 인스턴스를 생성해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('0311234567');
            expect(phoneNumber.toString()).toBe('0311234567');
            expect(phoneNumber.Type()).toBe(phoneNumber_1.PhoneNumber.Landline);
        });
        it('잘못된 전화번호 형식에 대해 에러를 발생시켜야 합니다', () => {
            expect(() => phoneNumber_1.PhoneNumber.create('1234567890')).toThrow('올바르지 않은 형식의 전화번호입니다');
            expect(() => phoneNumber_1.PhoneNumber.create('010123456')).toThrow('올바르지 않은 형식의 전화번호입니다');
            expect(() => phoneNumber_1.PhoneNumber.create('abc1234567')).toThrow('올바르지 않은 형식의 전화번호입니다');
        });
    });
    describe('전화번호 타입 확인', () => {
        it('휴대폰 번호의 타입을 올바르게 반환해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('01012345678');
            expect(phoneNumber.Type()).toBe(phoneNumber_1.PhoneNumber.Mobile);
        });
        it('유선전화 번호의 타입을 올바르게 반환해야 합니다', () => {
            const seoulPhone = phoneNumber_1.PhoneNumber.create('0212345678');
            expect(seoulPhone.Type()).toBe(phoneNumber_1.PhoneNumber.Landline);
            const otherRegionPhone = phoneNumber_1.PhoneNumber.create('0311234567');
            expect(otherRegionPhone.Type()).toBe(phoneNumber_1.PhoneNumber.Landline);
        });
    });
    describe('전화번호 마스킹', () => {
        it('휴대폰 번호를 올바르게 마스킹해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('01012345678');
            expect(phoneNumber.toMaskedString()).toBe('010****5678');
        });
        it('서울 유선전화 번호를 올바르게 마스킹해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('0212345678');
            expect(phoneNumber.toMaskedString()).toBe('02****5678');
        });
        it('다른 지역 유선전화 번호를 올바르게 마스킹해야 합니다', () => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create('0311234567');
            expect(phoneNumber.toMaskedString()).toBe('031****567');
        });
    });
    describe('전화번호 비교', () => {
        it('같은 전화번호를 비교했을 때 true를 반환해야 합니다', () => {
            const phone1 = phoneNumber_1.PhoneNumber.create('01012345678');
            const phone2 = phoneNumber_1.PhoneNumber.create('01012345678');
            expect(phone1.equal(phone2)).toBe(true);
        });
        it('다른 전화번호를 비교했을 때 false를 반환해야 합니다', () => {
            const phone1 = phoneNumber_1.PhoneNumber.create('01012345678');
            const phone2 = phoneNumber_1.PhoneNumber.create('01012345679');
            expect(phone1.equal(phone2)).toBe(false);
        });
        it('같은 번호이지만 타입이 다른 경우 false를 반환해야 합니다', () => {
            const mobile = phoneNumber_1.PhoneNumber.create('01012345678');
            const landline = phoneNumber_1.PhoneNumber.create('0212345678');
            expect(mobile.equal(landline)).toBe(false);
        });
    });
    describe('정적 속성', () => {
        it('Mobile 타입 값이 올바르게 설정되어 있어야 합니다', () => {
            expect(phoneNumber_1.PhoneNumber.Mobile).toBe('mobile');
        });
        it('Landline 타입 값이 올바르게 설정되어 있어야 합니다', () => {
            expect(phoneNumber_1.PhoneNumber.Landline).toBe('landline');
        });
    });
    describe('휴대폰 번호 유효성 검사', () => {
        const validMobileNumbers = [
            '01012345678',
            '01098765432',
            '01011112222',
        ];
        const invalidMobileNumbers = [
            '0101234567',
            '010123456789',
            '02012345678',
            '01112345678',
            '01612345678',
            '01912345678',
            '0101234567a',
            '010-1234-5678',
            '',
            ' ',
            '0000000000',
        ];
        test.each(validMobileNumbers)('유효한 휴대폰 번호를 허용해야 합니다: %s', (number) => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create(number);
            expect(phoneNumber.Type()).toBe(phoneNumber_1.PhoneNumber.Mobile);
        });
        test.each(invalidMobileNumbers)('유효하지 않은 휴대폰 번호를 거부해야 합니다: %s', (number) => {
            expect(() => phoneNumber_1.PhoneNumber.create(number)).toThrow('올바르지 않은 형식의 전화번호입니다');
        });
    });
    describe('유선전화 번호 유효성 검사', () => {
        const validLandlineNumbers = [
            '0212345678',
            '02-1234-5678',
            '0311234567',
            '031-123-4567',
            '0321234567',
            '032-123-4567',
            '0331234567',
            '033-123-4567',
            '0411234567',
            '041-123-4567',
            '0431234567',
            '043-123-4567',
            '0511234567',
            '051-123-4567',
            '0521234567',
            '052-123-4567',
            '0531234567',
            '053-123-4567',
            '0541234567',
            '054-123-4567',
            '0551234567',
            '055-123-4567',
            '0611234567',
            '061-123-4567',
            '0621234567',
            '062-123-4567',
            '0631234567',
            '063-123-4567',
            '0641234567',
            '064-123-4567',
        ];
        const invalidLandlineNumbers = [
            '0012345678',
            '0712345678',
            '0812345678',
            '0912345678',
            '02123456789',
            '021234567',
            '031123456',
            '03112345678',
            '02-123-4567',
            '031-1234-567',
            '02--1234-5678',
            '031---123-4567',
            '02a1234567',
            '031abc4567',
            '',
            ' ',
            '02-',
            '031-',
        ];
        test.each(validLandlineNumbers)('유효한 유선전화 번호를 허용해야 합니다: %s', (number) => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create(number);
            expect(phoneNumber.Type()).toBe(phoneNumber_1.PhoneNumber.Landline);
        });
        test.each(invalidLandlineNumbers)('유효하지 않은 유선전화 번호를 거부해야 합니다: %s', (number) => {
            expect(() => phoneNumber_1.PhoneNumber.create(number)).toThrow('올바르지 않은 형식의 전화번호입니다');
        });
    });
    describe('전화번호 마스킹', () => {
        const maskingTestCases = [
            { input: '01012345678', expected: '010****5678' },
            { input: '01098765432', expected: '010****5432' },
            { input: '0212345678', expected: '02****5678' },
            { input: '02-1234-5678', expected: '02****5678' },
            { input: '0311234567', expected: '031****567' },
            { input: '031-123-4567', expected: '031****567' },
            { input: '0511234567', expected: '051****567' },
            { input: '051-123-4567', expected: '051****567' },
        ];
        test.each(maskingTestCases)('전화번호를 올바르게 마스킹해야 합니다: $input -> $expected', ({ input, expected }) => {
            const phoneNumber = phoneNumber_1.PhoneNumber.create(input);
            expect(phoneNumber.toMaskedString()).toBe(expected);
        });
    });
    describe('전화번호 비교', () => {
        const equalityTestCases = [
            { a: '0212345678', b: '02-1234-5678', expected: true },
            { a: '0311234567', b: '031-123-4567', expected: true },
            { a: '0212345678', b: '0212345679', expected: false },
            { a: '0311234567', b: '0311234568', expected: false },
            { a: '01012345678', b: '0212345678', expected: false },
            { a: '01012345678', b: '0311234567', expected: false },
        ];
        test.each(equalityTestCases)('전화번호 비교가 올바르게 동작해야 합니다', ({ a, b, expected }) => {
            const phoneNumber1 = phoneNumber_1.PhoneNumber.create(a);
            const phoneNumber2 = phoneNumber_1.PhoneNumber.create(b);
            expect(phoneNumber1.equal(phoneNumber2)).toBe(expected);
        });
    });
});
//# sourceMappingURL=phoneNumber.spec.js.map