import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

export const CryptoUtilToken = Symbol.for("CryptoUtil");

/**
 * 데이터베이스 필드 수준 암호화/복호화 및 HMAC 유틸리티 클래스.
 * nullable DB 컬럼을 지원하기 위해 null/빈 문자열 입력을 그대로 반환(패스스루)한다.
 * NestJS DI와 독립적인 순수 클래스로, 키는 hex 인코딩 문자열로 주입받는다.
 */
export class CryptoUtil {
    private static readonly KEY_LENGTH = 32;
    private static readonly IV_LENGTH = 12;
    private static readonly AUTH_TAG_LENGTH = 16;
    private static readonly ALGORITHM = 'aes-256-gcm';

    private readonly encKey: Buffer;
    private readonly hmacKey: Buffer;

    constructor(encKey: string, hmacKey: string) {
        const encKeyBuffer = Buffer.from(encKey, 'hex');
        if (encKeyBuffer.length !== CryptoUtil.KEY_LENGTH) {
            throw new Error(
                `암호화 키는 정확히 ${CryptoUtil.KEY_LENGTH}바이트(64 hex chars)여야 합니다. 현재: ${encKeyBuffer.length}바이트`,
            );
        }

        const hmacKeyBuffer = Buffer.from(hmacKey, 'hex');
        if (hmacKeyBuffer.length !== CryptoUtil.KEY_LENGTH) {
            throw new Error(
                `HMAC 키는 정확히 ${CryptoUtil.KEY_LENGTH}바이트(64 hex chars)여야 합니다. 현재: ${hmacKeyBuffer.length}바이트`,
            );
        }

        this.encKey = encKeyBuffer;
        this.hmacKey = hmacKeyBuffer;
    }

    /**
     * 문자열을 AES-256-GCM으로 암호화한다.
     * - null → null 반환 (패스스루)
     * - 빈 문자열('') → '' 반환 (패스스루)
     * - 유효한 문자열 → Base64 인코딩된 암호문 반환
     *   Binary layout: [IV 12bytes][AuthTag 16bytes][Encrypted]
     */
    encrypt(plaintext: string | null): string | null {
        if (plaintext === null) return null;
        if (plaintext === '') return '';

        const iv = randomBytes(CryptoUtil.IV_LENGTH);
        const cipher = createCipheriv(CryptoUtil.ALGORITHM, this.encKey, iv);

        let encrypted = cipher.update(Buffer.from(plaintext, 'utf8'));
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    }

    /**
     * AES-256-GCM 암호문을 복호화한다.
     * - null → null 반환 (패스스루)
     * - 빈 문자열('') → '' 반환 (패스스루)
     * - 유효한 Base64 → 원본 평문 반환
     * - 변조된 데이터 → 에러 throw
     */
    decrypt(ciphertext: string | null): string | null {
        if (ciphertext === null) return null;
        if (ciphertext === '') return '';

        const combined = Buffer.from(ciphertext, 'base64');
        const iv = combined.subarray(0, CryptoUtil.IV_LENGTH);
        const authTag = combined.subarray(
            CryptoUtil.IV_LENGTH,
            CryptoUtil.IV_LENGTH + CryptoUtil.AUTH_TAG_LENGTH,
        );
        const encrypted = combined.subarray(CryptoUtil.IV_LENGTH + CryptoUtil.AUTH_TAG_LENGTH);

        const decipher = createDecipheriv(CryptoUtil.ALGORITHM, this.encKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }

    /**
     * HMAC-SHA256 해시를 생성한다. 검색용 결정적(deterministic) 인덱스에 활용.
     * - null → null 반환 (패스스루)
     * - 빈 문자열('') → '' 반환 (패스스루)
     * - 유효한 문자열 → 64자 hex string 반환
     */
    hmac(plaintext: string | null): string | null {
        if (plaintext === null) return null;
        if (plaintext === '') return '';

        return createHmac('sha256', this.hmacKey).update(plaintext).digest('hex');
    }
}
