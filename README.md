# point3-common-tool

**포인트3 공유 코드베이스**

이 저장소는 포인트3에서 공통적으로 사용하는 TypeScript/JavaScript 유틸리티, 값 객체, 로거, 이벤트, 네트워크 어댑터, 테스트 도구 등을 모아놓은 npm 패키지입니다.  
팀 내 여러 프로젝트에서 재사용 가능한 코드들을 효율적으로 관리하고, 일관된 개발 환경을 제공합니다.

---

## 설치

```bash
npm install point3-common-tool
```

---

## 주요 제공 모듈 및 사용법

### 1. 로거 (`p3Loggers`)

Winston 기반의 로거 시스템으로 NestJS와 통합되어 있습니다.

```ts
import { p3Loggers } from "point3-common-tool";

const logger = new p3Loggers.Logger();
logger.info("정보 로그");
logger.error("에러 로그");
logger.warn("경고 로그");
logger.debug("디버그 로그");
```

### 2. 값 객체 및 유틸리티 (`p3Values`)

#### 전화번호 (PhoneNumber)
```ts
import { p3Values } from "point3-common-tool";

const phone = new p3Values.PhoneNumber("010-1234-5678");
console.log(phone.isValid()); // true
console.log(phone.getMasked()); // 010****5678
console.log(phone.getType()); // Mobile 또는 Landline
```

#### 이메일 (Email)
```ts
const email = p3Values.Email.create("user@example.com");
console.log(email.toString()); // user@example.com
console.log(email.Provider); // example.com
```

#### GUID (Guid)
```ts
const guid = p3Values.Guid.generate();
console.log(guid); // 고유 식별자
```

#### GULID (Global Unique Identifier with prefix)
```ts
const gulid = p3Values.Gulid.create("user");
console.log(gulid.toString()); // user:01HKXYZ123...

const parsed = p3Values.Gulid.parse("user:01HKXYZ123...");
console.log(parsed.prefix); // user
```

#### 이름 (Name)
```ts
const name = p3Values.Name.create("홍길동");
console.log(name.toString()); // 홍길동
console.log(name.Masked); // 홍*동 (마스킹된 이름)
```

#### 금액 (Money)
```ts
const money = new p3Values.Money(1000, "KRW");
console.log(money.toString()); // 1000 KRW
```

#### 콜백 URL (CallbackURL)
```ts
const url = new p3Values.CallbackURL("https://example.com/callback");
console.log(url.isValid()); // true
```

#### 역할 (Roles)
```ts
// 일반 매니저 역할
console.log(p3Values.ManagerRoleType.ADMIN); // admin-manager
console.log(p3Values.ManagerRoleType.DEVELOPER); // developer-manager

// Point3 전용 역할
console.log(p3Values.Point3ManagerRoleType.POINT3_ADMIN); // p3-CISO-0
console.log(p3Values.Point3ManagerRoleType.POINT3_DEVELOPER); // p3-DEV-0
```

### 3. 네트워크 어댑터 (`axiosAdapter`)

Axios 기반의 HTTP 클라이언트 템플릿으로 NestJS와 통합되어 있습니다.

#### RESTTemplate 사용법
```ts
import { axiosAdapter } from "point3-common-tool";

// RESTTemplate 생성
const restTemplate = new axiosAdapter.RESTTemplate(
    logger, // NestJS LoggerService
    "https://api.example.com", // baseURL
    10000 // timeout (ms)
);

// Bearer 토큰 설정
restTemplate.setBearer("your-jwt-token");

// Basic 인증 설정
restTemplate.setBasic("username", "password");

// HTTP 요청
const response = await restTemplate.get<UserData>("/users/123");
console.log(response.data); // 응답 데이터
console.log(response.status); // HTTP 상태 코드

// POST 요청
const createResponse = await restTemplate.post<User>("/users", {
    name: "홍길동",
    email: "hong@example.com"
});
```

