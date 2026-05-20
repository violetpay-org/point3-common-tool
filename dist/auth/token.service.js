"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = exports.TokenIssuingService = exports.TokenIssuerService = exports.TokenVerificationService = void 0;
const common_1 = require("@nestjs/common");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("../crypto");
class TokenVerificationService {
}
exports.TokenVerificationService = TokenVerificationService;
class TokenIssuerService extends TokenVerificationService {
}
exports.TokenIssuerService = TokenIssuerService;
exports.TokenIssuingService = TokenIssuerService;
let TokenService = class TokenService extends TokenIssuerService {
    constructor(defaultJwtExpiresIn, cryptoUtil, cryptoUtilHmacKey) {
        super();
        this.defaultJwtExpiresIn = defaultJwtExpiresIn;
        this.cryptoUtil = cryptoUtil;
        this.cryptoUtilHmacKey = cryptoUtilHmacKey;
        if (!cryptoUtil) {
            throw new Error("CryptoUtil is required.");
        }
        if (!cryptoUtilHmacKey || cryptoUtilHmacKey.trim().length === 0) {
            throw new Error("CryptoUtil HMAC key is required.");
        }
    }
    createToken(payload, expiresIn = this.defaultJwtExpiresIn) {
        const options = expiresIn
            ? {
                expiresIn: expiresIn,
            }
            : {};
        return jsonwebtoken_1.default.sign(payload, this.signingSecret, options);
    }
    async encryptToken(token) {
        const encryptedToken = this.cryptoUtil.encrypt(token);
        if (encryptedToken === null) {
            throw new Error("Token encryption failed.");
        }
        return encryptedToken;
    }
    async decryptToken(encryptedToken) {
        const decryptedToken = this.cryptoUtil.decrypt(encryptedToken);
        if (decryptedToken === null) {
            throw new Error("Token decryption failed.");
        }
        return decryptedToken;
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, this.signingSecret);
    }
    get signingSecret() {
        return this.cryptoUtilHmacKey;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, crypto_1.CryptoUtil, String])
], TokenService);
//# sourceMappingURL=token.service.js.map