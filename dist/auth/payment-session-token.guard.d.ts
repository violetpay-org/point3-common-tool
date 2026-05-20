import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Guid } from "../values";
import { TokenVerificationService } from "./token.service";
export interface PaymentSessionTokenPayload {
    sessionId: string | Guid;
    clientId: string | Guid;
    ipAddress: string;
}
export declare abstract class BasePaymentSessionTokenGuard implements CanActivate {
    private readonly paymentSessionTokenService;
    static headerFieldName: string;
    protected constructor(paymentSessionTokenService: TokenVerificationService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getRequestIpAddress;
    private normalizeIpAddress;
    private isPaymentSessionTokenPayload;
}
export declare class PaymentSessionTokenGuard extends BasePaymentSessionTokenGuard {
    constructor(paymentSessionTokenService: TokenVerificationService);
}
