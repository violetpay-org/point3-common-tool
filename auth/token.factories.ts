import { CryptoUtil } from "../crypto";
import {
    TokenExpiresIn,
    TokenIssuerService,
    TokenService,
    TokenVerificationService,
} from "./token.service";

export interface TokenServiceKeyOptions {
    aesKey: string;
    hmacKey: string;
}

export interface TokenIssuerServiceOptions extends TokenServiceKeyOptions {
    defaultExpiresIn: TokenExpiresIn;
}

export type TokenIssuingServiceOptions = TokenIssuerServiceOptions;

export type TokenVerificationServiceOptions = TokenServiceKeyOptions;

export function createTokenIssuerService(
    options: TokenIssuerServiceOptions,
): TokenIssuerService {
    return new TokenService(
        options.defaultExpiresIn,
        new CryptoUtil(options.aesKey, options.hmacKey),
        options.hmacKey,
    );
}

export const createTokenIssuingService = createTokenIssuerService;

export function createTokenVerificationService(
    options: TokenVerificationServiceOptions,
): TokenVerificationService {
    return new TokenService(
        undefined,
        new CryptoUtil(options.aesKey, options.hmacKey),
        options.hmacKey,
    );
}
