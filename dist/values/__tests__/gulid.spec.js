"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulid_1 = require("../gulid");
describe('Gulid', () => {
    describe('create', () => {
        it('유효한 prefix로 Gulid 객체가 정상적으로 생성되어야 한다', () => {
            const gulid = gulid_1.Gulid.create('test');
            expect(gulid.prefix).toBe('test');
            expect(typeof gulid.toString()).toBe('string');
            expect(gulid.toString()).toContain('test:');
        });
        it('빈 prefix로 생성하면 예외가 발생해야 한다', () => {
            expect(() => gulid_1.Gulid.create('')).toThrow('Prefix is required');
        });
        it('콜론을 포함한 prefix로 생성하면 예외가 발생해야 한다', () => {
            expect(() => gulid_1.Gulid.create('foo:bar')).toThrow('Prefix must not contain ":"');
        });
    });
    describe('parse', () => {
        it('유효한 Gulid 문자열을 파싱할 수 있어야 한다', () => {
            const gulid = gulid_1.Gulid.create('prefix');
            const str = gulid.toString();
            const parsed = gulid_1.Gulid.parse(str);
            expect(parsed.prefix).toBe('prefix');
            expect(parsed.toString()).toBe(str);
        });
        it('콜론이 없는 문자열을 파싱하면 예외가 발생해야 한다', () => {
            expect(() => gulid_1.Gulid.parse('no-colon')).toThrow('missing ":" separator');
        });
        it('콜론이 여러 개 있는 문자열을 파싱하면 예외가 발생해야 한다', () => {
            expect(() => gulid_1.Gulid.parse('foo:bar:baz:ulidvalue')).toThrow('multiple ":" not allowed');
        });
        it('빈 prefix를 가진 문자열을 파싱하면 예외가 발생해야 한다', () => {
            expect(() => gulid_1.Gulid.parse(':01ARZ3NDEKTSV4RRFFQ69G5FAV')).toThrow('empty prefix');
        });
        it('ULID 길이가 26자가 아니면 예외가 발생해야 한다', () => {
            expect(() => gulid_1.Gulid.parse('prefix:short')).toThrow('ULID must be 26 chars');
        });
        it('Gulid를 문자열로 변환하고 다시 파싱하면 동일한 prefix여야 한다', () => {
            const gulid = gulid_1.Gulid.create('prefix');
            const str = gulid.toString();
            const parsed = gulid_1.Gulid.parse(str);
            expect(parsed.prefix).toBe('prefix');
            expect(parsed.toString()).toBe(str);
        });
    });
    describe('Prefix', () => {
        it('Prefix getter는 prefix를 반환해야 한다', () => {
            const gulid = gulid_1.Gulid.create('myprefix');
            expect(gulid.Prefix).toBe('myprefix');
        });
        it('Prefix getter는 대문자 P로 접근할 수 있어야 한다', () => {
            const gulid = gulid_1.Gulid.create('test');
            expect(gulid.Prefix).toBeDefined();
            expect(typeof gulid.Prefix).toBe('string');
        });
    });
    describe('prefix', () => {
        it('prefix getter는 backward compatibility를 위해 작동해야 한다', () => {
            const gulid = gulid_1.Gulid.create('legacy');
            expect(gulid.prefix).toBe('legacy');
        });
    });
    describe('ULID', () => {
        it('ULID getter는 26자의 ULID 값을 반환해야 한다', () => {
            const gulid = gulid_1.Gulid.create('test');
            expect(gulid.ULID).toBeDefined();
            expect(typeof gulid.ULID).toBe('string');
            expect(gulid.ULID.length).toBe(26);
        });
        it('ULID getter는 toString에서 콜론 이후의 값과 동일해야 한다', () => {
            const gulid = gulid_1.Gulid.create('prefix');
            const str = gulid.toString();
            const ulidPart = str.split(':')[1];
            expect(gulid.ULID).toBe(ulidPart);
        });
    });
    describe('equals', () => {
        it('동일한 인스턴스는 equals에서 true를 반환해야 한다', () => {
            const gulid = gulid_1.Gulid.create('test');
            expect(gulid.equals(gulid)).toBe(true);
        });
        it('동일한 값을 가진 다른 인스턴스는 equals에서 true를 반환해야 한다', () => {
            const str = gulid_1.Gulid.create('test').toString();
            const gulid1 = gulid_1.Gulid.parse(str);
            const gulid2 = gulid_1.Gulid.parse(str);
            expect(gulid1.equals(gulid2)).toBe(true);
        });
        it('다른 prefix를 가진 Gulid는 equals에서 false를 반환해야 한다', () => {
            const gulid1 = gulid_1.Gulid.create('prefix1');
            const gulid2 = gulid_1.Gulid.create('prefix2');
            expect(gulid1.equals(gulid2)).toBe(false);
        });
        it('다른 ULID를 가진 Gulid는 equals에서 false를 반환해야 한다', () => {
            const gulid1 = gulid_1.Gulid.create('same');
            const gulid2 = gulid_1.Gulid.create('same');
            expect(gulid1.equals(gulid2)).toBe(false);
        });
        it('null과 비교하면 equals에서 false를 반환해야 한다', () => {
            const gulid = gulid_1.Gulid.create('test');
            expect(gulid.equals(null)).toBe(false);
        });
        it('undefined와 비교하면 equals에서 false를 반환해야 한다', () => {
            const gulid = gulid_1.Gulid.create('test');
            expect(gulid.equals(undefined)).toBe(false);
        });
    });
});
//# sourceMappingURL=gulid.spec.js.map