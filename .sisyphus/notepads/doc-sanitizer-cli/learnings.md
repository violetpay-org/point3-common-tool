# Learnings

## Wave 1 - Task 1: Infrastructure Setup (COMPLETED)

### Configuration Updates
- **package.json**: Added `bin` field pointing to `dist/doc-build/bin/main.js`
- **package.json**: Added `build:dev` script: `rm -rf dist && tsc && tsc-alias && chmod +x dist/doc-build/bin/main.js`
- **package.json**: Added dependencies: `commander@^14.0.0`, `figlet@^1.9.4`
- **package.json**: Added devDependencies: `tsc-alias@^1.8.16`, `@types/figlet`
- **tsconfig.json**: Added path aliases for `@doc-build/*` and `@doc-build`

### Directory Structure Created
- `doc-build/bin/` (root)
- `doc-build/bin/config/` (configuration)
- `doc-build/bin/config/s3/` (S3 config)
- `doc-build/bin/commands/` (CLI commands)
- `doc-build/bin/s3/` (S3 utilities)
- `doc-build/bin/validators/` (validation logic)

### CLIProgram Pattern
- Created `doc-build/bin/program.ts` with abstract `CLIProgram` class
- Pattern replicated from `point3-ledger-tool/bin/program.ts`
- Implements `setupCommands()` guard pattern with `commandAttached` flag
- Enforces abstract `_setupCommands()` implementation in subclasses

### Build Verification
- `npm install` succeeded: 19 packages added
- `npm run build:dev` succeeded with expected chmod warning (main.js not yet created)
- Compiled output verified:
  - `dist/doc-build/bin/program.d.ts` (type definitions)
  - `dist/doc-build/bin/program.js` (compiled code)
  - `dist/doc-build/bin/program.js.map` (source map)

### Key Insights
1. **chmod Warning**: The `chmod +x dist/doc-build/bin/main.js` command fails because main.js doesn't exist yet. This is expected - it will be created when implementing the main entry point in Task 2.
2. **Path Aliases**: TypeScript path aliases configured correctly for `@doc-build` imports
3. **tsc-alias**: Successfully processes path aliases during build
4. **Commander Integration**: Ready for CLI command setup in subsequent tasks

### Blockers Resolved
- None. Infrastructure setup complete and ready for Task 2 (Main Entry Point).

### Next Steps (Task 2)
- Create `doc-build/bin/main.ts` entry point
- Implement CLI program initialization with figlet banner
- Set up command routing structure

---

## Wave 1 - Task 3: NCP S3 Client Factory + Validators (COMPLETED)

### Files Created
- `doc-build/bin/s3/client-factory.ts` - NCP S3 Client factory with credential management
- `doc-build/bin/s3/index.ts` - Barrel export for S3 module
- `doc-build/bin/validators/s3-path.ts` - S3 path validator with bucket name validation
- `doc-build/bin/validators/index.ts` - Barrel export for validators module

### createNcpS3Client Implementation
**Location**: `doc-build/bin/s3/client-factory.ts`

**Credential Priority**:
1. CLI options (`accessKey`, `secretKey` parameters)
2. Environment variables (`NCP_ACCESS_KEY_ID`, `NCP_SECRET_ACCESS_KEY`)

**Key Features**:
- Returns `S3Client` configured for NCP Object Storage
- Includes `forcePathStyle: true` (NCP requirement - critical for path-style bucket access)
- Throws detailed Korean error message when credentials missing
- Error includes:
  - Both credential methods (CLI options + env vars)
  - NCP console URL for API key management
  - Documentation link: https://api-fin.ncloud-docs.com/docs/common-ncpapi

**Error Message Format**:
```
인증 정보가 없습니다.

다음 중 하나의 방법으로 인증 정보를 제공하세요:
  1. CLI 옵션: --access-key <키> --secret-key <키>
  2. 환경변수: export NCP_ACCESS_KEY_ID=<키>
               export NCP_SECRET_ACCESS_KEY=<키>

NCP API 인증키는 NCP 콘솔 > 마이페이지 > API 인증키 관리에서 발급받을 수 있습니다.
상세 안내: https://api-fin.ncloud-docs.com/docs/common-ncpapi
```

### validateS3Path Implementation
**Location**: `doc-build/bin/validators/s3-path.ts`

**Validation Rules**:
1. Must be a string
2. Must start with `s3://`
3. Must have bucket name after `s3://`
4. Bucket name must match regex: `/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/`
   - Lowercase letters, numbers, hyphens only
   - 3-63 characters total
   - Cannot start/end with hyphen

**Return Pattern**: `{ valid: boolean, error?: string }`
- Follows ledger-tool validator pattern from `point3-ledger-tool/bin/validators/network.ts`

**Test Results** (All Passed):
- ✅ Valid paths: `s3://my-bucket/path/to/file`, `s3://abc`, `s3://a-b-c-123`
- ✅ Invalid paths rejected: `https://bucket/path`, `s3://`, `s3://My-Bucket`, `s3://bucket_name`, `s3://-bucket`, `s3://bucket-`
- ✅ Empty string rejected with appropriate error

### Reference Patterns Used
1. **Validator Pattern**: Replicated from `point3-ledger-tool/bin/validators/network.ts:10-42`
   - Return type: `{ valid: boolean; error?: string }`
   - Korean error messages with input value in parentheses
   - Type checking before validation

2. **S3 URL Parsing**: Referenced from `doc-sanitizer.ts:290-297`
   - `parseS3Url()` logic for bucket/prefix extraction
   - `s3://` prefix handling

3. **S3Client Usage**: Referenced from `doc-sanitizer.ts:155-203`
   - `runS3Sync()` function shows S3Client instantiation pattern
   - Confirmed `@aws-sdk/client-s3` already in dependencies

### Build Verification
- LSP diagnostics clean on both files
- Test execution successful (12/12 test cases passed)
- No TypeScript compilation errors

