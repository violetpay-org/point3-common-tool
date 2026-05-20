import { CryptoUtil } from "../crypto";
export type TokenExpiresIn = string | number;
export type TokenPayload = string | Record<string, unknown>;
export declare abstract class TokenVerificationService {
    abstract encryptToken(token: string): Promise<string>;
    abstract decryptToken(encryptedToken: string): Promise<string>;
    abstract verifyToken(token: string): TokenPayload;
}
export declare abstract class TokenIssuerService extends TokenVerificationService {
    abstract createToken(payload: object, expiresIn?: TokenExpiresIn): string;
}
export { TokenIssuerService as TokenIssuingService };
export declare class TokenService extends TokenIssuerService {
    private readonly defaultJwtExpiresIn;
    private readonly cryptoUtil;
    private readonly cryptoUtilHmacKey;
    constructor(defaultJwtExpiresIn: TokenExpiresIn | undefined, cryptoUtil: CryptoUtil, cryptoUtilHmacKey: string);
    createToken(payload: object, expiresIn?: TokenExpiresIn): string;
    encryptToken(token: string): Promise<string>;
    decryptToken(encryptedToken: string): Promise<string>;
    verifyToken(token: string): TokenPayload;
    private get signingSecret();
}
