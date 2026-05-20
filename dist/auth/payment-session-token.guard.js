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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSessionTokenGuard = exports.BasePaymentSessionTokenGuard = void 0;
const common_1 = require("@nestjs/common");
const net_1 = require("net");
const values_1 = require("../values");
const token_service_1 = require("./token.service");
const token_tokens_1 = require("./token.tokens");
class BasePaymentSessionTokenGuard {
    constructor(paymentSessionTokenService) {
        this.paymentSessionTokenService = paymentSessionTokenService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const paymentSessionTokenHeader = request.headers[BasePaymentSessionTokenGuard.headerFieldName.toLowerCase()];
        const paymentSessionToken = Array.isArray(paymentSessionTokenHeader)
            ? paymentSessionTokenHeader[0]
            : paymentSessionTokenHeader;
        if (!paymentSessionToken) {
            throw new common_1.UnauthorizedException("결제 세션 토큰이 없습니다.");
        }
        try {
            const verifiedPayload = this.paymentSessionTokenService.verifyToken(paymentSessionToken);
            if (!this.isPaymentSessionTokenPayload(verifiedPayload)) {
                throw new common_1.UnauthorizedException("결제 세션 토큰 payload가 유효하지 않습니다.");
            }
            const requestIpAddress = this.getRequestIpAddress(request);
            if (!requestIpAddress) {
                throw new common_1.UnauthorizedException("요청 IP를 확인할 수 없습니다.");
            }
            if (verifiedPayload.ipAddress !== requestIpAddress) {
                throw new common_1.UnauthorizedException("결제 세션 토큰의 IP와 요청 IP가 일치하지 않습니다.");
            }
            Object.assign(request, {
                sessionId: values_1.Guid.parse(verifiedPayload.sessionId),
                clientId: values_1.Guid.parse(verifiedPayload.clientId),
                ipAddress: verifiedPayload.ipAddress,
            });
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException("결제 세션 토큰이 유효하지 않습니다.");
        }
        return true;
    }
    getRequestIpAddress(request) {
        return this.normalizeIpAddress(request.ip ?? request.socket.remoteAddress ?? "");
    }
    normalizeIpAddress(ipAddress) {
        const normalized = ipAddress.trim().toLowerCase();
        if (normalized.startsWith("::ffff:")) {
            const ipv4 = normalized.slice("::ffff:".length);
            return (0, net_1.isIP)(ipv4) === 4 ? ipv4 : normalized;
        }
        return normalized;
    }
    isPaymentSessionTokenPayload(payload) {
        if (typeof payload !== "object" || payload === null)
            return false;
        const record = payload;
        return (typeof record.sessionId === "string" &&
            record.sessionId.length > 0 &&
            typeof record.clientId === "string" &&
            record.clientId.length > 0 &&
            typeof record.ipAddress === "string" &&
            record.ipAddress.length > 0);
    }
}
exports.BasePaymentSessionTokenGuard = BasePaymentSessionTokenGuard;
BasePaymentSessionTokenGuard.headerFieldName = "X-Point3-Payment-Token";
let PaymentSessionTokenGuard = class PaymentSessionTokenGuard extends BasePaymentSessionTokenGuard {
    constructor(paymentSessionTokenService) {
        super(paymentSessionTokenService);
    }
};
exports.PaymentSessionTokenGuard = PaymentSessionTokenGuard;
exports.PaymentSessionTokenGuard = PaymentSessionTokenGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_tokens_1.PaymentSessionTokenServiceToken)),
    __metadata("design:paramtypes", [token_service_1.TokenVerificationService])
], PaymentSessionTokenGuard);
//# sourceMappingURL=payment-session-token.guard.js.map