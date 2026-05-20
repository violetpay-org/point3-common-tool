"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSessionTokenGuardProvider = createPaymentSessionTokenGuardProvider;
exports.createIsPayerIdentifiedGuardProvider = createIsPayerIdentifiedGuardProvider;
const is_payer_identified_guard_1 = require("./is-payer-identified.guard");
const payment_session_token_guard_1 = require("./payment-session-token.guard");
const token_tokens_1 = require("./token.tokens");
function createPaymentSessionTokenGuardProvider() {
    return {
        provide: payment_session_token_guard_1.PaymentSessionTokenGuard,
        useFactory: (tokenService) => new payment_session_token_guard_1.PaymentSessionTokenGuard(tokenService),
        inject: [token_tokens_1.PaymentSessionTokenServiceToken],
    };
}
function createIsPayerIdentifiedGuardProvider() {
    return {
        provide: is_payer_identified_guard_1.IsPayerIdentified,
        useFactory: (tokenService) => new is_payer_identified_guard_1.IsPayerIdentified(tokenService),
        inject: [token_tokens_1.IdentificationTokenServiceToken],
    };
}
//# sourceMappingURL=guard.providers.js.map