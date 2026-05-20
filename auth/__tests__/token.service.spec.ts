import { CryptoUtil } from "../../crypto";
import { TokenService } from "../token.service";

describe("TokenService", () => {
    let tokenService: TokenService;

    beforeEach(() => {
        tokenService = new TokenService(
            "24h",
            new CryptoUtil("a".repeat(64), "b".repeat(64)),
            "b".repeat(64),
        );
    });

    it("creates and verifies a token", () => {
        const token = tokenService.createToken({ phoneNumber: "01012345678" });

        const verifiedToken = tokenService.verifyToken(token);

        expect(verifiedToken).toBeDefined();
    });

    it("encrypts and decrypts a token", async () => {
        const token = tokenService.createToken({ phoneNumber: "01012345678" });

        const encryptedToken = await tokenService.encryptToken(token);
        const decryptedToken = await tokenService.decryptToken(encryptedToken);

        expect(encryptedToken).not.toBe(token);
        expect(decryptedToken).toBe(token);
    });

    it("requires an HMAC key", () => {
        expect(
            () =>
                new TokenService(
                    "24h",
                    new CryptoUtil("a".repeat(64), "b".repeat(64)),
                    "",
                ),
        ).toThrow("CryptoUtil HMAC key is required.");
    });

    it("rejects tokens signed with another HMAC key", () => {
        const token = tokenService.createToken({ phoneNumber: "01012345678" });
        const otherTokenService = new TokenService(
            "24h",
            new CryptoUtil("c".repeat(64), "d".repeat(64)),
            "d".repeat(64),
        );

        expect(() => otherTokenService.verifyToken(token)).toThrow();
    });
});
