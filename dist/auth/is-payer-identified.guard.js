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
exports.IsPayerIdentified = exports.BaseIsPayerIdentifiedGuard = void 0;
const common_1 = require("@nestjs/common");
const values_1 = require("../values");
const token_service_1 = require("./token.service");
const token_tokens_1 = require("./token.tokens");
class BaseIsPayerIdentifiedGuard {
    constructor(tokenService) {
        this.tokenService = tokenService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const identificationTokenHeader = request.headers[BaseIsPayerIdentifiedGuard.headerFieldName.toLowerCase()];
        const identificationToken = Array.isArray(identificationTokenHeader)
            ? identificationTokenHeader[0]
            : identificationTokenHeader;
        if (!identificationToken) {
            return true;
        }
        try {
            const payload = this.tokenService.verifyToken(identificationToken);
            if (payload.value) {
                payload.value = values_1.Checksum.from(payload.value.toString());
            }
            Object.assign(request, payload);
            return true;
        }
        catch (error) {
            throw new common_1.UnauthorizedException("유효한 토큰이 아닙니다.");
        }
    }
}
exports.BaseIsPayerIdentifiedGuard = BaseIsPayerIdentifiedGuard;
BaseIsPayerIdentifiedGuard.headerFieldName = "Point3-Identification-Token";
let IsPayerIdentified = class IsPayerIdentified extends BaseIsPayerIdentifiedGuard {
    constructor(tokenService) {
        super(tokenService);
    }
};
exports.IsPayerIdentified = IsPayerIdentified;
exports.IsPayerIdentified = IsPayerIdentified = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(token_tokens_1.IdentificationTokenServiceToken)),
    __metadata("design:paramtypes", [token_service_1.TokenVerificationService])
], IsPayerIdentified);
//# sourceMappingURL=is-payer-identified.guard.js.map