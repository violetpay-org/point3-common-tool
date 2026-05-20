"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTokenIssuingService = void 0;
exports.createTokenIssuerService = createTokenIssuerService;
exports.createTokenVerificationService = createTokenVerificationService;
const crypto_1 = require("../crypto");
const token_service_1 = require("./token.service");
function createTokenIssuerService(options) {
    return new token_service_1.TokenService(options.defaultExpiresIn, new crypto_1.CryptoUtil(options.aesKey, options.hmacKey), options.hmacKey);
}
exports.createTokenIssuingService = createTokenIssuerService;
function createTokenVerificationService(options) {
    return new token_service_1.TokenService(undefined, new crypto_1.CryptoUtil(options.aesKey, options.hmacKey), options.hmacKey);
}
//# sourceMappingURL=token.factories.js.map