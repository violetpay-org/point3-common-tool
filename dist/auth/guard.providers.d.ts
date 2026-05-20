import { FactoryProvider } from "@nestjs/common";
import { IsPayerIdentified } from "./is-payer-identified.guard";
import { PaymentSessionTokenGuard } from "./payment-session-token.guard";
export declare function createPaymentSessionTokenGuardProvider(): FactoryProvider<PaymentSessionTokenGuard>;
export declare function createIsPayerIdentifiedGuardProvider(): FactoryProvider<IsPayerIdentified>;
