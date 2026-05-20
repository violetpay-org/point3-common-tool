# point3-common-tool auth

`auth`는 Point3 서비스들이 JWT 서명 키와 guard 동작을 공유하기 위한 NestJS helper입니다. 이 패키지는 NestJS `Module`을 제공하지 않습니다. 각 서비스는 자기 `AuthModule`에서 Nest provider를 직접 작성합니다.

## 핵심 원칙

- 프로젝트별 `Symbol(...)` token을 만들지 않습니다.
- JWT 타입별 DI token은 common-tool이 제공합니다.
    - `PaymentSessionTokenServiceToken`
    - `IdentificationTokenServiceToken`
- 같은 프로젝트에서 여러 JWT 타입을 쓰더라도 provider token이 충돌하지 않습니다.
- `ConfigService`를 common-tool factory에 숨기지 않습니다. 각 서비스 `AuthModule`의 `useFactory`에서 config를 직접 읽습니다.
- 토큰 생성도 하는 프로젝트는 각 JWT 타입 token에 `createTokenIssuerService()` 결과를 provide합니다.
- `TokenIssuerService`는 `TokenVerificationService`를 상속하므로 guard 검증용으로도 사용할 수 있습니다.
- 검증 전용 코드에서 `createToken()`을 컴파일 타임에 막고 싶으면 `@Inject(<jwt type token>)` + `TokenVerificationService` 타입으로 주입받습니다.
- 토큰 생성 코드에서는 `@Inject(<jwt type token>)` + `TokenIssuerService` 타입으로 주입받습니다.
- guard provider를 명시적으로 등록하려면 `createPaymentSessionTokenGuardProvider()`와 `createIsPayerIdentifiedGuardProvider()`를 사용합니다. 각 factory provider는 guard별 JWT 타입 token service를 정확히 주입합니다.

## 제공 항목

- `PaymentSessionTokenServiceToken`
    - `PaymentSessionTokenGuard`가 주입받는 결제 세션 JWT용 공통 DI token입니다.
- `IdentificationTokenServiceToken`
    - `IsPayerIdentified`가 주입받는 본인인증 JWT용 공통 DI token입니다.
- `TokenVerificationService`
    - `verifyToken()`, `encryptToken()`, `decryptToken()`만 노출하는 abstract type입니다.
    - `createToken()`이 없으므로 검증 전용 코드에서 토큰 생성을 컴파일 타임에 막습니다.
- `TokenIssuerService`
    - `TokenVerificationService`를 상속합니다.
    - `createToken()`까지 노출합니다.
- `TokenService`
    - 실제 구현체입니다.
    - 대부분의 애플리케이션 코드는 직접 주입받지 말고 `TokenVerificationService` 또는 `TokenIssuerService` 타입으로 주입받으세요.
- `createTokenVerificationService(options)`
    - 검증 전용 서비스를 생성합니다.
    - 옵션: `{ aesKey, hmacKey }`
    - `defaultExpiresIn`을 받지 않습니다.
- `createTokenIssuerService(options)`
    - 생성+검증 가능한 서비스를 생성합니다.
    - 옵션: `{ aesKey, hmacKey, defaultExpiresIn }`
    - `defaultExpiresIn`이 필수라서 AuthModule provider 작성 시 JWT 기본 만료시간을 명시해야 합니다.
- `createPaymentSessionTokenGuardProvider()`
    - `PaymentSessionTokenGuard` provider를 생성합니다.
    - `PaymentSessionTokenServiceToken`을 inject해서 결제 세션 JWT service만 사용하게 합니다.
- `createIsPayerIdentifiedGuardProvider()`
    - `IsPayerIdentified` provider를 생성합니다.
    - `IdentificationTokenServiceToken`을 inject해서 본인인증 JWT service만 사용하게 합니다.
- `PaymentSessionTokenGuard`
    - `X-Point3-Payment-Token` 헤더를 검증합니다.
    - constructor에서 `@Inject(PaymentSessionTokenServiceToken)`으로 `TokenVerificationService`를 주입받습니다.
    - AuthModule에서는 `createPaymentSessionTokenGuardProvider()`로 등록하는 것을 권장합니다.
- `IsPayerIdentified`
    - `Point3-Identification-Token` 헤더를 검증합니다.
    - constructor에서 `@Inject(IdentificationTokenServiceToken)`으로 `TokenVerificationService`를 주입받습니다.
    - AuthModule에서는 `createIsPayerIdentifiedGuardProvider()`로 등록하는 것을 권장합니다.

## 공통 환경 변수

