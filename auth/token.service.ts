import { Injectable } from "@nestjs/common";
import jwt, { SignOptions } from "jsonwebtoken";

import { CryptoUtil } from "../crypto";

export type TokenExpiresIn = string | number;

export type TokenPayload = string | Record<string, unknown>;

export abstract class TokenVerificationService {
    abstract encryptToken(token: string): Promise<string>;

    abstract decryptToken(encryptedToken: string): Promise<string>;

    abstract verifyToken(token: string): TokenPayload;
}

export abstract class TokenIssuerService extends TokenVerificationService {
    abstract createToken(payload: object, expiresIn?: TokenExpiresIn): string;
}

export { TokenIssuerService as TokenIssuingService };

@Injectable()
export class TokenService extends TokenIssuerService {
    constructor(
        private readonly defaultJwtExpiresIn: TokenExpiresIn | undefined,
        private readonly cryptoUtil: CryptoUtil,
        private readonly cryptoUtilHmacKey: string,
    ) {
        super();
        if (!cryptoUtil) {
            throw new Error("CryptoUtil is required.");
        }
        if (!cryptoUtilHmacKey || cryptoUtilHmacKey.trim().length === 0) {
            throw new Error("CryptoUtil HMAC key is required.");
        }
    }

    createToken(payload: object, expiresIn = this.defaultJwtExpiresIn): string {
        const options: SignOptions = expiresIn
            ? {
                  expiresIn: expiresIn as SignOptions["expiresIn"],
              }
            : {};
        return jwt.sign(payload, this.signingSecret, options);
    }

    async encryptToken(token: string): Promise<string> {
        const encryptedToken = this.cryptoUtil.encrypt(token);
        if (encryptedToken === null) {
            throw new Error("Token encryption failed.");
        }
        return encryptedToken;
    }

    async decryptToken(encryptedToken: string): Promise<string> {
        const decryptedToken = this.cryptoUtil.decrypt(encryptedToken);
        if (decryptedToken === null) {
            throw new Error("Token decryption failed.");
        }
        return decryptedToken;
    }

    verifyToken(token: string): TokenPayload {
        return jwt.verify(token, this.signingSecret) as TokenPayload;
    }

    private get signingSecret(): string {
        return this.cryptoUtilHmacKey;
    }
}
