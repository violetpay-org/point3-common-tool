import { TokenExpiresIn, TokenIssuerService, TokenVerificationService } from "./token.service";
export interface TokenServiceKeyOptions {
    aesKey: string;
    hmacKey: string;
}
export interface TokenIssuerServiceOptions extends TokenServiceKeyOptions {
    defaultExpiresIn: TokenExpiresIn;
}
export type TokenIssuingServiceOptions = TokenIssuerServiceOptions;
export type TokenVerificationServiceOptions = TokenServiceKeyOptions;
export declare function createTokenIssuerService(options: TokenIssuerServiceOptions): TokenIssuerService;
export declare const createTokenIssuingService: typeof createTokenIssuerService;
export declare function createTokenVerificationService(options: TokenVerificationServiceOptions): TokenVerificationService;