JWT 서명/검증에는 HMAC key를 사용하고, 토큰 암호화/복호화 helper에는 AES key를 사용합니다.

```env
AES_CIPHER_KEY=64자리 hex 문자열
HMAC_SHA256_PRIVATE_KEY=64자리 hex 문자열
JWT_PAYMENT_SESSION_EXPIRES_IN=10m
JWT_IS_PAYER_IDENTIFIED_EXPIRES_IN=5m
```

config key 이름은 common-tool이 강제하지 않습니다. 각 서비스의 `AuthModule`에서 자기 환경 변수 이름을 직접 읽어 factory option에 넣습니다.

## 1. 토큰 검증만 하는 프로젝트

검증만 하는 프로젝트는 사용하는 JWT 타입에 맞는 token에 `createTokenVerificationService()` 결과를 provide합니다. 이 경로에는 JWT 기본 만료시간이 필요 없습니다. 토큰 만료 여부는 JWT payload의 `exp`를 `verifyToken()`이 검증합니다.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
    createIsPayerIdentifiedGuardProvider,
    createPaymentSessionTokenGuardProvider,
    createTokenVerificationService,
    IsPayerIdentified,
    PaymentSessionTokenGuard,
    PaymentSessionTokenServiceToken,
    IdentificationTokenServiceToken,
} from 'point3-common-tool';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: PaymentSessionTokenServiceToken,
            useFactory: (configService: ConfigService) =>
                createTokenVerificationService({
                    aesKey: configService.getOrThrow<string>('AES_CIPHER_KEY'),
                    hmacKey: configService.getOrThrow<string>(
                        'HMAC_SHA256_PRIVATE_KEY',
                    ),
                }),
            inject: [ConfigService],
        },
        {
            provide: IdentificationTokenServiceToken,
            useFactory: (configService: ConfigService) =>
                createTokenVerificationService({
                    aesKey: configService.getOrThrow<string>('AES_CIPHER_KEY'),
                    hmacKey: configService.getOrThrow<string>(
                        'HMAC_SHA256_PRIVATE_KEY',
                    ),
                }),
            inject: [ConfigService],
        },
        createPaymentSessionTokenGuardProvider(),
        createIsPayerIdentifiedGuardProvider(),
    ],
    exports: [PaymentSessionTokenGuard, IsPayerIdentified],
})
export class AuthModule {}
```

검증 전용 서비스를 주입받는 코드에서는 `TokenVerificationService` 타입을 사용합니다.

```ts
import { Inject, Injectable } from '@nestjs/common';
import {
    PaymentSessionTokenServiceToken,
    TokenVerificationService,
} from 'point3-common-tool';

@Injectable()
export class VerificationOnlyService {
    constructor(
        @Inject(PaymentSessionTokenServiceToken)
        private readonly tokenService: TokenVerificationService,
    ) {}

    verify(token: string) {
        return this.tokenService.verifyToken(token);
    }

    // this.tokenService.createToken({}); // TS error: createToken does not exist
}
```

## 2. 토큰 생성도 하는 프로젝트

토큰 생성도 하는 프로젝트는 JWT 타입별 common token에 `createTokenIssuerService()` 결과를 provide합니다. `TokenIssuerService`는 verification도 가능하므로 guard가 같은 인스턴스를 그대로 사용합니다.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
    createIsPayerIdentifiedGuardProvider,
    createPaymentSessionTokenGuardProvider,
    createTokenIssuerService,
    IdentificationTokenServiceToken,
    IsPayerIdentified,
    PaymentSessionTokenGuard,
    PaymentSessionTokenServiceToken,
    TokenExpiresIn,
} from 'point3-common-tool';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: PaymentSessionTokenServiceToken,
            useFactory: (configService: ConfigService) =>
                createTokenIssuerService({
                    aesKey: configService.getOrThrow<string>('AES_CIPHER_KEY'),
                    hmacKey: configService.getOrThrow<string>(
                        'HMAC_SHA256_PRIVATE_KEY',
                    ),
                    defaultExpiresIn:
                        configService.getOrThrow<TokenExpiresIn>(
                            'JWT_PAYMENT_SESSION_EXPIRES_IN',
                        ),
                }),
            inject: [ConfigService],
        },
        {
            provide: IdentificationTokenServiceToken,
            useFactory: (configService: ConfigService) =>
                createTokenIssuerService({
                    aesKey: configService.getOrThrow<string>('AES_CIPHER_KEY'),
                    hmacKey: configService.getOrThrow<string>(
                        'HMAC_SHA256_PRIVATE_KEY',
                    ),
                    defaultExpiresIn:
                        configService.getOrThrow<TokenExpiresIn>(
                            'JWT_IS_PAYER_IDENTIFIED_EXPIRES_IN',
                        ),
                }),
            inject: [ConfigService],
        },
        createPaymentSessionTokenGuardProvider(),
        createIsPayerIdentifiedGuardProvider(),
    ],
    exports: [
        PaymentSessionTokenServiceToken,
        IdentificationTokenServiceToken,
        PaymentSessionTokenGuard,
        IsPayerIdentified,
    ],
})
export class AuthModule {}
```

