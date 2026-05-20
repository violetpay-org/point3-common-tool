import {
    createIsPayerIdentifiedGuardProvider,
    createPaymentSessionTokenGuardProvider,
} from "../guard.providers";
import { IsPayerIdentified } from "../is-payer-identified.guard";
import { PaymentSessionTokenGuard } from "../payment-session-token.guard";
import { TokenVerificationService } from "../token.service";
import {
    IdentificationTokenServiceToken,
    PaymentSessionTokenServiceToken,
} from "../token.tokens";

function createTokenService(): jest.Mocked<TokenVerificationService> {
    return {
        decryptToken: jest.fn(),
        encryptToken: jest.fn(),
        verifyToken: jest.fn(),
    };
}

describe("auth guard providers", () => {
    it("provides PaymentSessionTokenGuard with the payment-session token service", async () => {
        const provider = createPaymentSessionTokenGuardProvider();
        const tokenService = createTokenService();

        const guard = await provider.useFactory(tokenService);

        expect(provider.provide).toBe(PaymentSessionTokenGuard);
        expect(provider.inject).toEqual([PaymentSessionTokenServiceToken]);
        expect(guard).toBeInstanceOf(PaymentSessionTokenGuard);
    });

    it("provides IsPayerIdentified with the identification token service", async () => {
        const provider = createIsPayerIdentifiedGuardProvider();
        const tokenService = createTokenService();

        const guard = await provider.useFactory(tokenService);

        expect(provider.provide).toBe(IsPayerIdentified);
        expect(provider.inject).toEqual([IdentificationTokenServiceToken]);
        expect(guard).toBeInstanceOf(IsPayerIdentified);
    });
});
