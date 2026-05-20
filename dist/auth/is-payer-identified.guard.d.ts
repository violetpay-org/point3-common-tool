import { CanActivate, ExecutionContext } from "@nestjs/common";
import { TokenVerificationService } from "./token.service";
export declare abstract class BaseIsPayerIdentifiedGuard implements CanActivate {
    private readonly tokenService;
    static headerFieldName: string;
    protected constructor(tokenService: TokenVerificationService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class IsPayerIdentified extends BaseIsPayerIdentifiedGuard {
    constructor(tokenService: TokenVerificationService);
}