#### 에러 처리
```ts
try {
    const response = await restTemplate.get("/api/data");
} catch (error) {
    if (error instanceof axiosAdapter.UnauthorizedError) {
        console.log("인증 실패");
    } else if (error instanceof axiosAdapter.ValidationError) {
        console.log("유효성 검사 실패:", error.details);
    } else if (error instanceof axiosAdapter.NetworkError) {
        console.log("네트워크 에러");
    }
}
```

#### 사용 가능한 에러 타입
- `HttpError`: 기본 HTTP 에러
- `NetworkError`: 네트워크 연결 에러
- `TimeoutError`: 타임아웃 에러
- `BadRequestError`: 400 에러
- `UnauthorizedError`: 401 에러
- `ForbiddenError`: 403 에러
- `NotFoundError`: 404 에러
- `ValidationError`: 422 에러

### 4. 이벤트 시스템 (`p3Event`)

NestJS 기반의 이벤트 발행 및 릴레이 시스템으로, Outbox 패턴을 구현하여 안전한 이벤트 처리를 제공합니다.

#### 4.1. 이벤트 클래스 정의

먼저 `BaseEvent`를 상속받아 도메인 이벤트를 정의합니다:

```ts
import { p3Event, p3Values } from "point3-common-tool";

// 페이로드 인터페이스 정의
interface UserCreatedPayload extends p3Event.Payload {
    userId: string;
    email: string;
    name: string;
    toJSON(): JSON;
}

// 이벤트 클래스 정의
export class UserCreatedEvent extends p3Event.BaseEvent<p3Values.Guid, UserCreatedPayload> {
    static prefix = "user-created"; // 필수: 이벤트 ID 접두사

    constructor(payload: UserCreatedPayload, eventId?: p3Values.Guid) {
        super(payload, eventId);
    }
}
```

#### 4.2. 이벤트 저장소 구현

`EventRepository` 인터페이스를 구현하여 이벤트 저장소를 만듭니다:

```ts
import { Injectable } from "@nestjs/common";
import { p3Event, p3Values } from "point3-common-tool";

@Injectable()
export class UserEventRepository implements p3Event.EventRepository<UserCreatedEvent> {
    
    // 이벤트를 Outbox에 저장
    async save(...events: UserCreatedEvent[]): Promise<void> {
        // 데이터베이스에 이벤트 저장 로직
        // 트랜잭션 내에서 도메인 로직과 함께 저장
    }

    // 실패한 이벤트를 Dead Letter Queue로 이동
    async toDeadletter(...events: UserCreatedEvent[]): Promise<void> {
        // Dead Letter 테이블로 이벤트 이동
    }

    // 지정된 저장소에서 이벤트 조회
    async get(from: p3Event.EventStorage, ...params: any[]): Promise<UserCreatedEvent[]> {
        // OUTBOX 또는 DEAD_LETTER에서 이벤트 조회
        if (typeof params[0] === 'number') {
            // 배치 크기만큼 이벤트 조회
            const batchSize = params[0];
            return this.getEventsByBatch(from, batchSize);
        } else {
            // 특정 ID들로 이벤트 조회
            const eventIds = params as p3Values.Guid[];
            return this.getEventsByIds(from, eventIds);
        }
    }

    // 이벤트 삭제 (처리 완료 후)
    async delete(from: p3Event.EventStorage, ...eventIds: p3Values.Guid[]): Promise<void> {
        // 성공적으로 발행된 이벤트를 저장소에서 삭제
    }
}
```

#### 4.3. 이벤트 릴레이어 구현

`BaseEventRelayer`를 상속받아 실제 이벤트 발행 로직을 구현합니다:

```ts
import { Injectable, Logger } from "@nestjs/common";
import { p3Event, p3Values } from "point3-common-tool";

@Injectable()
export class KafkaEventRelayer extends p3Event.BaseEventRelayer {
    constructor(
        logger: Logger,
        private readonly kafkaProducer: any // Kafka Producer 주입
    ) {
        super(logger);
    }

    // 실제 이벤트 발행 로직 구현
    protected async produce(
        message: p3Event.BaseEvent<p3Values.Guid, p3Event.Payload>,
        from: p3Event.From,
        to: Symbol
    ): Promise<void> {
        const topic = to.description || 'default-topic';
        
        await this.kafkaProducer.send({
            topic: topic,
            messages: [{
                key: message.Id.toString(),
                value: JSON.stringify({
                    id: message.Id.toString(),
                    payload: message.Payload
                })
            }]
        });
    }
}
```