발급 코드에서는 JWT 타입에 맞는 common token을 `TokenIssuerService` 타입으로 주입받습니다.

```ts
import { Inject, Injectable } from '@nestjs/common';
import {
    PaymentSessionTokenServiceToken,
    TokenIssuerService,
} from 'point3-common-tool';

@Injectable()
export class PaymentTokenIssuer {
    constructor(
        @Inject(PaymentSessionTokenServiceToken)
        private readonly tokenService: TokenIssuerService,
    ) {}

    issuePaymentSessionToken(payload: object): string {
        return this.tokenService.createToken(payload);
    }
}
```

## 3. 컨트롤러 사용

도메인 모듈은 guard provider를 다시 등록하지 말고 `AuthModule`을 import합니다.

```ts
@Module({
    imports: [AuthModule],
    controllers: [PaymentController],
})
export class PaymentModule {}
```

컨트롤러에서는 common-tool guard class를 그대로 사용합니다.

```ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import { IsPayerIdentified, PaymentSessionTokenGuard } from 'point3-common-tool';

@Controller('payment')
export class PaymentController {
    @Post('identify')
    @UseGuards(PaymentSessionTokenGuard, IsPayerIdentified)
    identify() {
        // request.sessionId, request.clientId, request.ipAddress 등을 사용할 수 있습니다.
    }
}
```

## 4. point3-payment-domain 적용 체크리스트

`point3-payment-domain` 같은 생성+검증 프로젝트는 아래 형태가 기본입니다.

1. 프로젝트 로컬 Symbol token을 만들지 않습니다.
2. common-tool의 `PaymentSessionTokenServiceToken`, `IdentificationTokenServiceToken`을 provider token으로 사용합니다.
3. local guard subclass를 만들지 않고 common-tool의 `createPaymentSessionTokenGuardProvider()`, `createIsPayerIdentifiedGuardProvider()`로 guard provider를 등록하고 `PaymentSessionTokenGuard`, `IsPayerIdentified`를 export 합니다.
4. `createTokenServiceProvider()` 대신 `createTokenIssuerService()`를 `useFactory` 안에서 호출합니다.
5. 토큰 발급 코드는 `@Inject(PaymentSessionTokenServiceToken | IdentificationTokenServiceToken)` + `TokenIssuerService` 타입을 사용합니다.
6. 검증만 필요한 코드는 같은 token을 주입하되 `TokenVerificationService` 타입을 사용합니다.

## 5. 주의사항

- `TokenIssuerService`는 guard에 넣어도 됩니다. `TokenIssuerService extends TokenVerificationService`이기 때문입니다.
- 생성+검증 프로젝트에서도 JWT 타입별 provider는 하나면 됩니다. 같은 provider를 guard와 발급 코드가 공유합니다.
- 검증 전용 코드가 `TokenVerificationService` 타입으로 주입받으면 `createToken()`을 컴파일 타임에 호출할 수 없습니다.
- 발급 코드가 `TokenIssuerService` 타입으로 주입받으면 `createToken()`을 사용할 수 있습니다.
- `TokenService` 구현체를 직접 타입으로 쓰면 전체 메서드가 보입니다. 컴파일 타임 역할 분리를 원하면 `TokenIssuerService` 또는 `TokenVerificationService`를 타입으로 쓰세요.
- `@UseGuards(PaymentSessionTokenGuard)`는 `PaymentSessionTokenGuard` provider를 현재 모듈 컨텍스트에서 해결합니다. `createPaymentSessionTokenGuardProvider()`로 등록하면 factory가 `PaymentSessionTokenServiceToken`을 주입합니다.
- `@UseGuards(IsPayerIdentified)`는 `IsPayerIdentified` provider를 현재 모듈 컨텍스트에서 해결합니다. `createIsPayerIdentifiedGuardProvider()`로 등록하면 factory가 `IdentificationTokenServiceToken`을 주입합니다.
