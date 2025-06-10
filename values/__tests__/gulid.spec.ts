import { Gulid } from '../gulid';

describe('Gulid', () => {
    it('Gulid 객체가 정상적으로 생성되어야 한다', () => {
        const gulid = Gulid.create('test');
        expect(gulid.prefix).toBe('test');
        expect(typeof gulid.toString()).toBe('string');
        expect(gulid.toString()).toContain('test:');
    });

    it('Gulid를 문자열로 변환하고 다시 파싱하면 동일한 prefix여야 한다', () => {
        const gulid = Gulid.create('prefix');
        const str = gulid.toString();
        const parsed = Gulid.parse(str);
        expect(parsed.prefix).toBe('prefix');
        expect(parsed.toString()).toBe(str);
    });

    it('콜론이 여러 개 있는 경우 마지막 콜론을 기준으로 prefix와 value를 분리해야 한다', () => {
        const str = 'foo:bar:baz:ulidvalue';
        const gulid = Gulid.parse(str);
        expect(gulid.prefix).toBe('foo:bar:baz');
        expect(gulid.toString()).toBe(str);
    });
}); 