#### 4.4. 애플리케이션 서비스에서 이벤트 등록

`EventRelayableApplication`을 상속받아 이벤트 저장소를 등록합니다:

```ts
import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { p3Event } from "point3-common-tool";

// 토큰 정의
export const UserEventRepositoryToken = Symbol.for("UserEventRepository");
export const UserEventTopic = Symbol.for("user-events");

@Injectable()
export class UserService extends p3Event.EventRelayableApplication {
    constructor(
        @p3Event.RegisterableEventRepository(UserEventTopic, UserEventRepositoryToken)
        private readonly userEventRepository: UserEventRepository,
        moduleRef: ModuleRef
    ) {
        super(moduleRef);
        this.registerEvents(); // 필수: 이벤트 저장소 등록
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        // 1. 도메인 로직 실행
        const user = await this.userRepository.save(userData);
        
        // 2. 이벤트 생성
        const event = new UserCreatedEvent({
            userId: user.id,
            email: user.email,
            name: user.name,
            toJSON: () => ({ userId: user.id, email: user.email, name: user.name } as any)
        });
        
        // 3. 이벤트를 Outbox에 저장 (같은 트랜잭션 내)
        await this.userEventRepository.save(event);
        
        return user;
    }
}
```

#### 4.5. 이벤트 릴레이어 실행

스케줄러나 백그라운드 작업으로 이벤트 릴레이어를 실행합니다:

```ts
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class EventRelayScheduler {
    constructor(
        private readonly eventRelayer: KafkaEventRelayer
    ) {}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async relayEvents() {
        await this.eventRelayer.execute();
    }
}
```

#### 4.6. 에러 처리 및 모니터링

이벤트 릴레이어는 **Silent Failure** 방식으로 동작합니다. 에러가 발생해도 예외를 던지지 않고 내부적으로 처리합니다:

```ts
// ❌ 잘못된 예시 - eventRelayer.execute()는 예외를 던지지 않습니다
try {
    await this.eventRelayer.execute();
} catch (error) {
    // 이 블록은 실행되지 않습니다
}

// ✅ 올바른 모니터링 방식
@Injectable()
export class EventRelayScheduler {
    constructor(
        private readonly eventRelayer: KafkaEventRelayer,
        private readonly logger: Logger
    ) {}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async relayEvents() {
        // execute()는 항상 성공적으로 완료됩니다 (내부에서 모든 에러 처리)
        await this.eventRelayer.execute();
        
        // 에러 감지는 다른 방법으로 해야 합니다:
        // 1. Dead Letter Queue 모니터링
        // 2. 로그 모니터링  
        // 3. 메트릭 수집
    }
}
```

#### 실제 에러 처리 동작

1. **이벤트 수집 실패**: 빈 배열 반환, 에러 로그 기록
2. **이벤트 발행 실패**: Dead Letter Queue로 이동, 경고 로그 기록  
3. **저장소 작업 실패**: 경고 로그 기록, 처리 계속

#### 모니터링 권장사항

```ts
// Dead Letter Queue 모니터링
@Injectable()
export class EventMonitoringService {
    async checkDeadLetterQueue() {
        const deadLetterEvents = await this.eventRepository.get(
            EventStorage.DEAD_LETTER, 
            1000
        );
        
        if (deadLetterEvents.length > 0) {
            this.logger.warn(`Dead Letter Queue에 ${deadLetterEvents.length}개의 실패한 이벤트가 있습니다`);
            // 알림 발송, 메트릭 수집 등
        }
    }
}

// 커스텀 에러 처리가 필요한 경우
export class CustomEventRelayer extends BaseEventRelayer {
    protected async produce(message, from, to): Promise<void> {
        try {
            await this.kafkaProducer.send(/* ... */);
            // 성공 메트릭 수집
            this.metricsService.incrementSuccess();
        } catch (error) {
            // 실패 메트릭 수집
            this.metricsService.incrementFailure();
            // 커스텀 알림 로직
            await this.notificationService.sendAlert(error);
            throw error; // 다시 던져서 Dead Letter Queue로 이동
        }
    }
}
```

