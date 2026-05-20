import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { isIP } from "net";

import { Guid } from "../values";
import { TokenVerificationService } from "./token.service";
import { PaymentSessionTokenServiceToken } from "./token.tokens";

type HeaderValue = string | string[] | undefined;

interface HttpRequestLike {
    headers: Record<string, HeaderValue>;
    ip?: string;
    socket: {
        remoteAddress?: string;
    };
}

export interface PaymentSessionTokenPayload {
    sessionId: string | Guid;
    clientId: string | Guid;
    ipAddress: string;
}

interface VerifiedPaymentSessionTokenPayload {
    sessionId: string;
    clientId: string;
    ipAddress: string;
}

export abstract class BasePaymentSessionTokenGuard implements CanActivate {
    static headerFieldName: string = "X-Point3-Payment-Token";

    protected constructor(
        private readonly paymentSessionTokenService: TokenVerificationService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<HttpRequestLike & Partial<PaymentSessionTokenPayload>>();
        const paymentSessionTokenHeader =
            request.headers[
                BasePaymentSessionTokenGuard.headerFieldName.toLowerCase()
            ];
        const paymentSessionToken = Array.isArray(paymentSessionTokenHeader)
            ? paymentSessionTokenHeader[0]
            : paymentSessionTokenHeader;
        if (!paymentSessionToken) {
            throw new UnauthorizedException("결제 세션 토큰이 없습니다.");
        }
        try {
            const verifiedPayload =
                this.paymentSessionTokenService.verifyToken(
                    paymentSessionToken,
                );
            if (!this.isPaymentSessionTokenPayload(verifiedPayload)) {
                throw new UnauthorizedException(
                    "결제 세션 토큰 payload가 유효하지 않습니다.",
                );
            }

            const requestIpAddress = this.getRequestIpAddress(request);
            if (!requestIpAddress) {
                throw new UnauthorizedException(
                    "요청 IP를 확인할 수 없습니다.",
                );
            }
            if (verifiedPayload.ipAddress !== requestIpAddress) {
                throw new UnauthorizedException(
                    "결제 세션 토큰의 IP와 요청 IP가 일치하지 않습니다.",
                );
            }

            Object.assign(request, {
                sessionId: Guid.parse(verifiedPayload.sessionId),
                clientId: Guid.parse(verifiedPayload.clientId),
                ipAddress: verifiedPayload.ipAddress,
            } satisfies PaymentSessionTokenPayload);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException(
                "결제 세션 토큰이 유효하지 않습니다.",
            );
        }
        return true;
    }

    private getRequestIpAddress(request: HttpRequestLike): string {
        return this.normalizeIpAddress(
            request.ip ?? request.socket.remoteAddress ?? "",
        );
    }

    private normalizeIpAddress(ipAddress: string): string {
        const normalized = ipAddress.trim().toLowerCase();
        if (normalized.startsWith("::ffff:")) {
            const ipv4 = normalized.slice("::ffff:".length);
            return isIP(ipv4) === 4 ? ipv4 : normalized;
        }

        return normalized;
    }

    private isPaymentSessionTokenPayload(
        payload: unknown,
    ): payload is VerifiedPaymentSessionTokenPayload {
        if (typeof payload !== "object" || payload === null) return false;

        const record = payload as Record<string, unknown>;
        return (
            typeof record.sessionId === "string" &&
            record.sessionId.length > 0 &&
            typeof record.clientId === "string" &&
            record.clientId.length > 0 &&
            typeof record.ipAddress === "string" &&
            record.ipAddress.length > 0
        );
    }
}

@Injectable()
export class PaymentSessionTokenGuard extends BasePaymentSessionTokenGuard {
    constructor(
        @Inject(PaymentSessionTokenServiceToken)
        paymentSessionTokenService: TokenVerificationService,
    ) {
        super(paymentSessionTokenService);
    }
}
