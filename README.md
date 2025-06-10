# point3-common-tool

**포인트3 공유 코드베이스**

이 저장소는 포인트3에서 공통적으로 사용하는 TypeScript/JavaScript 유틸리티, 값 객체, 로거, 이벤트, 테스트 도구 등을 모아놓은 npm 패키지입니다.  
팀 내 여러 프로젝트에서 재사용 가능한 코드들을 효율적으로 관리하고, 일관된 개발 환경을 제공합니다.

---

## 설치

```bash
npm install point3-common-tool
```

---

## 주요 제공 모듈 및 사용법

### 1. 로거 (`p3Loggers`)

```ts
import { p3Loggers } from "point3-common-tool";

const logger = new p3Loggers.Logger();
logger.info("정보 로그");
logger.error("에러 로그");
```

### 2. 값 객체 및 유틸리티 (`p3Values`)

- **전화번호**: `PhoneNumber`
- **GUID**: `Guid`
- **금액**: `Money`
- **콜백 URL**: `CallbackURL`

```ts
import { p3Values } from "point3-common-tool";

const phone = new p3Values.PhoneNumber("010-1234-5678");
console.log(phone.isValid());

const guid = p3Values.Guid.generate();
console.log(guid);

const money = new p3Values.Money(1000, "KRW");
console.log(money.toString());

const url = new p3Values.CallbackURL("https://example.com/callback");
console.log(url.isValid());
```

### 3. 테스트 도구 (`p3Testing`)

- **테스트용 리포지토리**: `TestRepository`

```ts
import { p3Testing } from "point3-common-tool";

const repo = new p3Testing.TestRepository();
repo.save({ id: 1, name: "테스트" });
```

### 4. 이벤트 시스템 (`p3Event`)

- **이벤트 객체**: `Event`
- **릴레이어**: `Relayer`
- **에러**: `EventError`
- **스토리지**: `EventStorage`

```ts
import { p3Event } from "point3-common-tool";

const event = new p3Event.Event("USER_CREATED", { userId: 123 });
const relayer = new p3Event.Relayer();
relayer.relay(event);
```

---

## 개발 및 배포 프로세스

### 1. 코드 추가

1. 관련 디렉토리(`logger`, `values`, `event`, `testing`)에 TypeScript 파일을 추가하거나 수정합니다.
2. 각 디렉토리의 `index.ts`에 export 구문을 추가하여 외부로 노출합니다.
3. 루트 `index.ts`에서 네임스페이스로 묶여 export되는지 확인합니다.

### 2. 커밋

```bash
git add .
git commit -m "feat: 새로운 값 객체 추가"
git push origin main
```

### 3. 빌드

```bash
npm run build
```
- `dist/` 디렉토리에 빌드 결과물이 생성됩니다.

### 4. 버전 업데이트

```bash
npm version [patch|minor|major]
```
- 예: `npm version patch`

### 5. 배포

```bash
npm publish
```
- npm에 패키지가 배포됩니다.

> **주의:** 배포 전 반드시 모든 테스트가 통과하는지 확인하세요.
>
> ```bash
> npm test
> ```

---

## 기여 방법

1. 새로운 기능/수정 사항은 Pull Request로 제안해주세요.
2. 코드 스타일과 기존 구조를 준수해주세요.
3. 충분한 테스트 코드를 작성해주세요.

---

## 문의 및 이슈

- [GitHub Issues](https://github.com/violetpay-org/point3-common-tool/issues)에서 문의 및 버그 제보를 해주세요.

--- 