### Key Insights
1. **forcePathStyle: true** is critical for NCP Object Storage - without it, S3Client will use virtual-hosted-style URLs which NCP doesn't support
2. **Bucket name validation** prevents common errors (uppercase, underscores, invalid hyphens)
3. **Credential priority** allows flexible deployment (local dev with env vars, CI/CD with CLI options)
4. **Korean error messages** improve UX for Korean-speaking team

### Dependencies Confirmed
- `@aws-sdk/client-s3` already in package.json (from existing DocSanitizer)
- No additional dependencies required

### Blockers Resolved
- None. S3 client factory and validators ready for use in sync/run commands.

### Next Steps (Task 4+)
- Task 4: Config system (S3ConfigProgram, config.json management)
- Task 5: Sync command (uses createNcpS3Client + validateS3Path)
- Task 6: Run command (uses createNcpS3Client + validateS3Path)

---

## Wave 1 - Task 2: Config System (COMPLETED)

### Files Created
- `doc-build/bin/config/config.ts` - Point3DocConfig interface
- `doc-build/bin/config/program.ts` - ConfigProgram and ConfigReadWriteProgram base classes
- `doc-build/bin/config/s3/config.ts` - S3Config interface extending Point3DocConfig
- `doc-build/bin/config/s3/config.program.ts` - S3ConfigProgram with show/set commands
- `doc-build/bin/config/index.ts` - Barrel exports

### Config System Architecture

**Config File Location**: `~/point3_doc/.config`
- Follows ledger-tool pattern (`~/point3_ledger/.config`)
- Auto-initialized on first use with default values
- JSON format for easy manual editing

**ConfigProgram Pattern**:
- Abstract `ConfigReadWriteProgram` base class for config subsystems
- Concrete `ConfigProgram` manages multiple config subsystems
- Constructor calls `initialize()` to ensure config exists
- `reset` command recreates config with defaults

**S3ConfigProgram Implementation**:
- Default values:
  - `docS3Path`: "" (empty, must be set by user)
  - `endpoint`: "https://kr.object.fin-ncloudstorage.com"
  - `region`: "fin-standard"
- Commands:
  - `config s3 show`: Displays current S3 settings with NCP setup guide
  - `config s3 set`: Updates S3 settings (--s3-path, --endpoint, --region)
  - `config reset`: Resets all config to defaults

### NCP Object Storage Setup Guide (Embedded in CLI)
Included in `config s3 show` output:
1. NCP 콘솔 접속: https://console.fin-ncloud.com
2. Object Storage 메뉴에서 버킷 생성
3. 마이페이지 > API 인증키 관리에서 Access Key/Secret Key 발급
4. 환경변수 또는 CLI 옵션으로 인증키 전달
5. 문서: https://api-fin.ncloud-docs.com/docs/storage-objectstorage

### Test Results (All Passed)
**Test Method**: `npx ts-node -r tsconfig-paths/register` (requires `tsconfig-paths` package)

**config reset**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-config.ts config reset
# Creates ~/point3_doc/.config with default S3 values
```

**config s3 show**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-config.ts config s3 show
NCP Object Storage S3 설정:
  버킷 경로: (미설정)
  엔드포인트: https://kr.object.fin-ncloudstorage.com
  리전: fin-standard

💡 NCP Object Storage 설정 가이드:
  1. NCP 콘솔 접속: https://console.fin-ncloud.com
  ...
```

**config s3 set**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-config.ts config s3 set --s3-path my-bucket/docs
S3 설정이 업데이트되었습니다:
  버킷 경로: my-bucket/docs

$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-config.ts config s3 set --endpoint https://custom.endpoint.com --region custom-region
S3 설정이 업데이트되었습니다:
  엔드포인트: https://custom.endpoint.com
  리전: custom-region
