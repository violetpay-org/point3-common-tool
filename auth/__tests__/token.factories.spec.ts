import {
    createTokenIssuerService,
    createTokenVerificationService,
    TokenIssuerServiceOptions,
    TokenVerificationServiceOptions,
} from "../token.factories";
import {
    TokenExpiresIn,
    TokenIssuerService,
    TokenVerificationService,
} from "../token.service";

type IsRequired<T, TKey extends keyof T> = {} extends Pick<T, TKey>
    ? false
    : true;

describe("auth token service factories", () => {
    const tokenKeyOptions = {
        aesKey: "a".repeat(64),
        hmacKey: "b".repeat(64),
    };

    it("creates an issuing service with an explicit default expiry", () => {
        const tokenService = createTokenIssuerService({
            ...tokenKeyOptions,
            defaultExpiresIn: "15m",
        });

        expect(
            tokenService.verifyToken(tokenService.createToken({ value: 1 })),
        ).toMatchObject({
            value: 1,
        });
    });

    it("creates a verification service that can verify tokens but cannot issue at type level", () => {
        const issuer = createTokenIssuerService({
            ...tokenKeyOptions,
            defaultExpiresIn: "15m",
        });
        const verifier = createTokenVerificationService(tokenKeyOptions);
        const token = issuer.createToken({ value: 1 });

        type VerifierHasCreateToken = "createToken" extends keyof typeof verifier
            ? true
            : false;
        const verifierHasCreateToken: VerifierHasCreateToken = false;

        expect(verifierHasCreateToken).toBe(false);
        expect(verifier.verifyToken(token)).toMatchObject({
            value: 1,
        });
    });

    it("encodes issuing and verification option intent in TypeScript", () => {
        type IssuingExpiryRequired = IsRequired<
            TokenIssuerServiceOptions,
            "defaultExpiresIn"
        >;
        type VerificationHasExpiryOption = "defaultExpiresIn" extends keyof TokenVerificationServiceOptions
            ? true
            : false;
        type IssuerHasCreateToken = "createToken" extends keyof TokenIssuerService
            ? true
            : false;
        type IssuerIsVerifier = TokenIssuerService extends TokenVerificationService
            ? true
            : false;
        type VerifierHasCreateToken = "createToken" extends keyof TokenVerificationService
            ? true
            : false;

        const issuingExpiryRequired: IssuingExpiryRequired = true;
        const verificationHasExpiryOption: VerificationHasExpiryOption = false;
        const issuerHasCreateToken: IssuerHasCreateToken = true;
        const issuerIsVerifier: IssuerIsVerifier = true;
        const verifierHasCreateToken: VerifierHasCreateToken = false;

        expect(issuingExpiryRequired).toBe(true);
        expect(verificationHasExpiryOption).toBe(false);
        expect(issuerHasCreateToken).toBe(true);
        expect(issuerIsVerifier).toBe(true);
        expect(verifierHasCreateToken).toBe(false);
    });

    it("accepts numeric and string JWT expiry values for issuing services", () => {
        const expiresInValues: TokenExpiresIn[] = [60, "15m"];

        for (const defaultExpiresIn of expiresInValues) {
            const tokenService = createTokenIssuerService({
                ...tokenKeyOptions,
                defaultExpiresIn,
            });

            expect(
                tokenService.verifyToken(
                    tokenService.createToken({ value: defaultExpiresIn }),
                ),
            ).toMatchObject({
                value: defaultExpiresIn,
            });
        }
    });
});
