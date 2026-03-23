# DocSanitizer CLI Tool (`point3-doc`)

## TL;DR

> **Quick Summary**: Build a `commander`-based CLI tool (`point3-doc`) inside `point3-common-tool/doc-build/bin/` that wraps the existing `DocSanitizer` namespace. Follows `point3-ledger-tool` architectural patterns (CLIProgram, ConfigProgram). Targets NCP Object Storage (S3-compatible). All user-facing text in Korean with detailed examples and NCP-specific guidance.
> 
> **Deliverables**:
> - CLI entry point: `doc-build/bin/main.ts` (global `point3-doc` command)
> - 4 subcommands: `sanitize`, `sync`, `run`, `config`
> - Config system at `~/point3_doc/.config`
> - NCP S3Client factory with credential management
> - Korean help text with NCP Object Storage setup examples
> - CLI layer unit tests
> - Build pipeline updates (tsc-alias, bin field, build script)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (infrastructure) → Task 2 (config) → Tasks 3/4/5 (commands) → Task 6 (integration) → Task 7 (tests)

---

## Context

### Original Request
사용자가 `doc-build/doc-sanitizer.ts`의 `DocSanitizer` 네임스페이스를 감싸는 CLI 도구를 요청. `point3-ledger-tool`의 아키텍처 패턴을 참고하여 설계. NCP Object Storage를 대상으로 하며, 개발자들에게 상세한 한국어 가이드를 제공해야 함.

### Interview Summary
**Key Discussions**:
- **위치**: point3-common-tool 내부 `doc-build/bin/`에 배치 (별도 레포 아님)
- **실행 주체**: CI/CD (Naver Cloud Source Build) + 로컬 개발자 모두 사용
- **커맨드 구조**: 서브커맨드 체계 (sanitize, sync, run, config)
- **Interactive 모드**: 불필요
- **Config 시스템**: ledger-tool 패턴 (`~/point3_doc/.config` JSON)
- **S3 설정**: NCP Object Storage, endpoint/region을 config에, credentials는 환경변수/CLI 옵션으로
- **파이프라인 분리**: sanitize-only, sync-only, full(run) 독립 실행 가능
- **Dry-run**: 필요 (모든 subcommand에)
- **Batch 모드**: 불필요 (한 번에 하나의 레포)
- **로그 레벨**: `--verbose` / `--quiet` 지원
- **빌드**: path alias + tsc-alias (ledger-tool 스타일)
- **배포**: npm global bin (`point3-doc` 커맨드)
- **Banner**: figlet ASCII art
- **한국어 UX**: 모든 커맨드/옵션에 상세 한국어 설명 + 사용 예시 + NCP 설정 가이드
- **에러 처리**: 해결 방법을 안내하는 상세 한국어 에러 메시지
- **테스트**: CLI 레이어 단위 테스트 (DocSanitizer 로직은 이미 100% 커버됨)

**Research Findings**:
- NCP Object Storage는 S3 호환 API (AWS Signature V4)를 사용하나 endpoint가 다름 (`https://kr.object.fin-ncloudstorage.com`)
- 기존 `@aws-sdk/client-s3`에 custom endpoint를 설정하면 NCP와 호환됨
- `DocSanitizer.process()`가 `options.s3Client`를 받으므로 DocSanitizer 코드 수정 없이 S3Client 주입 가능
- point3-common-tool에는 현재 path alias 미사용 — tsconfig 수정 + tsc-alias devDep 추가 필요
- point3-common-tool package.json에 현재 `bin` 필드 없음

### Metis Review
**Identified Gaps** (addressed):
- **binary distribution**: `point3-common-tool`은 라이브러리 패키지인데 `bin`을 추가하면 모든 소비자에게 CLI가 설치됨 → 사용자가 명시적으로 이 구조를 선택. commander/figlet은 이미 가벼운 의존성이므로 수용.
- **path alias 과잉**: doc-build/bin에서 doc-sanitizer.ts까지는 `../doc-sanitizer` 한 단계뿐이라 alias가 과잉일 수 있음 → 사용자가 ledger-tool 일관성을 위해 alias 사용 선택. `@doc-build/*` alias 추가.
- **credential 우선순위**: CLI 옵션 > 환경변수 순서로 명확히 정의 (config에는 credentials 저장 안 함).

---

## Work Objectives

### Core Objective
`DocSanitizer`의 기존 문서 처리 파이프라인을 감싸는 CLI 도구를 구축하여, CI/CD 환경과 개발자 로컬 환경 모두에서 편리하게 사용할 수 있도록 한다. NCP Object Storage를 대상으로 하며, 한국어로 상세한 사용 가이드를 제공한다.

