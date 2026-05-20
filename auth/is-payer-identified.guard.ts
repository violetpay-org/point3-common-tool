import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import { Checksum } from "../values";
import { IdentificationTokenPayload } from "./payloads";
import { TokenVerificationService } from "./token.service";
import { IdentificationTokenServiceToken } from "./token.tokens";

type HeaderValue = string | string[] | undefined;

interface HttpRequestLike {
    headers: Record<string, HeaderValue>;
}

export abstract class BaseIsPayerIdentifiedGuard implements CanActivate {
    static headerFieldName: string = "Point3-Identification-Token";

    protected constructor(
        private readonly tokenService: TokenVerificationService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<HttpRequestLike & Partial<IdentificationTokenPayload>>();
        const identificationTokenHeader =
            request.headers[
                BaseIsPayerIdentifiedGuard.headerFieldName.toLowerCase()
            ];
        const identificationToken = Array.isArray(identificationTokenHeader)
            ? identificationTokenHeader[0]
            : identificationTokenHeader;
        if (!identificationToken) {
            return true;
        }

        try {
            const payload = this.tokenService.verifyToken(
                identificationToken,
            ) as IdentificationTokenPayload;
            if (payload.value) {
                payload.value = Checksum.from(payload.value.toString());
            }

            Object.assign(request, payload);
            return true;
        } catch (error) {
            throw new UnauthorizedException("유효한 토큰이 아닙니다.");
        }
    }
}

@Injectable()
export class IsPayerIdentified extends BaseIsPayerIdentifiedGuard {
    constructor(
        @Inject(IdentificationTokenServiceToken)
        tokenService: TokenVerificationService,
    ) {
        super(tokenService);
    }
}
