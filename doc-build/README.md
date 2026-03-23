# point3-doc CLI

포인트3 문서 관리 CLI 도구 (`point3-doc`)는 마크다운 문서를 MDX 호환 형식으로 살균화(sanitize)하고, NCP Object Storage에 자동으로 동기화하는 기능을 제공합니다. 이 도구는 특히 Docusaurus와 같은 MDX 기반 문서 사이트의 콘텐츠 관리와 CI/CD 파이프라인 통합을 위해 설계되었습니다.

## 🚀 주요 기능

- **MDX 호환성 확보**: 
  - HTML void 요소 수정 (예: `<br>` → `<br />`, `<img>` → `<img />`)
  - 닫히지 않은 HTML 태그 (`details`, `summary`, `div`, `section`) 자동 닫기
  - MDX 코드 블록 내 중괄호(`{`, `}`) 이스케이프 처리
- **Frontmatter 자동 생성**: 문서 상단에 frontmatter가 없을 경우 파일명을 기반으로 제목(`title`)을 포함한 frontmatter를 자동 생성합니다.
- **레포지토리 인덱스 생성**: 해당 레포지토리와 브랜치의 모든 문서 목록을 포함하는 `index.md`를 자동으로 생성하여 탐색을 돕습니다.
- **S3 동기화 (Smart Sync)**: 
  - NCP Object Storage와 로컬 디렉토리를 동기화합니다.
  - 로컬에는 없지만 원격(S3)에만 존재하는 파일(orphan)을 자동으로 감지하여 삭제합니다.
- **격리된 작업 환경**: 원본 파일을 직접 수정하지 않고 시스템 임시 디렉토리에서 모든 처리를 수행한 후 결과를 출력하거나 업로드합니다.

## 📦 설치 및 설정

### 설치

`point3-common-tool` 패키지에 포함되어 있으며, 전역으로 링크하여 사용할 수 있습니다.

```bash
# 저장소 루트에서
npm install
npm run build
npm link
```

### 초기 설정

```bash
# 기본 설정 파일 생성 (~/point3_doc/.config)
point3-doc config reset

# 현재 S3 설정 확인
point3-doc config s3 show

# S3 대상 경로 설정
point3-doc config s3 set --s3-path s3://your-bucket-name/docs-root
```

## 🛠 명령어 가이드

### 1. config
CLI 도구의 환경 설정을 관리합니다. 설정은 `~/point3_doc/.config` 파일에 저장됩니다.

- `point3-doc config s3 show`: 현재 설정된 S3 엔드포인트, 리전, 기본 경로를 조회합니다.
- `point3-doc config s3 set`: S3 관련 설정을 업데이트합니다.
  - `--s3-path <path>`: 기본 S3 버킷 경로 (예: `my-bucket/docs`)
  - `--endpoint <url>`: S3 엔드포인트 (기본: `https://kr.object.fin-ncloudstorage.com`)
  - `--region <region>`: S3 리전 (기본: `fin-standard`)
- `point3-doc config reset`: 모든 설정을 초기 기본값으로 복원합니다.

### 2. sanitize
로컬 디렉토리의 문서를 살균화하여 지정된 출력 디렉토리에 저장합니다. S3 업로드 없이 로컬에서 결과물만 확인하고 싶을 때 사용합니다.

```bash
point3-doc sanitize <dir> --output ./dist-docs [options]
```

- **주요 옵션**:
  - `-o, --output <path>`: (필수) 처리된 결과물을 저장할 디렉토리 경로
  - `--repo <name>`: 레포지토리 이름 (미지정 시 git 정보에서 자동 감지)
  - `--branch <name>`: 브랜치 이름 (미지정 시 git 정보에서 자동 감지)
  - `--dry-run`: 실제 파일을 생성하지 않고 처리 대상 목록만 출력
  - `-v, --verbose`: 상세 처리 로그 출력

### 3. sync
이미 살균화 처리가 완료된 디렉토리를 NCP Object Storage에 동기화합니다.