### Concrete Deliverables
- `doc-build/bin/main.ts` — CLI 진입점 (#!/usr/bin/env node)
- `doc-build/bin/program.ts` — 추상 CLIProgram 베이스 클래스
- `doc-build/bin/config/` — Config 관리 시스템 (show/set/reset)
- `doc-build/bin/commands/sanitize.ts` — sanitize 서브커맨드
- `doc-build/bin/commands/sync.ts` — sync 서브커맨드
- `doc-build/bin/commands/run.ts` — run(full pipeline) 서브커맨드
- `doc-build/bin/s3/client-factory.ts` — NCP S3Client 팩토리
- `doc-build/bin/validators/` — 입력값 검증 유틸리티
- `doc-build/__tests__/cli/` — CLI 레이어 단위 테스트
- `package.json` 업데이트 (bin, scripts, dependencies)
- `tsconfig.json` 업데이트 (path aliases)

### Definition of Done
- [ ] `npx point3-doc --help` 실행 시 한국어 도움말과 ASCII 배너 출력
- [ ] `npx point3-doc sanitize . -o ./out` 실행 시 sanitize된 결과물이 `./out`에 생성
- [ ] `npx point3-doc sync ./out --s3-path s3://bucket/prefix --access-key xxx --secret-key xxx` 실행 시 NCP Object Storage에 업로드
- [ ] `npx point3-doc run . --s3-path s3://bucket/prefix` 실행 시 full pipeline 수행
- [ ] `npx point3-doc config show/set/reset` 실행 시 config 관리 정상 동작
- [ ] `npm test` 시 CLI 단위 테스트 모두 통과
- [ ] `npm run build` 시 dist 출력물에 `doc-build/bin/main.js` 포함 및 실행 권한 부여

### Must Have
- Commander 기반 서브커맨드 체계
- NCP Object Storage S3Client 주입 (DocSanitizer 코드 수정 없이)
- `~/point3_doc/.config` 기반 Config 관리
- `--dry-run` 미리보기 모드
- `--verbose` / `--quiet` 로그 레벨 제어
- 상세 한국어 도움말 (모든 커맨드/옵션에 설명 + 예시)
- NCP Object Storage 설정 관련 상세 가이드 (endpoint, 인증키 발급 안내)
- 해결 방법을 포함하는 한국어 에러 메시지
- figlet ASCII 배너
- CLI 레이어 단위 테스트

### Must NOT Have (Guardrails)
- DocSanitizer 핵심 로직 (`doc-sanitizer.ts`) 변경 금지
- Interactive REPL 모드 구현 금지
- Batch 모드 (복수 레포 동시 처리) 구현 금지
- Config 파일에 credentials(access key, secret key) 저장 금지
- 영문 도움말/에러 메시지 (한국어 전용)
- AWS 고유 서비스 의존 (NCP Object Storage 전용)
- 불필요한 추상화/패턴 추가 (필요한 패턴만 ledger-tool에서 차용)
- `doc-build/__tests__/doc-sanitizer.spec.ts` 기존 테스트 수정 금지

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN** — acceptance criteria that require:
> - "User manually tests..." / "사용자가 직접 테스트..."
> - "User visually confirms..." / "사용자가 눈으로 확인..."
> - ANY step where a human must perform an action
>
> **ALL verification is executed by the agent** using tools (Bash, interactive_bash, etc.). No exceptions.

### Test Decision
- **Infrastructure exists**: YES (jest with ts-jest)
- **Automated tests**: YES (tests-after)
- **Framework**: jest with ts-jest (existing)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **CLI commands** | Bash | Run command, check stdout/stderr, assert exit codes |
| **Config files** | Bash | Read JSON, assert field values |
| **Build output** | Bash | Check dist/ files exist, run built JS |
| **Unit tests** | Bash | Run jest, assert all pass |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Build infrastructure setup (package.json, tsconfig, bin scaffold)
└── (sequential only — foundation for all others)

Wave 2 (After Wave 1):
├── Task 2: Config system (ConfigProgram, S3 config)
├── Task 3: S3 Client factory + validators
└── (can run in parallel)

Wave 3 (After Wave 2):
├── Task 4: sanitize subcommand
├── Task 5: sync subcommand
├── Task 6: run subcommand
└── (can run in parallel after config + s3 factory exist)

Wave 4 (After Wave 3):
├── Task 7: main.ts entry point + banner + help integration
└── (needs all commands registered)

Wave 5 (After Wave 4):
├── Task 8: CLI unit tests
└── Task 9: Final build verification + cleanup

Critical Path: Task 1 → Task 2 → Task 4 → Task 7 → Task 8 → Task 9
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 5, 6, 7 | None |
| 2 | 1 | 4, 5, 6, 7 | 3 |
| 3 | 1 | 5, 6 | 2 |
| 4 | 1, 2 | 7 | 5, 6 |
| 5 | 1, 2, 3 | 7 | 4, 6 |
| 6 | 1, 2, 3 | 7 | 4, 5 |
| 7 | 4, 5, 6 | 8 | None |
| 8 | 7 | 9 | None |
| 9 | 8 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick", load_skills=[], run_in_background=false) |
| 2 | 2, 3 | dispatch parallel, category="unspecified-low" |
| 3 | 4, 5, 6 | dispatch parallel, category="unspecified-low" |
| 4 | 7 | task(category="unspecified-low", run_in_background=false) |
| 5 | 8, 9 | sequential, category="unspecified-low" |

---

## TODOs

- [x] 1. Build Infrastructure Setup

  **What to do**:
  - `package.json` 업데이트:
    - `bin` 필드 추가: `"point3-doc": "dist/doc-build/bin/main.js"`
    - `scripts.build:dev` 추가: `"rm -rf dist && tsc && tsc-alias && chmod +x dist/doc-build/bin/main.js"`
    - `dependencies`에 `commander` (^14.0.0), `figlet` (^1.9.4) 추가
    - `devDependencies`에 `tsc-alias` (^1.8.16), `@types/figlet` 추가
  - `tsconfig.json` 업데이트:
    - `paths`에 `"@doc-build/*": ["./doc-build/*"]`, `"@doc-build": ["./doc-build"]` 추가
    - `exclude`에서 doc-build가 제외되어 있지 않은지 확인 (현재 exclude 없음 — OK)
  - 디렉토리 생성:
    - `doc-build/bin/`
    - `doc-build/bin/config/`
    - `doc-build/bin/config/s3/`
    - `doc-build/bin/commands/`
    - `doc-build/bin/s3/`
    - `doc-build/bin/validators/`
  - `doc-build/bin/program.ts` — CLIProgram 추상 베이스 클래스 생성 (ledger-tool의 `bin/program.ts` 패턴 복제)
  - `npm install` 실행하여 새 의존성 설치

  **Must NOT do**:
  - DocSanitizer 코드 수정
  - 불필요한 디렉토리 구조 추가
  - jest 설정 변경

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 패키지 설정 및 스캐폴딩은 단순한 파일 수정 작업
  - **Skills**: []
    - 특별한 스킬 불필요
  - **Skills Evaluated but Omitted**:
    - `git-master`: 커밋은 최종 단계에서 진행

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/bin/program.ts:1-16` — CLIProgram 추상 클래스 패턴. `setupCommands()`와 `commandAttached` 가드 패턴을 복제할 것.
  - `/Users/user/projects/point3-ledger-tool/package.json:8-14` — `bin` 필드와 `build:dev` 스크립트 패턴. `chmod +x` 포함 확인.
  - `/Users/user/projects/point3-ledger-tool/tsconfig.json:22-44` — path alias 설정 패턴. `@bin/*`, `@common/*` 등의 alias 구조.

  **Target References**:
  - `/Users/user/projects/point3-common-tool/package.json` — 업데이트 대상. 현재 `bin` 필드 없음, dependencies에 `commander`/`figlet` 없음.
  - `/Users/user/projects/point3-common-tool/tsconfig.json` — 업데이트 대상. 현재 `paths` 설정 없음.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: package.json에 bin 필드 존재 확인
    Tool: Bash
    Steps:
      1. node -e "const pkg = require('./package.json'); console.log(pkg.bin['point3-doc'])"
      2. Assert: stdout contains "dist/doc-build/bin/main.js"
    Expected Result: bin 필드가 올바른 경로를 가리킴

  Scenario: 새 의존성 설치 확인
    Tool: Bash
    Steps:
      1. npm ls commander --depth=0
      2. Assert: exit code 0
      3. npm ls figlet --depth=0
      4. Assert: exit code 0
      5. npm ls tsc-alias --dev --depth=0
      6. Assert: exit code 0
    Expected Result: commander, figlet, tsc-alias가 설치됨

  Scenario: tsconfig path alias 확인
    Tool: Bash
    Steps:
      1. node -e "const ts = require('./tsconfig.json'); console.log(JSON.stringify(ts.compilerOptions.paths))"
      2. Assert: stdout contains "@doc-build/*"
    Expected Result: path alias가 설정됨

  Scenario: CLIProgram 베이스 클래스 파일 존재
    Tool: Bash
    Steps:
      1. ls doc-build/bin/program.ts
      2. Assert: exit code 0
    Expected Result: 파일이 존재함

  Scenario: 디렉토리 구조 확인
    Tool: Bash
    Steps:
      1. ls -d doc-build/bin/config/ doc-build/bin/commands/ doc-build/bin/s3/ doc-build/bin/validators/
      2. Assert: exit code 0, 모든 디렉토리 존재
    Expected Result: 모든 필수 디렉토리가 생성됨

  Scenario: npm run build:dev 동작 확인
    Tool: Bash
    Steps:
      1. npm run build:dev
      2. Assert: exit code 0
      3. ls dist/doc-build/bin/main.js (파일 존재)
      4. stat -f '%A' dist/doc-build/bin/main.js 또는 ls -la dist/doc-build/bin/main.js
      5. Assert: 실행 권한(755) 확인
    Expected Result: 빌드 성공 및 실행 권한 부여됨
  ```

  **Evidence to Capture:**
  - [ ] npm ls 출력
  - [ ] 디렉토리 구조 트리

  **Commit**: YES
  - Message: `feat(doc-build): CLI 빌드 인프라 및 스캐폴딩 구성`
  - Files: `package.json, tsconfig.json, doc-build/bin/program.ts, doc-build/bin/`
  - Pre-commit: `npm run build:dev`

---

- [x] 2. Config System (`config` 서브커맨드)

  **What to do**:
  - `doc-build/bin/config/config.ts` — 기본 Config 인터페이스 정의:
    ```typescript
    export interface Point3DocConfig {
      s3: {
        docS3Path: string;
        endpoint: string;
        region: string;
      }
    }
    ```
  - `doc-build/bin/config/s3/config.ts` — S3Config 인터페이스 (Point3DocConfig 확장)
  - `doc-build/bin/config/s3/config.program.ts` — S3ConfigProgram 클래스:
    - `ConfigReadWriteProgram` 확장
    - 기본값: `{ docS3Path: "", endpoint: "https://kr.object.fin-ncloudstorage.com", region: "fin-standard" }`
    - `show` 커맨드: 현재 S3 설정 출력 (한국어 설명 포함)
    - `set` 커맨드: `--s3-path`, `--endpoint`, `--region` 옵션
    - 상세 한국어 도움말:
      - S3 경로 형식 설명: `"s3://버킷이름/접두사 형식으로 입력하세요."`
      - endpoint 기본값 안내: `"NCP 금융 클라우드 Object Storage 엔드포인트입니다. (기본값: https://kr.object.fin-ncloudstorage.com)"`
      - NCP API 인증키 발급 방법 안내 (config help에 포함)
  - `doc-build/bin/config/program.ts` — ConfigProgram 메인 클래스:
    - `~/point3_doc/.config` 경로에 JSON config 관리
    - `show`: 전체 설정 조회
    - `set`: 설정 변경
    - `reset`: 초기 기본값으로 복구
    - `initialize()`: config 파일/디렉토리 없으면 생성
  - `doc-build/bin/config/index.ts` — 배럴 export
  - 모든 한국어 메시지에 NCP Object Storage 설정 예시 포함:
    ```
    NCP Object Storage 설정 가이드:
      1. NCP 콘솔 (https://console.fin-ncloud.com) 접속
      2. 마이페이지 > API 인증키 관리에서 Access Key/Secret Key 발급
      3. Object Storage에서 버킷 생성
      4. point3-doc config set --s3-path s3://버킷이름/docs
    
    엔드포인트 참고:
      금융 클라우드: https://kr.object.fin-ncloudstorage.com
      
    상세 문서: https://api-fin.ncloud-docs.com/docs/storage-objectstorage
    ```

  **Must NOT do**:
  - Config에 credentials(access key, secret key) 저장 기능 구현 금지
  - DocSanitizer 코드 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Config 시스템은 명확한 패턴 복제 작업
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: CLI이므로 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 4, 5, 6, 7
  - **Blocked By**: Task 1

  **References** (CRITICAL):

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/bin/config/program.ts:1-79` — ConfigProgram 전체 패턴. `HOME` 디렉토리, `ConfigPath`, `initialize()`, `createDefaultConfig()` 메서드. 동일한 구조로 `~/point3_doc/`을 사용할 것.
  - `/Users/user/projects/point3-ledger-tool/bin/config/config.ts:1-5` — Point3LedgerProgramConfig 인터페이스 패턴. 동일하게 Point3DocConfig 작성.
  - `/Users/user/projects/point3-ledger-tool/bin/config/tigerbeetle/config.program.ts:1-151` — ConfigReadWriteProgram 구현 패턴. `writeConfig()`, `readConfig()`, `_setupCommands()` 메서드. `show`/`set` 커맨드 등록 방식 참고.
  - `/Users/user/projects/point3-ledger-tool/bin/config/tigerbeetle/config.ts:1-8` — 서비스별 Config 인터페이스 확장 패턴.
  - `/Users/user/projects/point3-ledger-tool/bin/config/index.ts:1-5` — 배럴 export 패턴.

  **API/Type References**:
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:22-27` — `SyncOptions` 인터페이스. `docS3Path` 필드가 config에서 제공할 값.

  **External References**:
  - NCP Object Storage API 문서: `https://api-fin.ncloud-docs.com/docs/storage-objectstorage` — endpoint, 인증 방식, region 정보
  - NCP API 인증키 관리: `https://api-fin.ncloud-docs.com/docs/common-ncpapi` — 인증키 발급 안내

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: config reset이 기본 설정 파일 생성
    Tool: Bash
    Steps:
      1. rm -f ~/point3_doc/.config (기존 config 삭제)
      2. npx ts-node doc-build/bin/main.ts config reset
      3. Assert: exit code 0
      4. cat ~/point3_doc/.config
      5. Assert: JSON에 "s3" 키 존재
      6. Assert: "endpoint" 값이 "https://kr.object.fin-ncloudstorage.com"
      7. Assert: "region" 값이 "fin-standard"
    Expected Result: 기본 설정이 생성됨
    Evidence: ~/point3_doc/.config 내용 캡처

  Scenario: config show가 현재 설정 출력
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts config reset
      2. npx ts-node doc-build/bin/main.ts config s3 show
      3. Assert: stdout에 "endpoint" 표시
      4. Assert: stdout에 "fin-standard" 표시
    Expected Result: 현재 S3 설정이 한국어로 출력됨

  Scenario: config set이 설정 변경
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts config s3 set --s3-path s3://test-bucket/docs
      2. cat ~/point3_doc/.config
      3. Assert: JSON에서 docS3Path가 "s3://test-bucket/docs"
    Expected Result: S3 경로가 업데이트됨

  Scenario: config 없이 show 실행 시 안내 메시지
    Tool: Bash
    Steps:
      1. rm -f ~/point3_doc/.config
      2. npx ts-node doc-build/bin/main.ts config s3 show 2>&1
      3. Assert: stderr에 "설정 파일이 없습니다" 포함
      4. Assert: stderr에 "config reset" 안내 포함
    Expected Result: 한국어 에러 메시지 + 해결 방법 출력
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `feat(doc-build): Config 관리 시스템 및 S3 클라이언트 팩토리 구현`
  - Files: `doc-build/bin/config/*, doc-build/bin/s3/*`
  - Pre-commit: `npm run build:dev`

---

- [x] 3. NCP S3 Client Factory + Validators

  **What to do**:
  - `doc-build/bin/s3/client-factory.ts` — NCP S3Client 팩토리:
    ```typescript
    // Credential 우선순위: CLI 옵션 > 환경변수
    // 1. --access-key / --secret-key CLI 옵션
    // 2. NCP_ACCESS_KEY_ID / NCP_SECRET_ACCESS_KEY 환경변수
    // 없으면 상세 에러 메시지 (NCP 인증키 발급 방법 안내)
    
    export function createNcpS3Client(options: {
      endpoint: string;
      region: string;
      accessKey?: string;
      secretKey?: string;
    }): S3Client
    ```
    - S3Client 생성 시 `forcePathStyle: true` 포함 (NCP Object Storage 요구사항)
    - credentials 누락 시 한국어 에러:
      ```
      "인증 정보가 없습니다.
      
      다음 중 하나의 방법으로 인증 정보를 제공하세요:
        1. CLI 옵션: --access-key <키> --secret-key <키>
        2. 환경변수: export NCP_ACCESS_KEY_ID=<키>
                     export NCP_SECRET_ACCESS_KEY=<키>
      
      NCP API 인증키는 NCP 콘솔 > 마이페이지 > API 인증키 관리에서 발급받을 수 있습니다.
      상세 안내: https://api-fin.ncloud-docs.com/docs/common-ncpapi"
      ```
  - `doc-build/bin/s3/index.ts` — 배럴 export
  - `doc-build/bin/validators/s3-path.ts` — S3 경로 검증:
    - `s3://` 접두사 확인
    - 버킷 이름 유효성 검사
    - 에러 시: `"S3 경로 형식이 올바르지 않습니다. 's3://버킷이름/경로' 형식으로 입력하세요. (입력값: ${input})"`
  - `doc-build/bin/validators/index.ts` — 배럴 export

  **Must NOT do**:
  - Config 파일에 credentials 저장 기능 구현
  - DocSanitizer 코드 수정
  - AWS 전용 기능 사용 (NCP 호환 API만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: S3Client 팩토리는 설정 조합 작업
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Task 1

  **References** (CRITICAL):

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/bin/validators/network.ts:1-68` — validator 패턴. `validateSocketAddress()` → `{ valid: boolean, error?: string }` 반환 패턴.

  **API/Type References**:
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:155-203` — `runS3Sync()` 메서드. `options.s3Client`를 받아 사용. S3Client 주입 인터페이스 확인.
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:290-297` — `parseS3Url()` 내부 함수. S3 URL 파싱 로직 참고 (검증 로직 작성 시).

  **External References**:
  - NCP Object Storage 인증 문서: `https://api-fin.ncloud-docs.com/docs/common-ncpapi` — API 인증키 관리 설명
  - NCP Object Storage 엔드포인트: `https://api-fin.ncloud-docs.com/docs/storage-objectstorage` — 금융 리전 endpoint 정보
  - AWS SDK S3Client with custom endpoint: S3Client 생성 시 `{ endpoint, region, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true }` 형태

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: S3Client 팩토리가 환경변수에서 credentials 읽기
    Tool: Bash
    Steps:
      1. NCP_ACCESS_KEY_ID=test NCP_SECRET_ACCESS_KEY=test npx ts-node -e "
         const { createNcpS3Client } = require('./doc-build/bin/s3/client-factory');
         const client = createNcpS3Client({ endpoint: 'https://kr.object.fin-ncloudstorage.com', region: 'fin-standard' });
         console.log(typeof client.send);
         "
      2. Assert: stdout에 "function" 출력
    Expected Result: S3Client가 정상 생성됨

  Scenario: credentials 없이 S3Client 생성 시 에러
    Tool: Bash
    Steps:
      1. unset NCP_ACCESS_KEY_ID NCP_SECRET_ACCESS_KEY
      2. npx ts-node -e "
         const { createNcpS3Client } = require('./doc-build/bin/s3/client-factory');
         try { createNcpS3Client({ endpoint: 'test', region: 'test' }); }
         catch(e) { console.log(e.message); }
         " 2>&1
      3. Assert: 출력에 "인증 정보가 없습니다" 포함
      4. Assert: 출력에 "NCP_ACCESS_KEY_ID" 포함
    Expected Result: 한국어 에러 + 환경변수 안내

  Scenario: S3 경로 validator
    Tool: Bash
    Steps:
      1. npx ts-node -e "
         const { validateS3Path } = require('./doc-build/bin/validators/s3-path');
         console.log(JSON.stringify(validateS3Path('s3://my-bucket/docs')));
         console.log(JSON.stringify(validateS3Path('invalid-path')));
         "
      2. Assert: 첫 번째 결과 valid: true
      3. Assert: 두 번째 결과 valid: false, error에 "S3 경로 형식" 포함
    Expected Result: 유효/무효 경로를 올바르게 판별
  ```

  **Commit**: YES (groups with Task 2)
  - Message: (Task 2와 동일 커밋)
  - Files: `doc-build/bin/s3/*, doc-build/bin/validators/*`

---

- [x] 4. `sanitize` 서브커맨드

  **What to do**:
  - `doc-build/bin/commands/sanitize.ts` — SanitizeProgram 클래스:
    - CLIProgram 확장
    - 커맨드: `sanitize <dir>`
    - 필수 옵션:
      - `-o, --output <path>`: 결과물 출력 디렉토리 (한국어: `"처리된 결과물을 저장할 디렉토리를 지정합니다. (필수)"`)
    - 선택 옵션:
      - `--repo <name>`: 레포 이름 override (한국어: `"레포지토리 이름을 수동 지정합니다. (미지정 시 git에서 자동 감지)"`)
      - `--branch <name>`: 브랜치 override
      - `--dry-run`: 미리보기 (한국어: `"실제 파일을 작성하지 않고 처리될 파일 목록만 표시합니다."`)
      - `-v, --verbose`: 상세 로그
      - `-q, --quiet`: 최소 로그
    - 동작 흐름:
      1. `DocSanitizer.findMarkdownFiles(dir)` + `DocSanitizer.findAssetFiles(dir)` 로 파일 목록 수집
      2. dry-run이면 파일 목록만 출력하고 종료
      3. tmp 디렉토리 생성 → 파일 복사
      4. `DocSanitizer.processDirectory(tmpDir)` 로 sanitize 실행
      5. `DocSanitizer.ensureRepositoryIndex(tmpDir, repo, branch)` 로 인덱스 생성
      6. tmp 결과물을 `--output` 디렉토리로 복사
      7. tmp 정리
    - 성공 출력 (한국어):
      ```
      문서 살균화 완료:
        처리된 파일: N개
        출력 디렉토리: /path/to/output
        레포: repo-name
        브랜치: branch-name
      ```
    - 에러 처리:
      - dir이 존재하지 않을 때: `"지정된 디렉토리가 존재하지 않습니다: ${dir}"`
      - .md 파일이 없을 때: `"문서 파일(.md, .mdx)을 찾을 수 없습니다. 문서 파일이 있는 디렉토리를 지정해주세요."`
      - output 미지정: Commander requiredOption이 자동 처리
    - 상세 도움말:
      ```
      point3-doc sanitize <dir>

      지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.
      처리 내용:
        - 누락된 frontmatter 자동 추가
        - HTML void 요소 수정 (<br> → <br />)
        - 닫히지 않은 HTML 태그 자동 닫기
        - MDX 코드 블록 내 중괄호 이스케이프
        - 레포지토리 인덱스(index.md) 자동 생성

      옵션:
        -o, --output <path>  처리된 결과물을 저장할 디렉토리 (필수)
        --repo <name>        레포지토리 이름 수동 지정 (기본: git에서 자동 감지)
        --branch <name>      브랜치 이름 수동 지정 (기본: git에서 자동 감지)
        --dry-run            실제 파일 작성 없이 처리될 파일 목록만 표시
        -v, --verbose        상세 로그 출력
        -q, --quiet          최소한의 로그만 출력

      사용 예시:
        $ point3-doc sanitize ./my-repo -o ./output
        $ point3-doc sanitize /path/to/repo -o /tmp/sanitized --verbose
        $ point3-doc sanitize . --dry-run
      ```

  **Must NOT do**:
  - DocSanitizer 핵심 로직 수정
  - S3 업로드 (sanitize는 로컬 처리만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 명확한 패턴 기반 커맨드 구현
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2

  **References** (CRITICAL):

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/bin/interactive/kernels/query.kernel.ts:1-139` — 서브커맨드 등록 패턴. `_setupCommands()`에서 command/option/action 등록 방식.
  - `/Users/user/projects/point3-ledger-tool/bin/interactive/kernels/utils.kernel.ts:1-87` — requiredOption/option 사용 패턴.

  **API/Type References**:
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:118-125` — `processDirectory()` 메서드 시그니처 및 동작.
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:299-313` — `findMarkdownFiles()` 메서드. 디렉토리에서 .md/.mdx 파일 탐색.
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:315-336` — `findAssetFiles()` 메서드. 이미지/PDF 에셋 탐색.
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:361-372` — `ensureRepositoryIndex()` 메서드.
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:102-114` — `getGitInfo()` 메서드. repo/branch 자동 감지.

  **Test References**:
  - `/Users/user/projects/point3-common-tool/doc-build/__tests__/doc-sanitizer.spec.ts:264-289` — `processDirectory` 테스트 예시. 테스트 패턴 참고.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: sanitize가 .md 파일을 처리하여 output에 저장
    Tool: Bash
    Steps:
      1. mkdir -p /tmp/test-sanitize-input
      2. echo "# Test Doc\n\n<br>\nContent" > /tmp/test-sanitize-input/test.md
      3. npx ts-node doc-build/bin/main.ts sanitize /tmp/test-sanitize-input -o /tmp/test-sanitize-output
      4. Assert: exit code 0
      5. cat /tmp/test-sanitize-output/test.md
      6. Assert: 파일에 "---" (frontmatter) 포함
      7. Assert: 파일에 "<br />" 포함 (void element 수정됨)
      8. ls /tmp/test-sanitize-output/index.md
      9. Assert: index.md 존재
    Expected Result: sanitize된 파일이 output 디렉토리에 저장됨
    Evidence: 출력 파일 내용 캡처

  Scenario: sanitize --dry-run이 파일 목록만 표시
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts sanitize /tmp/test-sanitize-input --dry-run -o /tmp/out 2>&1
      2. Assert: stdout에 "test.md" 포함
      3. Assert: /tmp/out 디렉토리가 비어있거나 존재하지 않음
    Expected Result: 파일 목록만 표시, 실제 파일 생성 없음

  Scenario: 존재하지 않는 디렉토리 지정 시 에러
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts sanitize /nonexistent -o /tmp/out 2>&1
      2. Assert: exit code != 0
      3. Assert: stderr에 "존재하지 않습니다" 포함
    Expected Result: 한국어 에러 메시지

  Scenario: .md 파일이 없는 디렉토리 지정 시 경고
    Tool: Bash
    Steps:
      1. mkdir -p /tmp/empty-dir
      2. npx ts-node doc-build/bin/main.ts sanitize /tmp/empty-dir -o /tmp/out 2>&1
      3. Assert: stderr 또는 stdout에 "문서 파일" 관련 메시지 포함
    Expected Result: 문서 파일 없음 안내
  ```

  **Commit**: YES (groups with Tasks 5, 6)
  - Message: `feat(doc-build): sanitize, sync, run 서브커맨드 구현`
  - Files: `doc-build/bin/commands/*`
  - Pre-commit: `npm run build:dev`

---

- [x] 5. `sync` 서브커맨드

  **What to do**:
  - `doc-build/bin/commands/sync.ts` — SyncProgram 클래스:
    - CLIProgram 확장
    - 커맨드: `sync <dir>`
    - 옵션:
      - `--s3-path <path>`: S3 경로 override (config fallback)
      - `--access-key <key>`: NCP Access Key (환경변수 fallback)
      - `--secret-key <key>`: NCP Secret Key (환경변수 fallback)
      - `--repo <name>`: 레포 이름 override
      - `--branch <name>`: 브랜치 override
      - `--dry-run`: 업로드할 파일 목록만 표시
      - `-v, --verbose` / `-q, --quiet`
    - 동작 흐름:
      1. Config에서 S3 설정 읽기 (endpoint, region, docS3Path)
      2. CLI 옵션으로 override
      3. `createNcpS3Client()`로 S3Client 생성
      4. `DocSanitizer.getAllFiles(dir)` 로 파일 목록 수집
      5. dry-run이면 파일 목록 + S3 대상 경로만 출력하고 종료
      6. `DocSanitizer.runS3Sync(dir, s3Dest, { s3Client })` 호출
    - S3 대상 경로 구성: `${s3Path}/${repo}/${branch}`
    - 한국어 도움말:
      ```
      point3-doc sync <dir>

      지정된 디렉토리의 문서를 NCP Object Storage에 동기화합니다.
      이미 살균화(sanitize)된 디렉토리를 대상으로 사용하세요.
      원격에만 존재하는 파일(orphan)은 자동 삭제됩니다.

      인증 정보 제공 방법 (우선순위 순):
        1. CLI 옵션: --access-key <키> --secret-key <키>
        2. 환경변수: NCP_ACCESS_KEY_ID, NCP_SECRET_ACCESS_KEY

      옵션:
        --s3-path <path>    S3 경로 (기본: config 설정값)
                            예: s3://my-bucket/docs
        --access-key <key>  NCP API Access Key
        --secret-key <key>  NCP API Secret Key
        --repo <name>       레포지토리 이름 (기본: git에서 자동 감지)
        --branch <name>     브랜치 이름 (기본: git에서 자동 감지)
        --dry-run            업로드할 파일 목록만 표시 (실제 업로드 없음)
        -v, --verbose        상세 로그 출력
        -q, --quiet          최소한의 로그만 출력

      사용 예시:
        $ point3-doc sync ./output --s3-path s3://my-bucket/docs --access-key xxx --secret-key xxx
        $ export NCP_ACCESS_KEY_ID=xxx && export NCP_SECRET_ACCESS_KEY=xxx
        $ point3-doc sync ./output
        $ point3-doc sync ./output --dry-run
      ```
    - 에러 처리:
      - S3 경로 없음 (config에도 없고 CLI에도 없을 때): `"S3 경로가 설정되지 않았습니다. --s3-path 옵션 또는 'point3-doc config s3 set --s3-path s3://...' 명령으로 설정하세요."`
      - credentials 없음: S3Client 팩토리의 한국어 에러 메시지 전달

  **Must NOT do**:
  - sanitize 처리 (sync는 이미 처리된 디렉토리만 업로드)
  - DocSanitizer 핵심 로직 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2, 3

  **References** (CRITICAL):

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/bin/interactive/kernels/query.kernel.ts:94-116` — 옵션 조합(option vs requiredOption) 사용 패턴.

  **API/Type References**:
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:155-203` — `runS3Sync()` 메서드. sourceDir, destinationUrl, options 파라미터. S3Client 주입 방식.
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:338-359` — `getAllFiles()` 메서드. 업로드 대상 파일 수집.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: sync --dry-run이 업로드 목록 표시
    Tool: Bash
    Steps:
      1. mkdir -p /tmp/test-sync-dir && echo "test" > /tmp/test-sync-dir/test.md
      2. npx ts-node doc-build/bin/main.ts sync /tmp/test-sync-dir --s3-path s3://test/docs --dry-run --access-key fake --secret-key fake 2>&1
      3. Assert: stdout에 "test.md" 포함
      4. Assert: stdout에 "s3://test/docs" 경로 정보 포함
    Expected Result: 업로드 대상 파일 목록이 표시되고 실제 업로드 없음

  Scenario: credentials 없이 sync 시 에러
    Tool: Bash
    Steps:
      1. unset NCP_ACCESS_KEY_ID NCP_SECRET_ACCESS_KEY
      2. npx ts-node doc-build/bin/main.ts sync /tmp/test-sync-dir --s3-path s3://test/docs 2>&1
      3. Assert: exit code != 0
      4. Assert: stderr에 "인증 정보가 없습니다" 포함
    Expected Result: 한국어 인증 에러 + 해결 방법 안내

  Scenario: S3 경로 없이 sync 시 에러
    Tool: Bash
    Steps:
      1. rm -f ~/point3_doc/.config
      2. npx ts-node doc-build/bin/main.ts sync /tmp/test-sync-dir --access-key test --secret-key test 2>&1
      3. Assert: exit code != 0
      4. Assert: stderr에 "S3 경로가 설정되지 않았습니다" 포함
    Expected Result: S3 경로 미설정 에러 + config 설정 안내
  ```

  **Commit**: YES (groups with Tasks 4, 6)
  - Message: (Task 4와 동일 커밋)

---

- [x] 6. `run` 서브커맨드 (Full Pipeline)

  **What to do**:
  - `doc-build/bin/commands/run.ts` — RunProgram 클래스:
    - CLIProgram 확장
    - 커맨드: `run <dir>`
    - 옵션: sync의 모든 옵션 포함 (s3-path, access-key, secret-key, repo, branch, dry-run, verbose, quiet)
    - 동작 흐름:
      1. Config에서 S3 설정 읽기
      2. CLI 옵션으로 override
      3. `createNcpS3Client()`로 S3Client 생성
      4. dry-run이면 `DocSanitizer.findMarkdownFiles()` + `findAssetFiles()`로 파일 목록만 출력하고 종료
      5. `DocSanitizer.process(dir, { docS3Path, s3Client, repoName, branchName, logger })` 직접 호출
    - **핵심**: DocSanitizer.process()가 내부적으로 tmp dir 생성/sanitize/index/sync/cleanup 전부 처리. CLI는 옵션을 모아서 전달만 함.
    - 한국어 도움말:
      ```
      point3-doc run <dir>

      문서 살균화(sanitize)부터 NCP Object Storage 동기화(sync)까지 전체 파이프라인을 실행합니다.
      
      처리 과정:
        1. 문서 파일 수집 (.md, .mdx, 이미지, PDF)
        2. 임시 작업 디렉토리에 복사 (원본 파일 수정 없음)
        3. MDX 호환 형식으로 살균화
        4. 레포지토리 인덱스(index.md) 생성
        5. NCP Object Storage에 동기화
        6. 임시 디렉토리 정리

      인증 정보 제공 방법 (우선순위 순):
        1. CLI 옵션: --access-key <키> --secret-key <키>
        2. 환경변수: NCP_ACCESS_KEY_ID, NCP_SECRET_ACCESS_KEY

      옵션:
        --s3-path <path>    S3 대상 경로 (기본: config 설정값)
        --access-key <key>  NCP API Access Key
        --secret-key <key>  NCP API Secret Key
        --repo <name>       레포지토리 이름 (기본: git에서 자동 감지)
        --branch <name>     브랜치 이름 (기본: git에서 자동 감지)
        --dry-run            실제 처리/업로드 없이 대상 파일 목록만 표시
        -v, --verbose        상세 로그 출력
        -q, --quiet          최소한의 로그만 출력

      사용 예시:
        # CI/CD 환경 (Naver Cloud Source Build)
        $ export NCP_ACCESS_KEY_ID=your-key
        $ export NCP_SECRET_ACCESS_KEY=your-secret
        $ point3-doc run . --s3-path s3://docs-bucket/docs

        # 로컬 개발 환경 (config에 S3 경로 설정된 경우)
        $ point3-doc config s3 set --s3-path s3://docs-bucket/docs
        $ point3-doc run ./my-repo --access-key xxx --secret-key xxx

        # 미리보기
        $ point3-doc run . --dry-run
      ```

  **Must NOT do**:
  - DocSanitizer.process() 로직 수정
  - 별도의 sanitize+sync 조합 로직 구현 (process()가 전부 처리)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2, 3

  **References** (CRITICAL):

  **API/Type References**:
  - `/Users/user/projects/point3-common-tool/doc-build/doc-sanitizer.ts:33-97` — `process()` 메서드 전체. rootDir과 options(docS3Path, s3Client, repoName, branchName, logger) 파라미터. 내부 tmp dir 라이프사이클 포함.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: run --dry-run이 대상 파일 목록 표시
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts run doc-build/.test_repo/point3-payment-domain --dry-run --s3-path s3://test/docs --access-key fake --secret-key fake 2>&1
      2. Assert: exit code 0
      3. Assert: stdout에 .md 파일 목록 포함
    Expected Result: test_repo의 문서 파일 목록 표시, 실제 처리/업로드 없음

  Scenario: run이 DocSanitizer.process() 호출 (mocked S3)
    Tool: Bash
    Steps:
      1. NCP_ACCESS_KEY_ID=test NCP_SECRET_ACCESS_KEY=test npx ts-node doc-build/bin/main.ts run doc-build/.test_repo/point3-payment-domain --s3-path s3://test-bucket/docs 2>&1
      2. Assert: stdout에 "완료" 또는 "completed" 관련 메시지 포함 (NCP 연결 실패해도 에러 메시지 확인)
    Expected Result: process() 호출이 실행됨 (실제 S3 미연결 시 에러 메시지 포함 가능)
  ```

  **Commit**: YES (groups with Tasks 4, 5)
  - Message: (Task 4와 동일 커밋)

---

- [x] 7. Entry Point + Banner + Help 통합 (`main.ts`)

  **What to do**:
  - `doc-build/bin/main.ts` — CLI 진입점:
    - `#!/usr/bin/env node` shebang
    - figlet 배너: `"Point3 Doc Tool"` (--quiet 시 숨김)
    - Commander 메인 프로그램:
      - `.name('point3-doc')`
      - `.description('포인트3 문서 관리 CLI 도구')`
      - `.version(packageJson.version)`
    - 서브커맨드 등록:
      - `configProgram.setupCommands(mainProgram)` — config
      - `sanitizeProgram.setupCommands(mainProgram)` — sanitize
      - `syncProgram.setupCommands(mainProgram)` — sync
      - `runProgram.setupCommands(mainProgram)` — run
    - 글로벌 옵션:
      - `-v, --verbose`: 전체 verbose 모드
      - `-q, --quiet`: 전체 quiet 모드
    - 명령어 없이 실행 시: 배너 + help 출력
    - 알 수 없는 명령어: `"오류: 알 수 없는 명령어입니다: ${args}. 사용 가능한 명령어를 보려면 --help를 사용하세요."`
    - `if (require.main == module)` 가드
    - 에러 핸들러: 최상위 catch에서 한국어 에러 출력
  - `doc-build/bin/commands/index.ts` — 배럴 export

  **Must NOT do**:
  - Interactive REPL 모드
  - 기존 doc-build 파일 수정

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (solo)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 4, 5, 6

  **References** (CRITICAL):

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/bin/main.ts:1-56` — 전체 진입점 패턴. Commander 프로그램 설정, 서브커맨드 등록, argv 길이 체크, 에러 핸들러. 이 구조를 거의 동일하게 사용.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 인자 없이 실행 시 배너 + help 출력
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts 2>&1
      2. Assert: stdout에 "Point3" 포함 (figlet 배너)
      3. Assert: stdout에 "sanitize" 포함 (서브커맨드 목록)
      4. Assert: stdout에 "sync" 포함
      5. Assert: stdout에 "run" 포함
      6. Assert: stdout에 "config" 포함
    Expected Result: ASCII 배너 + 한국어 도움말 출력

  Scenario: --help 옵션 출력 확인
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts --help 2>&1
      2. Assert: stdout에 모든 서브커맨드(sanitize, sync, run, config) 설명 포함
      3. Assert: 모든 설명이 한국어
    Expected Result: 한국어 도움말 출력

  Scenario: 알 수 없는 명령어 에러
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts unknown-command 2>&1
      2. Assert: stderr에 "알 수 없는 명령어" 포함
    Expected Result: 한국어 에러 메시지

  Scenario: sanitize --help 서브커맨드 도움말
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts sanitize --help 2>&1
      2. Assert: stdout에 "--output" 포함
      3. Assert: stdout에 "--dry-run" 포함
      4. Assert: stdout에 "사용 예시" 포함
    Expected Result: sanitize 커맨드의 상세 한국어 도움말 + 사용 예시

  Scenario: --quiet 모드에서 배너 숨김
    Tool: Bash
    Steps:
      1. npx ts-node doc-build/bin/main.ts --quiet --help 2>&1
      2. Assert: stdout에 figlet 배너 없음 (Point3 ASCII art 없음)
      3. Assert: 도움말은 여전히 출력됨
    Expected Result: quiet 모드에서 배너 숨김
  ```

  **Commit**: YES
  - Message: `feat(doc-build): CLI 진입점 및 도움말 통합`
  - Files: `doc-build/bin/main.ts, doc-build/bin/commands/index.ts`
  - Pre-commit: `npm run build:dev`

---

- [x] 8. CLI Unit Tests

  **What to do**:
  - `doc-build/__tests__/cli/` 디렉토리 생성
  - `doc-build/__tests__/cli/config.spec.ts` — Config 시스템 테스트:
    - config reset이 기본값으로 파일 생성하는지
    - config set이 값을 올바르게 업데이트하는지
    - config read가 올바른 타입으로 반환하는지
    - config 파일 없을 때 적절한 에러 발생하는지
  - `doc-build/__tests__/cli/s3-client-factory.spec.ts` — S3Client 팩토리 테스트:
    - CLI 옵션 credentials로 S3Client 생성
    - 환경변수 credentials로 S3Client 생성
    - CLI 옵션이 환경변수보다 우선하는지
    - credentials 없을 때 에러 메시지 확인
    - endpoint/region이 올바르게 설정되는지
  - `doc-build/__tests__/cli/validators.spec.ts` — Validator 테스트:
    - S3 경로 유효/무효 케이스
  - `doc-build/__tests__/cli/commands.spec.ts` — 커맨드 테스트:
    - Commander argument/option 파싱 검증
    - 필수 옵션 누락 시 에러 처리
    - dry-run 플래그 처리
  - 기존 jest 설정에 `moduleNameMapper` 추가 (path aliases용):
    - `"^@doc-build/(.*)$": "<rootDir>/doc-build/$1"`
    - `"^@doc-build$": "<rootDir>/doc-build"`

  **Must NOT do**:
  - 기존 `doc-sanitizer.spec.ts` 수정
  - 실제 NCP Object Storage 연결 테스트 (mock only)
  - E2E 테스트 (스코프 외)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (sequential)
  - **Blocks**: Task 9
  - **Blocked By**: Task 7

  **References** (CRITICAL):

  **Test References**:
  - `/Users/user/projects/point3-common-tool/doc-build/__tests__/doc-sanitizer.spec.ts:1-478` — 기존 테스트 패턴. jest.mock 사용법, describe/it 구조, mock logger 패턴. 동일한 스타일로 CLI 테스트 작성.
  - `/Users/user/projects/point3-common-tool/jest.config.js` — jest 설정 파일 (moduleNameMapper 추가 필요 여부 확인).

  **Pattern References**:
  - `/Users/user/projects/point3-ledger-tool/package.json:26-52` — jest moduleNameMapper 설정 패턴. path alias별 매핑 방식.

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 전체 테스트 스위트 통과
    Tool: Bash
    Steps:
      1. npm test 2>&1
      2. Assert: exit code 0
      3. Assert: stdout에 "PASS" 포함
      4. Assert: stdout에 "FAIL" 미포함
    Expected Result: 기존 테스트 + 새 CLI 테스트 모두 통과

  Scenario: CLI 테스트만 실행
    Tool: Bash
    Steps:
      1. npx jest doc-build/__tests__/cli/ 2>&1
      2. Assert: exit code 0
      3. Assert: 4개 테스트 파일 모두 통과
    Expected Result: CLI 단위 테스트 전부 통과
  ```

  **Commit**: YES
  - Message: `test(doc-build): CLI 레이어 단위 테스트 추가`
  - Files: `doc-build/__tests__/cli/*, jest.config.js (또는 package.json jest 설정)`
  - Pre-commit: `npm test`

---

- [x] 9. Final Build Verification + Cleanup

  **What to do**:
  - `npm run build:dev` 실행하여 전체 빌드 성공 확인
  - `dist/doc-build/bin/main.js` 실행 권한 확인
  - 빌드된 JS로 `node dist/doc-build/bin/main.js --help` 실행하여 정상 동작 확인
  - `npm test` 전체 테스트 통과 확인
  - 불필요한 `.js` 아티팩트가 소스 트리에 없는지 확인 (handover doc 참고: "항상 생성된 .js 아티팩트를 소스 트리에서 제거")
  - `.gitignore`에 `dist/` 포함 확인

  **Must NOT do**:
  - npm publish (사용자 요청 시에만)
  - DocSanitizer 코드 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (after Task 8)
  - **Blocks**: None (final)
  - **Blocked By**: Task 8

  **References**:

  **Documentation References**:
  - Handover doc (line 69): "항상 생성된 .js 아티팩트를 소스 트리에서 제거하여 런타임 혼란 방지"

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 빌드된 CLI가 정상 동작
    Tool: Bash
    Steps:
      1. npm run build:dev
      2. Assert: exit code 0
      3. node dist/doc-build/bin/main.js --help
      4. Assert: stdout에 "point3-doc" 포함
      5. Assert: stdout에 "sanitize" 포함
    Expected Result: 빌드된 JS가 정상 실행됨

  Scenario: 전체 테스트 통과
    Tool: Bash
    Steps:
      1. npm test
      2. Assert: exit code 0
    Expected Result: 모든 테스트 통과

  Scenario: 소스 트리에 .js 아티팩트 없음
    Tool: Bash
    Steps:
      1. find doc-build/bin -name "*.js" -not -path "*/node_modules/*" 2>/dev/null
      2. Assert: 출력 없음 (소스 트리에 .js 파일 없음)
    Expected Result: 소스 트리 깨끗
  ```

  **Commit**: YES
  - Message: `chore(doc-build): CLI 최종 빌드 검증 및 정리`
  - Files: `.gitignore (필요시)`
  - Pre-commit: `npm test && npm run build:dev`

---

## Commit Strategy

| After Task(s) | Message | Key Files | Verification |
|---------------|---------|-----------|--------------|
| 1 | `feat(doc-build): CLI 빌드 인프라 및 스캐폴딩 구성` | package.json, tsconfig.json, bin/program.ts | `npm run build:dev` |
| 2, 3 | `feat(doc-build): Config 관리 시스템 및 S3 클라이언트 팩토리 구현` | bin/config/*, bin/s3/*, bin/validators/* | `npm run build:dev` |
| 4, 5, 6 | `feat(doc-build): sanitize, sync, run 서브커맨드 구현` | bin/commands/* | `npm run build:dev` |
| 7 | `feat(doc-build): CLI 진입점 및 도움말 통합` | bin/main.ts | `npm run build:dev` |
| 8 | `test(doc-build): CLI 레이어 단위 테스트 추가` | __tests__/cli/* | `npm test` |
| 9 | `chore(doc-build): CLI 최종 빌드 검증 및 정리` | .gitignore | `npm test && npm run build:dev` |

---

## Success Criteria

### Verification Commands
```bash
# 빌드 성공
npm run build:dev         # Expected: exit code 0

# 전체 테스트 통과
npm test                  # Expected: all tests pass

# CLI 도움말 출력
node dist/doc-build/bin/main.js --help  # Expected: 한국어 도움말 + 서브커맨드 목록

# sanitize 실행
node dist/doc-build/bin/main.js sanitize doc-build/.test_repo/point3-payment-domain -o /tmp/test-output
# Expected: sanitize된 파일이 /tmp/test-output에 저장됨

# config 관리
node dist/doc-build/bin/main.js config reset     # Expected: ~/point3_doc/.config 생성
node dist/doc-build/bin/main.js config s3 show    # Expected: S3 설정 출력
```

### Final Checklist
- [ ] 모든 서브커맨드(sanitize, sync, run, config) 정상 동작
- [ ] 모든 도움말이 한국어로 출력
- [ ] NCP Object Storage 설정 가이드가 help에 포함
- [ ] --dry-run 모드가 모든 관련 커맨드에서 동작
- [ ] --verbose / --quiet 로그 레벨 제어 동작
- [ ] 에러 메시지에 해결 방법이 안내됨
- [ ] Config 파일에 credentials가 저장되지 않음
- [ ] DocSanitizer 핵심 로직이 변경되지 않음
- [ ] figlet ASCII 배너 정상 표시 (--quiet 시 숨김)
- [ ] 모든 테스트 통과 (기존 + 신규)
- [ ] 빌드 출력물에 실행 권한 부여됨