```

**Final config state**:
```json
{
  "s3": {
    "docS3Path": "my-bucket/docs",
    "endpoint": "https://custom.endpoint.com",
    "region": "custom-region"
  }
}
```

### Reference Patterns Used
1. **ConfigProgram**: Replicated from `point3-ledger-tool/bin/config/program.ts:19-77`
   - HOME directory pattern (`point3_doc/` vs `point3_ledger/`)
   - `initialize()` with overwrite flag
   - `createDefaultConfig()` delegates to subsystems

2. **ConfigReadWriteProgram**: Replicated from `point3-ledger-tool/bin/config/program.ts:10-17`
   - Abstract base class for config subsystems
   - `configPath` property set by ConfigProgram
   - Abstract `writeConfig()` and `readConfig()` methods

3. **S3ConfigProgram**: Replicated from `point3-ledger-tool/bin/config/tigerbeetle/config.program.ts:9-149`
   - DEFAULT_CONFIG pattern
   - `writeConfig()` with partial updates
   - `readConfig()` with type assertions
   - `show` and `set` commands with Korean output

### Build Verification
- LSP diagnostics clean on all files
- `npm run build:dev` succeeded
- Compiled output verified:
  - `dist/doc-build/bin/config/config.js`
  - `dist/doc-build/bin/config/program.js`
  - `dist/doc-build/bin/config/s3/config.js`
  - `dist/doc-build/bin/config/s3/config.program.js`
  - `dist/doc-build/bin/config/index.js`

### Key Insights
1. **Auto-initialization**: ConfigProgram constructor calls `initialize()`, ensuring config always exists
2. **Partial updates**: `writeConfig()` only updates specified fields, preserving others
3. **Type safety**: S3Config interface extends Point3DocConfig for type consistency
4. **Error messages**: Include resolution guidance ("'point3-doc config reset'으로 초기화하세요")
5. **tsconfig-paths**: Required for ts-node to resolve `@doc-build/*` path aliases

### Dependencies Added
- `tsconfig-paths@^1.0.0` (devDependency) - Required for ts-node path alias resolution

### Blockers Resolved
- None. Config system complete and ready for integration into main CLI.

### Next Steps
- Integrate ConfigProgram into main.ts entry point
- Use config values in sync/run commands
- Add config validation in commands (e.g., check if docS3Path is set)

---

## Wave 1 - Task 5: Sync Subcommand (COMPLETED)

### Files Created
- `doc-build/bin/commands/sync.ts` - SyncProgram class with S3 sync functionality
- `doc-build/bin/test-sync.ts` - Test harness for sync command

### SyncProgram Implementation
**Location**: `doc-build/bin/commands/sync.ts`

**Command**: `sync <dir>`

**Options**:
- `--s3-path <path>`: S3 경로 (기본: config 설정값)
- `--access-key <key>`: NCP API Access Key
- `--secret-key <key>`: NCP API Secret Key
- `--repo <name>`: 레포지토리 이름 (기본: git에서 자동 감지)
- `--branch <name>`: 브랜치 이름 (기본: git에서 자동 감지)
- `--dry-run`: 업로드할 파일 목록만 표시 (실제 업로드 없음)
- `-v, --verbose`: 상세 로그 출력
- `-q, --quiet`: 최소한의 로그만 출력

### Workflow Implementation
1. **입력 디렉토리 검증**: 디렉토리 존재 여부 및 타입 확인
2. **S3 설정 읽기**: ConfigProgram에서 S3 config 로드, CLI 옵션으로 오버라이드
3. **Git 정보 가져오기**: DocSanitizer.getGitInfo()로 repo/branch 자동 감지
4. **S3 destination 생성**: `${s3Path}/${repo}/${branch}` 형식
5. **파일 목록 수집**: DocSanitizer.getAllFiles()로 문서 파일 수집
6. **Dry-run 모드**: 파일 목록 + S3 destination 출력 후 종료
7. **S3 Client 생성**: createNcpS3Client()로 NCP S3 Client 생성
8. **S3 동기화 실행**: DocSanitizer.runS3Sync()에 s3Client 주입

### S3 Destination Format
- Pattern: `${s3Path}/${repo}/${branch}`
- Example: `s3://my-bucket/docs/point3-common-tool/feat/doc-build`
- Git info auto-detection from input directory
- Manual override via `--repo` and `--branch` options

### Error Handling (Korean Messages)
**Missing S3 Path**:
```
❌ 오류: S3 경로가 설정되지 않았습니다.

다음 중 하나의 방법으로 S3 경로를 설정하세요:
  1. CLI 옵션: --s3-path s3://my-bucket/docs
  2. Config 설정: point3-doc config s3 set --s3-path s3://my-bucket/docs

현재 설정 확인: point3-doc config s3 show
```

**Missing Directory**:
```
❌ 오류: 디렉토리를 찾을 수 없습니다: /path/to/dir
```

**Missing Credentials**: Delegated to createNcpS3Client() (from Task 3)

### Test Results (All Passed)
**Test Method**: `npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts`

**Dry-run with auto-detected git info**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts sync doc-build/.test_sync_input --dry-run

📦 동기화 대상:
  로컬: /Users/user/projects/point3-common-tool/doc-build/.test_sync_input
  원격: test/point3-common-tool/feat/doc-build

📄 발견된 파일: 1개

🔍 [DRY-RUN] 업로드될 파일 목록:

  - test.md

📍 S3 업로드 대상: test/point3-common-tool/feat/doc-build

✅ Dry-run 완료. 실제 업로드는 수행되지 않았습니다.
```

**Dry-run with custom repo/branch**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts sync doc-build/.test_sync_input --dry-run --repo my-repo --branch main

📦 동기화 대상:
  로컬: /Users/user/projects/point3-common-tool/doc-build/.test_sync_input
  원격: test/my-repo/main
```

**Dry-run with custom S3 path**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts sync doc-build/.test_sync_input --dry-run --s3-path s3://my-bucket/docs

📦 동기화 대상:
  로컬: /Users/user/projects/point3-common-tool/doc-build/.test_sync_input
  원격: s3://my-bucket/docs/point3-common-tool/feat/doc-build
```

**Error: Missing directory**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts sync doc-build/nonexistent --dry-run
❌ 오류: 디렉토리를 찾을 수 없습니다: /Users/user/projects/point3-common-tool/doc-build/nonexistent
```

**Error: Missing S3 path** (after config reset):
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts config reset
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts sync doc-build/.test_sync_input --dry-run
❌ 오류: S3 경로가 설정되지 않았습니다.
...
```

**Help output**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sync.ts sync --help
Usage: test-sync sync [options] <dir>

지정된 디렉토리의 문서를 NCP Object Storage에 동기화합니다.

이미 살균화(sanitize)된 디렉토리를 대상으로 사용하세요.
원격에만 존재하는 파일(orphan)은 자동 삭제됩니다.

인증 정보 제공 방법 (우선순위 순):
  1. CLI 옵션: --access-key <키> --secret-key <키>
  2. 환경변수: NCP_ACCESS_KEY_ID, NCP_SECRET_ACCESS_KEY

Options:
  --s3-path <path>    S3 경로 (기본: config 설정값)
                      예: s3://my-bucket/docs
  --access-key <key>  NCP API Access Key
  --secret-key <key>  NCP API Secret Key
  --repo <name>       레포지토리 이름 (기본: git에서 자동 감지)
  --branch <name>     브랜치 이름 (기본: git에서 자동 감지)
  --dry-run           업로드할 파일 목록만 표시 (실제 업로드 없음)
  -v, --verbose       상세 로그 출력
  -q, --quiet         최소한의 로그만 출력
  -h, --help          display help for command


사용 예시:
  $ point3-doc sync ./output --s3-path s3://my-bucket/docs --access-key xxx --secret-key xxx
  $ export NCP_ACCESS_KEY_ID=xxx && export NCP_SECRET_ACCESS_KEY=xxx
  $ point3-doc sync ./output
  $ point3-doc sync ./output --dry-run
```

### Reference Patterns Used
1. **Option Combinations**: Replicated from `point3-ledger-tool/bin/interactive/kernels/query.kernel.ts:94-116`
   - Multiple optional parameters with validation
   - Error message + help output when required combinations missing

2. **ConfigProgram Integration**: 
   - Constructor injection of ConfigProgram instance
   - `readS3Config()` method reads from ConfigProgram.ConfigPath
   - CLI options override config values

3. **DocSanitizer API Usage**:
   - `getAllFiles()` (338-359): Collects .md, .mdx, and asset files
   - `runS3Sync()` (155-203): Performs S3 upload with S3Client injection via options.s3Client
   - `getGitInfo()`: Auto-detects repo name and branch from git

4. **S3 Client Factory**: 
   - `createNcpS3Client()` from Task 3
   - Credential priority: CLI options > environment variables
   - Throws detailed Korean error if credentials missing

### Build Verification
- LSP diagnostics clean on sync.ts
- `npm run build:dev` succeeded
- Compiled output verified: `dist/doc-build/bin/commands/sync.js`

### Key Insights
1. **ConfigProgram Dependency**: SyncProgram requires ConfigProgram instance in constructor to read S3 config
2. **S3Client Injection**: DocSanitizer.runS3Sync() accepts s3Client via options.s3Client (not default instantiation)
3. **Dry-run Mode**: Shows file list + S3 destination without creating S3Client (avoids credential validation)
4. **Git Auto-detection**: DocSanitizer.getGitInfo() extracts repo/branch from .git directory
5. **Logger Interface**: DocSanitizer expects LoggerService with log/error/warn/debug/verbose methods
6. **Workflow Comments**: Numbered step markers (1-8) help navigate complex async function (pattern from sanitize.ts)

### Dependencies Confirmed
- `@aws-sdk/client-s3` (existing)
- `@aws-sdk/lib-storage` (existing, for Upload class)
- ConfigProgram from Task 2
- createNcpS3Client from Task 3
- DocSanitizer methods (existing)

### Blockers Resolved
- None. Sync command complete and ready for integration into main CLI.

### Next Steps (Task 7)
- Integrate SyncProgram into main.ts entry point
- Wire up ConfigProgram → SyncProgram dependency
- Test end-to-end sync workflow with real S3 credentials

---

## Wave 1 - Task 6: Run Subcommand (COMPLETED)

### Files Created
- `doc-build/bin/commands/run.ts` - RunProgram class with full pipeline execution

### RunProgram Implementation
**Location**: `doc-build/bin/commands/run.ts`

**Command**: `run <dir>`

**Options**:
- `--s3-path <path>`: S3 대상 경로 (기본: config 설정값)
- `--access-key <key>`: NCP API Access Key
- `--secret-key <key>`: NCP API Secret Key
- `--repo <name>`: 레포지토리 이름 (기본: git에서 자동 감지)
- `--branch <name>`: 브랜치 이름 (기본: git에서 자동 감지)
- `--dry-run`: 실제 처리/업로드 없이 대상 파일 목록만 표시
- `-v, --verbose`: 상세 로그 출력
- `-q, --quiet`: 최소한의 로그만 출력

### Full Pipeline Workflow
**Key Design**: RunProgram delegates ALL processing to `DocSanitizer.process()` which handles:
1. Tmp dir creation (isolated workspace)
2. File collection (markdown + assets)
3. Sanitization (MDX compatibility)
4. Index generation (repository index.md)
5. S3 sync (upload to NCP Object Storage)
6. Cleanup (remove tmp dir)

**RunProgram Responsibilities** (minimal, by design):
1. Read S3 config from `~/point3_doc/.config`
2. Override with CLI options
3. Create S3Client via `createNcpS3Client()`
4. If `--dry-run`: show file list via `findMarkdownFiles()` + `findAssetFiles()` and exit
5. Call `DocSanitizer.process()` with all options

### Dry-run Mode Implementation
**Purpose**: Preview files without processing or uploading

**Implementation**:
```typescript
if (options.dryRun) {
    const docFiles = await DocSanitizer.findMarkdownFiles(dir, logger);
    const assetFiles = await DocSanitizer.findAssetFiles(dir);
    // Display file lists
    return; // Exit before S3Client creation
}
```

**Output Format**:
```
🔍 Dry-run 모드: 처리 대상 파일 목록

디렉토리: .
S3 경로: s3://test-bucket/docs

📄 문서 파일 (1개):
  - README.md

🖼️  에셋 파일 (0개):

총 1개 파일이 처리됩니다.
```

### Help Text (Korean)
**Comprehensive documentation embedded in CLI**:
- Processing steps (6 stages)
- Authentication methods (CLI options vs env vars)
- Usage examples:
  - CI/CD environment (Source Build)
  - Local development (with config)
  - Preview mode (dry-run)

### Error Handling (Korean Messages)
**Missing S3 Path**:
```
❌ 오류: S3 경로가 설정되지 않았습니다.

다음 중 하나의 방법으로 S3 경로를 설정하세요:
  1. CLI 옵션: --s3-path s3://bucket-name/path
  2. Config 설정: point3-doc config s3 set --s3-path s3://bucket-name/path
```

**Missing Credentials**: Delegated to `createNcpS3Client()` (from Task 3)

### Test Results (All Passed)
**Test Method**: `npx ts-node -r tsconfig-paths/register doc-build/bin/test-run.ts`

**Help output**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-run.ts run --help
Usage: test-run run [options] <dir>

문서 살균화(sanitize)부터 NCP Object Storage 동기화(sync)까지 전체 파이프라인을 실행합니다

Arguments:
  dir                 처리할 문서 디렉토리 경로

Options:
  --s3-path <path>    S3 대상 경로 (기본: config 설정값)
  --access-key <key>  NCP API Access Key
  --secret-key <key>  NCP API Secret Key
  --repo <name>       레포지토리 이름 (기본: git에서 자동 감지)
  --branch <name>     브랜치 이름 (기본: git에서 자동 감지)
  --dry-run           실제 처리/업로드 없이 대상 파일 목록만 표시
  -v, --verbose       상세 로그 출력
  -q, --quiet         최소한의 로그만 출력
  -h, --help          display help for command


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

**Dry-run with config S3 path**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-run.ts config s3 set --s3-path s3://test-bucket/docs
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-run.ts run . --dry-run

🔍 Dry-run 모드: 처리 대상 파일 목록

디렉토리: .
S3 경로: s3://test-bucket/docs

📄 문서 파일 (1개):
  - README.md

🖼️  에셋 파일 (0개):

총 1개 파일이 처리됩니다.
```

**Dry-run with CLI override**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-run.ts run . --dry-run --s3-path s3://override-bucket/path

🔍 Dry-run 모드: 처리 대상 파일 목록

디렉토리: .
S3 경로: s3://override-bucket/path

📄 문서 파일 (1개):
  - README.md

🖼️  에셋 파일 (0개):

총 1개 파일이 처리됩니다.
```

**Error: Missing credentials** (without dry-run):
```bash
$ unset NCP_ACCESS_KEY_ID && unset NCP_SECRET_ACCESS_KEY
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-run.ts run .

❌ 오류: 인증 정보가 없습니다.

다음 중 하나의 방법으로 인증 정보를 제공하세요:
  1. CLI 옵션: --access-key <키> --secret-key <키>
  2. 환경변수: export NCP_ACCESS_KEY_ID=<키>
               export NCP_SECRET_ACCESS_KEY=<키>

NCP API 인증키는 NCP 콘솔 > 마이페이지 > API 인증키 관리에서 발급받을 수 있습니다.
상세 안내: https://api-fin.ncloud-docs.com/docs/common-ncpapi
```

### Reference Patterns Used
1. **DocSanitizer.process() API** (doc-sanitizer.ts:33-97):
   - Single entry point for full pipeline
   - Handles tmp dir lifecycle internally
   - Accepts `SyncOptions & { repoName?, branchName? }`
   - Returns `Promise<void>` (throws on error)

2. **S3ConfigProgram Integration**:
   - Constructor injection of S3ConfigProgram instance (not ConfigProgram)
   - `readConfig<S3Config>()` method reads from config file
   - CLI options override config values

3. **Dry-run Pattern**:
   - Uses `DocSanitizer.findMarkdownFiles()` and `findAssetFiles()` (public APIs)
   - Exits before S3Client creation (avoids credential validation)
   - Shows file counts and lists

4. **Logger Setup**:
   - NestJS Logger instance
   - Quiet mode: suppress log() output
   - Verbose mode: enable debug() output

### Build Verification
- LSP diagnostics clean on run.ts
- `npm run build:dev` succeeded (expected chmod warning for main.js)
- Test harness verified all scenarios

### Key Insights
1. **Minimal CLI Logic**: RunProgram is intentionally thin - all complex logic lives in DocSanitizer.process()
2. **S3ConfigProgram Dependency**: Must inject S3ConfigProgram (not ConfigProgram) to access readConfig()
3. **Dry-run Before S3Client**: Dry-run exits before createNcpS3Client() to avoid credential validation
4. **DocSanitizer.process() Handles Everything**: Tmp dir, sanitize, index, sync, cleanup all internal
5. **CLI Option Override**: `options.s3Path || s3Config.docS3Path` pattern for config override
6. **Error Delegation**: Credential errors delegated to createNcpS3Client() for consistent messaging

### Dependencies Confirmed
- `@aws-sdk/client-s3` (existing)
- `@nestjs/common` (existing, for Logger)
- S3ConfigProgram from Task 2
- createNcpS3Client from Task 3
- DocSanitizer.process() (existing)
- DocSanitizer.findMarkdownFiles() (existing)
- DocSanitizer.findAssetFiles() (existing)

### Blockers Resolved
- None. Run command complete and ready for integration into main CLI.

### Next Steps (Task 7)
- Integrate RunProgram into main.ts entry point
- Wire up S3ConfigProgram → RunProgram dependency
- Test end-to-end run workflow with real S3 credentials
- Verify full pipeline: sanitize → index → sync → cleanup

---

## Wave 1 - Task 4: Sanitize Subcommand (COMPLETED)

### Files Created
- `doc-build/bin/commands/sanitize.ts` - SanitizeProgram class with local sanitization workflow
- `doc-build/bin/test-sanitize.ts` - Test harness for sanitize command

### SanitizeProgram Implementation
**Location**: `doc-build/bin/commands/sanitize.ts`

**Command**: `sanitize <dir>`

**Options**:
- `-o, --output <path>`: 처리된 결과물을 저장할 디렉토리 (필수)
- `--repo <name>`: 레포지토리 이름 수동 지정 (기본: git에서 자동 감지)
- `--branch <name>`: 브랜치 이름 수동 지정 (기본: git에서 자동 감지)
- `--dry-run`: 실제 파일 작성 없이 처리될 파일 목록만 표시
- `-v, --verbose`: 상세 로그 출력
- `-q, --quiet`: 최소한의 로그만 출력

### Workflow Implementation (10 Phases)
1. **입력 디렉토리 검증**: 디렉토리 존재 여부 및 타입 확인
2. **마크다운 및 에셋 파일 찾기**: `DocSanitizer.findMarkdownFiles()` + `findAssetFiles()`
3. **Dry-run 모드**: 파일 목록 출력 후 종료 (실제 처리 없음)
4. **출력 디렉토리 준비**: 절대 경로 변환
5. **임시 디렉토리 생성**: `fs.mkdtemp()` with `doc-sanitize-` prefix
6. **파일 복사**: 입력 → 임시 디렉토리 (원본 보존)
7. **마크다운 파일 살균화**: `DocSanitizer.processContent()` 적용
8. **Git 정보 가져오기 및 인덱스 생성**: `DocSanitizer.getGitInfo()` + `ensureRepositoryIndex()`
9. **출력 디렉토리로 복사**: 임시 → 출력 (기존 출력 디렉토리 삭제 후 재생성)
10. **임시 디렉토리 정리**: `fs.rm()` with `recursive: true`

### Key Design Decisions
**Local Processing Only**: 
- No S3 upload (unlike `run` command)
- No ConfigProgram dependency (no config needed)
- Output to local filesystem only

**Tmp Directory Pattern**:
- Isolates processing from input directory (원본 파일 수정 없음)
- Uses `os.tmpdir()` + `fs.mkdtemp()` for unique tmp dir
- Cleanup in `finally` block ensures no tmp dir leaks

**Git Info Auto-detection**:
- Uses `DocSanitizer.getGitInfo()` to extract repo/branch from `.git`
- Falls back to `unknown-repo`/`unknown-branch` if git not available
- Manual override via `--repo` and `--branch` options

**Error Handling (Korean Messages)**:
- Directory not found: `❌ 오류: 디렉토리를 찾을 수 없습니다: ${path}`
- Not a directory: `❌ 오류: '${path}'는 디렉토리가 아닙니다.`
- No markdown files: `❌ 오류: '${path}'에서 .md 또는 .mdx 파일을 찾을 수 없습니다.`
- Generic errors: `❌ 오류 발생: ${error.message}` (with stack trace in verbose mode)

### Test Results (All Passed)
**Test Method**: `npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts`

**Dry-run mode**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/test-sanitize-input --dry-run -o /tmp/test-output

📄 발견된 파일:
  - 마크다운: 1개
  - 에셋: 0개

🔍 [DRY-RUN] 처리될 파일 목록:

마크다운 파일:
  - test.md

✅ Dry-run 완료. 실제 파일은 생성되지 않았습니다.
```

**Actual processing with verbose output**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/test-sanitize-input -o /tmp/test-output -v

[VERBOSE] 입력 디렉토리 확인: /tmp/test-sanitize-input
[VERBOSE] 마크다운 파일 검색 중...
[VERBOSE] 에셋 파일 검색 중...

📄 발견된 파일:
  - 마크다운: 1개
  - 에셋: 0개
[VERBOSE] 출력 디렉토리: /tmp/test-output
[VERBOSE] 임시 디렉토리 생성: /var/folders/.../doc-sanitize-DFCTwh

📋 파일 복사 중...
[VERBOSE]   복사: test.md

🧹 마크다운 파일 살균화 중...
[VERBOSE] 처리 중: test.md
[VERBOSE]   ✓ 수정됨
  수정된 파일: 1/1개

📑 레포지토리 인덱스 생성 중...
[VERBOSE] Git 정보: unknown-repo (unknown-branch)
  ✓ index.md 생성 완료

📦 출력 디렉토리로 복사 중...
[VERBOSE]   복사: index.md
[VERBOSE]   복사: test.md

✅ 살균화 완료!
   출력 위치: /tmp/test-output
   처리된 파일: 1개
[VERBOSE] 임시 디렉토리 삭제: /var/folders/.../doc-sanitize-DFCTwh
```

**Sanitization verification** (input vs output):
```markdown
# Input: /tmp/test-sanitize-input/test.md
# Test Document

This is a test document with some issues.

<br>
<img src='test.png'>

```javascript
const obj = { key: 'value' };
```

# Output: /tmp/test-output/test.md
---
title: Test
---

# Test Document

This is a test document with some issues.

<br />
<img src='test.png' />

```javascript
const obj = { key: 'value' };
```
```

**Git info auto-detection** (with git repo):
```bash
$ cd /tmp/test-sanitize-input && git init && git remote add origin https://github.com/test/my-repo.git && git checkout -b feature/test && git commit -m "test"
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/test-sanitize-input -o /tmp/test-output -q

# Output: /tmp/test-output/index.md
---
title: my-repo - feature/test
---

# my-repo (feature/test)

- [test](test.md)
```

**Manual repo/branch override**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/test-sanitize-input -o /tmp/test-output --repo custom-project --branch production

# Output: /tmp/test-output/index.md
---
title: custom-project - production
---

# custom-project (production)

- [test](test.md)
```

**Asset file handling**:
```bash
$ mkdir -p /tmp/test-sanitize-input/images && echo "fake png" > /tmp/test-sanitize-input/images/test.png
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/test-sanitize-input -o /tmp/test-output

📄 발견된 파일:
  - 마크다운: 2개
  - 에셋: 1개

✅ 살균화 완료!
   처리된 파일: 3개

$ ls -R /tmp/test-output
doc-with-image.md  images  index.md  test.md

/tmp/test-output/images:
test.png
```

**Error: Directory not found**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /nonexistent -o /tmp/test-output
❌ 오류: 디렉토리를 찾을 수 없습니다: /nonexistent
```

**Error: No markdown files**:
```bash
$ mkdir -p /tmp/empty-dir
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/empty-dir -o /tmp/test-output
❌ 오류: '/tmp/empty-dir'에서 .md 또는 .mdx 파일을 찾을 수 없습니다.
```

**Error: Missing required option**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize /tmp/test-sanitize-input
error: required option '-o, --output <path>' not specified
```

**Help output**:
```bash
$ npx ts-node -r tsconfig-paths/register doc-build/bin/test-sanitize.ts sanitize --help
Usage: point3-doc sanitize [options] <dir>

지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.

처리 내용:
  - 누락된 frontmatter 자동 추가
  - HTML void 요소 수정 (<br> → <br />)
  - 닫히지 않은 HTML 태그 자동 닫기
  - MDX 코드 블록 내 중괄호 이스케이프
  - 레포지토리 인덱스(index.md) 자동 생성

Options:
  -o, --output <path>  처리된 결과물을 저장할 디렉토리 (필수)
  --repo <name>        레포지토리 이름 수동 지정 (기본: git에서 자동 감지)
  --branch <name>      브랜치 이름 수동 지정 (기본: git에서 자동 감지)
  --dry-run            실제 파일 작성 없이 처리될 파일 목록만 표시
  -v, --verbose        상세 로그 출력
  -q, --quiet          최소한의 로그만 출력
  -h, --help           display help for command


사용 예시:
  $ point3-doc sanitize ./my-repo -o ./output
  $ point3-doc sanitize /path/to/repo -o /tmp/sanitized --verbose
  $ point3-doc sanitize . --dry-run -o ./output
  $ point3-doc sanitize ../docs -o ./sanitized --repo my-project --branch main
```

### Reference Patterns Used
1. **CLIProgram Pattern**: Replicated from `point3-ledger-tool/bin/interactive/kernels/query.kernel.ts:10-139`
   - Extends `CLIProgram` abstract class
   - Implements `_setupCommands(mainProgram: Command)` method
   - Uses `mainProgram.command()` for subcommand registration

2. **Option Registration**: Replicated from `point3-ledger-tool/bin/interactive/kernels/utils.kernel.ts:14-22`
   - `requiredOption()` for mandatory options
   - `option()` for optional flags
   - `addHelpText('after', ...)` for usage examples

3. **DocSanitizer API Usage**:
   - `findMarkdownFiles()` (299-313): Recursive markdown file discovery
   - `findAssetFiles()` (315-336): Recursive asset file discovery
   - `processContent()` (141-150): MDX sanitization logic
   - `getGitInfo()` (102-114): Git repo/branch extraction
   - `ensureRepositoryIndex()` (361-372): Index.md generation

4. **Workflow Step Markers**: 
   - Numbered comments (1-10) for navigation in complex async function
   - Pattern established in sync.ts (Task 5) and run.ts (Task 6)
   - Helps readers understand multi-phase processing flow

### Build Verification
- LSP diagnostics clean on sanitize.ts
- `npm run build` succeeded
- Test harness verified all scenarios (dry-run, actual processing, git detection, errors)

### Key Insights
1. **No ConfigProgram Dependency**: Sanitize is local-only, no S3 config needed
2. **Tmp Directory Isolation**: Prevents accidental modification of input files
3. **Git Info Fallback**: Gracefully handles non-git directories with `unknown-repo`/`unknown-branch`
4. **Frontmatter Auto-addition**: `DocSanitizer.processContent()` adds frontmatter if missing
5. **Void Element Fixing**: `<br>` → `<br />`, `<img>` → `<img />` for MDX compatibility
6. **Index Generation**: `ensureRepositoryIndex()` creates index.md with file links
7. **Asset Preservation**: Copies images/PDFs alongside markdown files
8. **Cleanup Guarantee**: `finally` block ensures tmp dir removal even on error

### Dependencies Confirmed
- `commander` (existing, for CLI)
- `fs/promises` (Node.js built-in)
- `path` (Node.js built-in)
- `os` (Node.js built-in)
- DocSanitizer methods (existing)

### Blockers Resolved
- None. Sanitize command complete and ready for integration into main CLI.

### Next Steps (Task 7)
- Integrate SanitizeProgram into main.ts entry point
- Test end-to-end sanitize workflow with various input directories
- Verify sanitization correctness (frontmatter, void elements, MDX escaping)

---

## Wave 4 - Task 7: Entry Point + Banner + Help Integration (COMPLETED)

### Files Created
- `doc-build/bin/main.ts` - CLI entry point with figlet banner and Commander setup
- `doc-build/bin/commands/index.ts` - Barrel export for all command programs

### main.ts Implementation
**Location**: `doc-build/bin/main.ts`

**Shebang**: `#!/usr/bin/env node` (enables direct execution)

**Key Components**:
1. **Program Initialization**:
   - S3ConfigProgram → ConfigProgram (config subsystem)
   - SanitizeProgram, SyncProgram, RunProgram (command programs)
   - Commander main program with name/description/version

2. **Global Options**:
   - `-v, --verbose`: 상세 로그 출력
   - `-q, --quiet`: 최소한의 로그만 출력

3. **Subcommand Registration**:
   - `config` (ConfigProgram)
   - `sanitize` (SanitizeProgram)
   - `sync` (SyncProgram)
   - `run` (RunProgram)

4. **No-args Behavior**:
   - Shows figlet banner: "Point3 Doc Tool" (Standard font)
   - Hidden with `--quiet` flag
   - Displays help and exits

5. **Unknown Command Handler**:
   - Korean error: `오류: 알 수 없는 명령어입니다: ${args}. 사용 가능한 명령어를 보려면 --help를 사용하세요.`
   - Exits with code 1

6. **Top-level Error Handler**:
   - `if (require.main == module)` guard
   - Catches all errors from `main()`
   - Korean error: `CLI 실행 중 오류 발생: ${errorMessage}`
   - Exits with code 1

### Package.json Path Fix
**Issue**: `require('../../package.json')` failed in dist/ because path changed after compilation
**Solution**: Changed to `require('../../../package.json')` to account for `dist/doc-build/bin/` structure

### Import Path Fixes
**Issue**: `@doc-build/*` path aliases caused module resolution errors with ts-node
**Root Cause**: 
- ts-node hangs when loading modules with certain dependencies (mime-types, @nestjs/common Logger)
- Path aliases work in compiled code but not in ts-node without tsconfig-paths

**Solution**: Changed all imports to relative paths:
- `@doc-build/bin/program` → `../program`
- `@doc-build/bin/config/program` → `../program`

### DocSanitizer Logger Fix
**Issue**: `new Logger("DocSanitizer")` at module load time caused ts-node to hang
**Root Cause**: NestJS Logger requires application context, hangs when instantiated outside NestJS app

**Solution**: Lazy initialization pattern:
```typescript
let _defaultLogger: Logger | undefined;
function getDefaultLogger(): Logger {
    if (!_defaultLogger) {
        _defaultLogger = new Logger("DocSanitizer");
    }
    return _defaultLogger;
}
```

### Test Results (All Passed)
**Test Method**: `./dist/doc-build/bin/main.js` (compiled executable)

**No args (shows banner + help)**:
```bash
$ ./dist/doc-build/bin/main.js
  ____       _       _   _____   ____               _____           _ 
 |  _ \ ___ (_)_ __ | |_|___ /  |  _ \  ___   ___  |_   _|__   ___ | |
 | |_) / _ \| | '_ \| __| |_ \  | | | |/ _ \ / __|   | |/ _ \ / _ \| |
 |  __/ (_) | | | | | |_ ___) | | |_| | (_) | (__    | | (_) | (_) | |
 |_|   \___/|_|_| |_|\__|____/  |____/ \___/ \___|   |_|\___/ \___/|_|
                                                                      

Usage: point3-doc [options] [command]

포인트3 문서 관리 CLI 도구

Options:
  -V, --version             output the version number
  -v, --verbose             상세 로그 출력
  -q, --quiet               최소한의 로그만 출력
  -h, --help                display help for command

Commands:
  config                    다양한 configuration 설정 및 조회
  sanitize [options] <dir>  지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.
  sync [options] <dir>      지정된 디렉토리의 문서를 NCP Object Storage에 동기화합니다.
  run [options] <dir>       문서 살균화(sanitize)부터 NCP Object Storage 동기화(sync)까지 전체 파이프라인을 실행합니다
```

**--help (no banner)**:
```bash
$ ./dist/doc-build/bin/main.js --help
Usage: point3-doc [options] [command]

포인트3 문서 관리 CLI 도구

Options:
  -V, --version             output the version number
  -v, --verbose             상세 로그 출력
  -q, --quiet               최소한의 로그만 출력
  -h, --help                display help for command

Commands:
  config                    다양한 configuration 설정 및 조회
  sanitize [options] <dir>  지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.
  sync [options] <dir>      지정된 디렉토리의 문서를 NCP Object Storage에 동기화합니다.
  run [options] <dir>       문서 살균화(sanitize)부터 NCP Object Storage 동기화(sync)까지 전체 파이프라인을 실행합니다
```

**sanitize --help (Korean subcommand help)**:
```bash
$ ./dist/doc-build/bin/main.js sanitize --help
Usage: point3-doc sanitize [options] <dir>

지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.

처리 내용:
  - 누락된 frontmatter 자동 추가
  - HTML void 요소 수정 (<br> → <br />)
  - 닫히지 않은 HTML 태그 자동 닫기
  - MDX 코드 블록 내 중괄호 이스케이프
  - 레포지토리 인덱스(index.md) 자동 생성

Options:
  -o, --output <path>  처리된 결과물을 저장할 디렉토리 (필수)
  --repo <name>        레포지토리 이름 수동 지정 (기본: git에서 자동 감지)
  --branch <name>      브랜치 이름 수동 지정 (기본: git에서 자동 감지)
  --dry-run            실제 파일 작성 없이 처리될 파일 목록만 표시
  -v, --verbose        상세 로그 출력
  -q, --quiet          최소한의 로그만 출력
  -h, --help           display help for command

사용 예시:
  $ point3-doc sanitize ./my-repo -o ./output
  $ point3-doc sanitize /path/to/repo -o /tmp/sanitized --verbose
  $ point3-doc sanitize . --dry-run -o ./output
  $ point3-doc sanitize ../docs -o ./sanitized --repo my-project --branch main
```

**unknown command (Korean error)**:
```bash
$ ./dist/doc-build/bin/main.js unknown
오류: 알 수 없는 명령어입니다: unknown. 사용 가능한 명령어를 보려면 --help를 사용하세요.
```

**--quiet (hides banner)**:
```bash
$ ./dist/doc-build/bin/main.js --quiet
Usage: point3-doc [options] [command]

포인트3 문서 관리 CLI 도구

Options:
  -V, --version             output the version number
  -v, --verbose             상세 로그 출력
  -q, --quiet               최소한의 로그만 출력
  -h, --help                display help for command

Commands:
  config                    다양한 configuration 설정 및 조회
  sanitize [options] <dir>  지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.
  sync [options] <dir>      지정된 디렉토리의 문서를 NCP Object Storage에 동기화합니다.
  run [options] <dir>       문서 살균화(sanitize)부터 NCP Object Storage 동기화(sync)까지 전체 파이프라인을 실행합니다
```

### Build Verification
- `npm run build:dev` succeeded
- Executable created: `dist/doc-build/bin/main.js`
- Executable permissions set: `chmod +x dist/doc-build/bin/main.js`
- All subcommands registered and accessible
- LSP diagnostics clean (except stale errors in test files)

### Reference Patterns Used
1. **Main Entry Point**: Replicated from `point3-ledger-tool/bin/main.ts:1-56`
   - Shebang line
   - Commander program setup
   - Subcommand registration via `setupCommands()`
   - `process.argv.length <= 2` check for no-args case
   - `command:*` event handler for unknown commands
   - `require.main == module` guard
   - Top-level error handler with `process.exit(1)`

2. **Figlet Banner**:
   - Font: 'Standard'
   - Text: 'Point3 Doc Tool'
   - Hidden with `--quiet` flag via `mainProgram.opts()`

3. **Korean Error Messages**:
   - Unknown command: `오류: 알 수 없는 명령어입니다: ${args}. 사용 가능한 명령어를 보려면 --help를 사용하세요.`
   - Top-level error: `CLI 실행 중 오류 발생: ${errorMessage}`

### Key Insights
1. **ts-node Limitations**: 
   - Hangs with certain module imports (mime-types, NestJS Logger at module load)
   - Path aliases require tsconfig-paths registration
   - Compiled code (node dist/...) works reliably

2. **Lazy Logger Initialization**: 
   - NestJS Logger must be lazy-initialized to avoid ts-node hangs
   - Pattern: `let _logger; function getLogger() { if (!_logger) _logger = new Logger(); return _logger; }`

3. **Package.json Path**: 
   - Must account for dist/ structure: `../../../package.json` from `dist/doc-build/bin/main.js`

4. **Figlet Banner Control**: 
   - Check `mainProgram.opts().quiet` before showing banner
   - Allows `--quiet` to suppress banner while still showing help

5. **Subcommand Registration Order**: 
   - ConfigProgram first (provides config for other commands)
   - SanitizeProgram, SyncProgram, RunProgram (independent order)

6. **Error Exit Codes**: 
   - Unknown command: `process.exit(1)`
   - Top-level error: `process.exit(1)`
   - No-args help: `process.exit(0)`

### Dependencies Confirmed
- `commander@^14.0.0` (existing)
- `figlet@^1.9.4` (existing)
- `@types/figlet` (existing, devDependency)
- All command programs (Tasks 2, 4, 5, 6)

### Blockers Resolved
- ts-node hang: Fixed by lazy Logger initialization in DocSanitizer
- Path alias errors: Fixed by using relative imports
- Package.json path: Fixed by adjusting relative path for dist/ structure

### Next Steps (Task 8)
- Unit tests for main.ts entry point
- Integration tests for full CLI workflows
- End-to-end testing with real S3 credentials
- Documentation updates (README, usage examples)