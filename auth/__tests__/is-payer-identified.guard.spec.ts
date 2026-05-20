import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

import {
    BaseIsPayerIdentifiedGuard,
    IsPayerIdentified,
} from "../is-payer-identified.guard";
import { IdentificationTokenPayload } from "../payloads";
import { TokenVerificationService } from "../token.service";

interface TestRequest extends Partial<IdentificationTokenPayload> {
    headers: Record<string, string>;
}

class TestIsPayerIdentifiedGuard extends BaseIsPayerIdentifiedGuard {
    constructor(tokenService: TokenVerificationService) {
        super(tokenService);
    }
}

describe("BaseIsPayerIdentifiedGuard", () => {
    let tokenService: jest.Mocked<TokenVerificationService>;
    let guard: TestIsPayerIdentifiedGuard;

    beforeEach(() => {
        tokenService = {
            decryptToken: jest.fn(),
            encryptToken: jest.fn(),
            verifyToken: jest.fn(),
        };
        guard = new TestIsPayerIdentifiedGuard(tokenService);
    });

    function createRequest(token?: string): TestRequest {
        return {
            headers: token
                ? {
                      [
                          IsPayerIdentified.headerFieldName.toLowerCase()
                      ]: token,
                  }
                : {},
        };
    }

    function createExecutionContext(request: TestRequest): ExecutionContext {
        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        } as unknown as ExecutionContext;
    }

    it("allows requests without an identification token", async () => {
        const request = createRequest();

        const result = await guard.canActivate(createExecutionContext(request));

        expect(result).toBe(true);
        expect(tokenService.verifyToken).not.toHaveBeenCalled();
    });

    it("attaches verified identification payload to the request", async () => {
        const request = createRequest("identification-token");
        tokenService.verifyToken.mockReturnValue({
            attribute: "phoneNumber",
            value: "a".repeat(32),
        });

        const result = await guard.canActivate(createExecutionContext(request));

        expect(result).toBe(true);
        expect(request.attribute).toBe("phoneNumber");
        expect(request.value?.toString()).toBe("a".repeat(32));
    });

    it("rejects invalid identification tokens", async () => {
        const request = createRequest("invalid-identification-token");
        tokenService.verifyToken.mockImplementation(() => {
            throw new Error("invalid token");
        });

        await expect(
            guard.canActivate(createExecutionContext(request)),
        ).rejects.toThrow(new UnauthorizedException("유효한 토큰이 아닙니다."));
    });
});
