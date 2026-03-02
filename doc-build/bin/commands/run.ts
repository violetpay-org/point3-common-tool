import { Command } from 'commander';
import { CLIProgram } from '../program';
import { S3ConfigProgram } from '../config/s3/config.program';
import { S3Config } from '../config/s3/config';
import { createNcpS3Client } from '../s3';
import { DocSanitizer } from '../../doc-sanitizer';
import { Logger } from '@nestjs/common';

/**
 * RunProgram - Full pipeline execution (sanitize + index + sync)
 * 
 * Workflow:
 * 1. Read S3 config from ~/point3_doc/.config
 * 2. Override with CLI options (--s3-path, --access-key, --secret-key, --repo, --branch)
 * 3. Create S3Client via createNcpS3Client()
 * 4. If --dry-run: show file list and exit
 * 5. Call DocSanitizer.process() which handles:
 *    - Tmp dir creation
 *    - Sanitization
 *    - Index generation
 *    - S3 sync
 *    - Cleanup
 */
export class RunProgram extends CLIProgram {
    constructor(private readonly s3ConfigProgram: S3ConfigProgram) {
        super();
    }

    protected async _setupCommands(mainProgram: Command): Promise<void> {
        mainProgram
            .command('run')
            .description('문서 살균화(sanitize)부터 NCP Object Storage 동기화(sync)까지 전체 파이프라인을 실행합니다')
            .argument('<dir>', '처리할 문서 디렉토리 경로')
            .option('--s3-path <path>', 'S3 대상 경로 (기본: config 설정값)')
            .option('--access-key <key>', 'NCP API Access Key')
            .option('--secret-key <key>', 'NCP API Secret Key')
            .option('--repo <name>', '레포지토리 이름 (기본: git에서 자동 감지)')
            .option('--branch <name>', '브랜치 이름 (기본: git에서 자동 감지)')
            .option('--dry-run', '실제 처리/업로드 없이 대상 파일 목록만 표시')
            .option('-v, --verbose', '상세 로그 출력')
            .option('-q, --quiet', '최소한의 로그만 출력')
            .addHelpText('after', `

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
`)
            .action(async (dir: string, options: {
                s3Path?: string;
                accessKey?: string;
                secretKey?: string;
                repo?: string;
                branch?: string;
                dryRun?: boolean;
                verbose?: boolean;
                quiet?: boolean;
            }) => {
                try {
                    await this.runPipeline(dir, options);
                } catch (error) {
                    console.error(`\n❌ 오류: ${error.message}\n`);
                    process.exit(1);
                }
            });
    }

    private async runPipeline(
        dir: string,
        options: {
            s3Path?: string;
            accessKey?: string;
            secretKey?: string;
            repo?: string;
            branch?: string;
            dryRun?: boolean;
            verbose?: boolean;
            quiet?: boolean;
        }
    ): Promise<void> {
        // 1. Read S3 config
        const config = await this.s3ConfigProgram.readConfig<S3Config>();
        const s3Config = config.s3;

        // 2. Override with CLI options
        const docS3Path = options.s3Path || s3Config.docS3Path;
        const endpoint = s3Config.endpoint;
        const region = s3Config.region;

        // Validate S3 path
        if (!docS3Path) {
            throw new Error(
                `S3 경로가 설정되지 않았습니다.

다음 중 하나의 방법으로 S3 경로를 설정하세요:
  1. CLI 옵션: --s3-path s3://bucket-name/path
  2. Config 설정: point3-doc config s3 set --s3-path s3://bucket-name/path`
            );
        }

        // 3. Setup logger
        const logger = new Logger('RunProgram');
        if (options.quiet) {
            logger.log = () => { }; // Suppress logs
        }
        if (options.verbose) {
            logger.debug = logger.log; // Enable debug logs
        }

        // 4. Dry-run mode: show file list and exit
        if (options.dryRun) {
            console.log(`\n🔍 Dry-run 모드: 처리 대상 파일 목록\n`);
            console.log(`디렉토리: ${dir}`);
            console.log(`S3 경로: ${docS3Path}\n`);

            const docFiles = await DocSanitizer.findMarkdownFiles(dir, logger);
            const assetFiles = await DocSanitizer.findAssetFiles(dir);

            console.log(`📄 문서 파일 (${docFiles.length}개):`);
            docFiles.forEach(file => console.log(`  - ${file}`));

            console.log(`\n🖼️  에셋 파일 (${assetFiles.length}개):`);
            assetFiles.forEach(file => console.log(`  - ${file}`));

            console.log(`\n총 ${docFiles.length + assetFiles.length}개 파일이 처리됩니다.\n`);
            return;
        }

        // 5. Create S3Client
        const s3Client = createNcpS3Client({
            endpoint,
            region,
            accessKey: options.accessKey,
            secretKey: options.secretKey,
        });

        // 6. Call DocSanitizer.process() - handles everything internally
        console.log(`\n🚀 문서 파이프라인 시작...\n`);
        await DocSanitizer.process(dir, {
            docS3Path,
            s3Client,
            repoName: options.repo,
            branchName: options.branch,
            logger,
        });

        console.log(`\n✅ 문서 파이프라인 완료!\n`);
    }
}