```bash
point3-doc sync ./dist-docs --s3-path s3://my-bucket/docs [options]
```

- **주요 옵션**:
  - `--s3-path <path>`: S3 대상 경로 (기본값은 config 설정 사용)
  - `--access-key <key>`: NCP API Access Key
  - `--secret-key <key>`: NCP API Secret Key
  - `--dry-run`: 실제 업로드/삭제를 수행하지 않고 대상 목록만 확인

### 4. run (권장)
살균화부터 S3 동기화까지 전체 파이프라인을 한 번에 실행합니다. CI/CD 환경에서 가장 유용하게 사용됩니다.

```bash
point3-doc run <dir> [options]
```

- **전체 파이프라인 과정**:
  1. 대상 디렉토리에서 문서(`.md`, `.mdx`) 및 에셋(이미지, PDF 등) 수집
  2. 임시 작업 디렉토리 생성 및 파일 복사
  3. MDX 호환성 살균화 처리
  4. 레포지토리 인덱스(`index.md`) 생성
  5. NCP Object Storage로 최종 결과물 동기화
  6. 임시 디렉토리 자동 정리

## ☁️ NCP Object Storage 통합

`point3-doc`은 네이버 클라우드(NCP) 금융 클라우드 환경을 기본으로 지원합니다.

- **기본 엔드포인트**: `https://kr.object.fin-ncloudstorage.com`
- **기본 리전**: `fin-standard`
- **인증 정보 제공 방법 (우선순위 순)**:
  1. CLI 옵션: `--access-key`, `--secret-key`
  2. 환경변수: `NCP_ACCESS_KEY_ID`, `NCP_SECRET_ACCESS_KEY`

## 🤖 CI/CD 활용 예시

### Naver Cloud Source Build

`buildspec.yml` 파일에 다음과 같이 설정하여 문서 자동 배포를 구현할 수 있습니다.

```yaml
steps:
  - name: Publish Documentation
    image: node:18
    commands:
      - npm install -g point3-common-tool
      - export NCP_ACCESS_KEY_ID=$MY_ACCESS_KEY
      - export NCP_SECRET_ACCESS_KEY=$MY_SECRET_KEY
      - point3-doc run ./docs --s3-path s3://p3-internal-docs/manuals --verbose
```

## 🏗 아키텍처 개요

- **DocSanitizer (Core)**: `doc-sanitizer.ts`에 정의된 네임스페이스로, 파일 시스템 탐색, 정규표현식 기반의 MDX 살균화, AWS SDK를 이용한 S3 동기화 로직을 담당합니다.
- **CLI Layer**: `commander`를 기반으로 구축되어 있으며, `bin/commands` 디렉토리에 각 명령어의 실행 로직이 분리되어 있습니다.
- **Config System**: `~/point3_doc/.config` 경로에 JSON 형태로 설정을 유지하며, 명령어 실행 시 CLI 옵션이 설정값보다 우선순위를 가집니다.

## 🔍 문제 해결 (Troubleshooting)

- **"S3 경로가 설정되지 않았습니다"**: `point3-doc config s3 set --s3-path ...` 명령으로 기본 경로를 설정하거나, 실행 시 `--s3-path` 옵션을 반드시 포함하세요.
- **"Access Denied" (S3 오류)**: 제공된 Access Key와 Secret Key가 해당 버킷에 대한 권한(List, Put, Delete)을 가지고 있는지 확인하세요.
- **HTML 태그 관련 경고**: MDX는 매우 엄격한 HTML 문법을 요구합니다. `point3-doc`이 자동으로 수정하지 못하는 복잡한 구조의 경우, `--verbose` 로그를 통해 문제가 되는 파일을 확인하세요.
- **Dry-run 활용**: 실제 운영 환경에 적용하기 전 반드시 `--dry-run` 옵션을 사용하여 어떤 파일들이 업로드되거나 삭제되는지 미리 확인하는 것을 권장합니다.
