import { FactoryProvider } from "@nestjs/common";

import { IsPayerIdentified } from "./is-payer-identified.guard";
import { PaymentSessionTokenGuard } from "./payment-session-token.guard";
import { TokenVerificationService } from "./token.service";
import {
    IdentificationTokenServiceToken,
    PaymentSessionTokenServiceToken,
} from "./token.tokens";

export function createPaymentSessionTokenGuardProvider(): FactoryProvider<PaymentSessionTokenGuard> {
    return {
        provide: PaymentSessionTokenGuard,
        useFactory: (tokenService: TokenVerificationService) =>
            new PaymentSessionTokenGuard(tokenService),
        inject: [PaymentSessionTokenServiceToken],
    };
}

export function createIsPayerIdentifiedGuardProvider(): FactoryProvider<IsPayerIdentified> {
    return {
        provide: IsPayerIdentified,
        useFactory: (tokenService: TokenVerificationService) =>
            new IsPayerIdentified(tokenService),
        inject: [IdentificationTokenServiceToken],
    };
}
