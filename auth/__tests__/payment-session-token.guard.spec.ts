import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

import {
    BasePaymentSessionTokenGuard,
    PaymentSessionTokenPayload,
} from "../payment-session-token.guard";
import { TokenVerificationService } from "../token.service";
import { Guid } from "../../values";

interface TestRequest extends Partial<PaymentSessionTokenPayload> {
    headers: Record<string, string>;
    ip?: string;
    socket: {
        remoteAddress?: string;
    };
}

class TestPaymentSessionTokenGuard extends BasePaymentSessionTokenGuard {
    constructor(tokenService: TokenVerificationService) {
        super(tokenService);
    }
}

describe("BasePaymentSessionTokenGuard", () => {
    let tokenService: jest.Mocked<TokenVerificationService>;
    let guard: TestPaymentSessionTokenGuard;

    beforeEach(() => {
        tokenService = {
            decryptToken: jest.fn(),
            encryptToken: jest.fn(),
            verifyToken: jest.fn(),
        };
        guard = new TestPaymentSessionTokenGuard(tokenService);
    });

    function createRequest(
        token: string,
        ipAddress = "203.0.113.42",
    ): TestRequest {
        return {
            headers: {
                [
                    BasePaymentSessionTokenGuard.headerFieldName.toLowerCase()
                ]: token,
            },
            ip: ipAddress,
            socket: {
                remoteAddress: "127.0.0.1",
            },
        };
    }

    function createExecutionContext(request: TestRequest): ExecutionContext {
        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;
    }

    function createVerifiedPayload(ipAddress: string) {
        return {
            sessionId: Guid.create("pymt_sess").toString(),
            clientId: Guid.create("client").toString(),
            ipAddress,
        };
    }

    it("injects verified payload when token IP matches request IP", async () => {
        const token = "payment-session-token";
        const request = createRequest(token);
        const verifiedPayload = createVerifiedPayload("203.0.113.42");
        tokenService.verifyToken.mockReturnValue(verifiedPayload);

        const result = await guard.canActivate(createExecutionContext(request));

        expect(result).toBe(true);
        expect(request.sessionId?.toString()).toBe(verifiedPayload.sessionId);
        expect(request.clientId?.toString()).toBe(verifiedPayload.clientId);
        expect(request.ipAddress).toBe("203.0.113.42");
    });

    it("rejects when token IP differs from request IP", async () => {
        const token = "payment-session-token";
        const request = createRequest(token, "198.51.100.10");
        tokenService.verifyToken.mockReturnValue(
            createVerifiedPayload("203.0.113.42"),
        );

        await expect(
            guard.canActivate(createExecutionContext(request)),
        ).rejects.toThrow(
            new UnauthorizedException(
                "결제 세션 토큰의 IP와 요청 IP가 일치하지 않습니다.",
            ),
        );
    });

    it("uses Express request.ip instead of raw X-Forwarded-For", async () => {
        const token = "payment-session-token";
        const request = createRequest(token);
        request.headers["x-forwarded-for"] = "198.51.100.10, 203.0.113.42";
        tokenService.verifyToken.mockReturnValue(
            createVerifiedPayload("203.0.113.42"),
        );

        const result = await guard.canActivate(createExecutionContext(request));

        expect(result).toBe(true);
        expect(request.ipAddress).toBe("203.0.113.42");
    });

    it("falls back to socket remoteAddress when request.ip is unavailable", async () => {
        const token = "payment-session-token";
        const request = createRequest(token);
        request.ip = undefined;
        request.socket.remoteAddress = "198.51.100.10";
        tokenService.verifyToken.mockReturnValue(
            createVerifiedPayload("198.51.100.10"),
        );

        const result = await guard.canActivate(createExecutionContext(request));

        expect(result).toBe(true);
        expect(request.ipAddress).toBe("198.51.100.10");
    });

    it("normalizes IPv4-mapped IPv6 addresses", async () => {
        const token = "payment-session-token";
        const request = createRequest(token, "::ffff:203.0.113.42");
        tokenService.verifyToken.mockReturnValue(
            createVerifiedPayload("203.0.113.42"),
        );

        const result = await guard.canActivate(createExecutionContext(request));

        expect(result).toBe(true);
        expect(request.ipAddress).toBe("203.0.113.42");
    });
});