#### 4.7. 주요 특징

- **Outbox 패턴**: 도메인 로직과 이벤트 저장을 같은 트랜잭션에서 처리
- **Dead Letter Queue**: 실패한 이벤트를 별도로 관리
- **배치 처리**: 대량의 이벤트를 효율적으로 처리
- **자동 재시도**: Dead Letter Queue의 이벤트도 재처리 시도
- **Silent Failure**: 개별 이벤트 실패가 전체 프로세스를 중단시키지 않음
- **복원력**: 일부 실패에도 불구하고 시스템이 계속 동작
- **모니터링 의존성**: 에러 감지를 위해 로그 및 Dead Letter Queue 모니터링 필요
- **타입 안전성**: TypeScript 타입 시스템 완벽 지원

### 5. 테스트 도구 (`p3Testing`)

테스트용 리포지토리 및 유틸리티를 제공합니다.

```ts
import { p3Testing } from "point3-common-tool";

const repo = new p3Testing.TestRepository();

// 데이터 저장
repo.save({ id: 1, name: "테스트 데이터" });

// 데이터 조회
const data = repo.findById(1);
console.log(data); // { id: 1, name: "테스트 데이터" }

// 모든 데이터 조회
const allData = repo.findAll();
```

---

## 개발 및 배포 프로세스

### 1. 코드 추가

1. 관련 디렉토리(`logger`, `values`, `event`, `testing`, `network-adapters`)에 TypeScript 파일을 추가하거나 수정합니다.
2. 각 디렉토리의 `index.ts`에 export 구문을 추가하여 외부로 노출합니다.
3. 루트 `index.ts`에서 네임스페이스로 묶여 export되는지 확인합니다.

### 2. 커밋

```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

### 3. 빌드

```bash
npm run build
```
- `dist/` 디렉토리에 빌드 결과물이 생성됩니다.

### 4. 테스트

```bash
npm test
```
- 모든 테스트가 통과하는지 확인합니다.

### 5. 버전 업데이트

```bash
npm version [patch|minor|major]
```
- 예: `npm version patch`

### 6. 배포

```bash
npm publish
```
- npm에 패키지가 배포됩니다.

### 7. 전체 프로세스 자동화

```bash
# 의존성 설치 (필요시)
npm install

# 빌드 및 테스트
npm run build && npm test

# 커밋 (변경사항이 있는 경우)
git add . && git commit -m "chore: 업데이트"

# 버전업 및 배포
npm version patch && npm publish
```

---

## 타입 정의

모든 모듈은 TypeScript로 작성되어 있으며, 완전한 타입 정의를 제공합니다.

```ts
// 타입 안전성 보장
import { p3Values, axiosAdapter, p3Event } from "point3-common-tool";

// 자동 완성 및 타입 체크 지원
const email: p3Values.Email = p3Values.Email.create("test@example.com");
const response: axiosAdapter.HttpResponse<UserData> = await restTemplate.get<UserData>("/users");
const event: p3Event.BaseEvent<p3Values.Guid, UserPayload> = new UserCreatedEvent(payload);
```

---

## 의존성

주요 의존성 패키지들:
- `@nestjs/common`: NestJS 프레임워크 통합
- `@nestjs/core`: NestJS 코어 기능
- `axios`: HTTP 클라이언트
- `winston`: 로깅 시스템
- `uuid`: UUID 생성
- `ulid`: ULID 생성
- `moment-timezone`: 시간대 처리

---

## 기여 방법

1. 새로운 기능/수정 사항은 Pull Request로 제안해주세요.
2. 코드 스타일과 기존 구조를 준수해주세요.
3. 충분한 테스트 코드를 작성해주세요.
4. TypeScript 타입 정의를 포함해주세요.

---

## 문의 및 이슈

- [GitHub Issues](https://github.com/violetpay-org/point3-common-tool/issues)에서 문의 및 버그 제보를 해주세요.

--- 