import { CryptoUtil } from '../crypto-util';

// 유효한 64 hex char 키 (= 32 bytes)
const validEncKey = 'a'.repeat(64);
const validHmacKey = 'b'.repeat(64);

describe('CryptoUtil', () => {
    let crypto: CryptoUtil;

    beforeEach(() => {
        crypto = new CryptoUtil(validEncKey, validHmacKey);
    });

    describe('constructor', () => {
        it('encKey 길이가 유효하지 않으면 에러를 throw 해야 한다', () => {
            expect(() => new CryptoUtil('a'.repeat(32), validHmacKey)).toThrow(/암호화 키는 정확히 32바이트/);
        });

        it('hmacKey 길이가 유효하지 않으면 에러를 throw 해야 한다', () => {
            expect(() => new CryptoUtil(validEncKey, 'b'.repeat(32))).toThrow(/HMAC 키는 정확히 32바이트/);
        });
    });

    describe('encrypt', () => {
        it('null 입력에 대해 null을 반환해야 한다', () => {
            expect(crypto.encrypt(null)).toBeNull();
        });

        it('빈 문자열 입력에 대해 빈 문자열을 반환해야 한다', () => {
            expect(crypto.encrypt('')).toBe('');
        });

        it('동일한 평문을 암호화해도 매번 다른 암호문을 생성해야 한다 (비결정적 IV)', () => {
            const ciphertext1 = crypto.encrypt('01068554313');
            const ciphertext2 = crypto.encrypt('hello');
            expect(ciphertext1).not.toBe(ciphertext2);
        });
    });

    describe('decrypt', () => {
        it('null 입력에 대해 null을 반환해야 한다', () => {
            expect(crypto.decrypt(null)).toBeNull();
        });

        it('빈 문자열 입력에 대해 빈 문자열을 반환해야 한다', () => {
            expect(crypto.decrypt('')).toBe('');
        });

        it('암호화 후 복호화 시 원본 평문을 반환해야 한다 (round-trip)', () => {
            const plaintext = '테스트 데이터 1234';
            const ciphertext = crypto.encrypt(plaintext)!;
            expect(crypto.decrypt(ciphertext)).toBe(plaintext);
        });

        it('변조된 암호문 복호화 시 에러를 throw 해야 한다', () => {
            const ciphertext = crypto.encrypt('secret')!;
            const tampered = Buffer.from(ciphertext, 'base64');
            const lastIndex = tampered.length - 1;
            tampered[lastIndex] = (tampered[lastIndex]! ^ 1);
            expect(() => crypto.decrypt(tampered.toString('base64'))).toThrow();
        });
    });

    describe('hmac', () => {
        it('null 입력에 대해 null을 반환해야 한다', () => {
            expect(crypto.hmac(null)).toBeNull();
        });

        it('빈 문자열 입력에 대해 빈 문자열을 반환해야 한다', () => {
            expect(crypto.hmac('')).toBe('');
        });

        it('동일한 입력에 대해 항상 동일한 해시를 반환해야 한다 (결정적)', () => {
            const hash1 = crypto.hmac('hello');
            const hash2 = crypto.hmac('hello');
            expect(hash1).toBe(hash2);
        });

        it('64자 hex 문자열을 반환해야 한다', () => {
            const hash = crypto.hmac('hello');
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[0-9a-f]{64}$/);
        });

        it('서로 다른 입력에 대해 서로 다른 해시를 반환해야 한다', () => {
            expect(crypto.hmac('hello')).not.toBe(crypto.hmac('world'));
        });
    });
});
