import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';

import { CLIProgram } from '../program';
import { DocSanitizer } from '../../doc-sanitizer';
import { createNcpS3Client } from '../s3/client-factory';
import { ConfigProgram } from '../config/program';
import { S3Config } from '../config/s3/config';

export class SyncProgram extends CLIProgram {
    constructor(private readonly configProgram: ConfigProgram) {
        super();
    }

    protected async _setupCommands(mainProgram: Command): Promise<void> {
        mainProgram
            .command('sync <dir>')
            .description(`지정된 디렉토리의 문서를 NCP Object Storage에 동기화합니다.

이미 살균화(sanitize)된 디렉토리를 대상으로 사용하세요.
원격에만 존재하는 파일(orphan)은 자동 삭제됩니다.

인증 정보 제공 방법 (우선순위 순):
  1. CLI 옵션: --access-key <키> --secret-key <키>
  2. 환경변수: NCP_ACCESS_KEY_ID, NCP_SECRET_ACCESS_KEY`)
            .option('--s3-path <path>', 'S3 경로 (기본: config 설정값)\n예: s3://my-bucket/docs')
            .option('--access-key <key>', 'NCP API Access Key')
            .option('--secret-key <key>', 'NCP API Secret Key')
            .option('--repo <name>', '레포지토리 이름 (기본: git에서 자동 감지)')
            .option('--branch <name>', '브랜치 이름 (기본: git에서 자동 감지)')
            .option('--dry-run', '업로드할 파일 목록만 표시 (실제 업로드 없음)')
            .option('-v, --verbose', '상세 로그 출력')
            .option('-q, --quiet', '최소한의 로그만 출력')
            .addHelpText('after', `

사용 예시:
  $ point3-doc sync ./output --s3-path s3://my-bucket/docs --access-key xxx --secret-key xxx
  $ export NCP_ACCESS_KEY_ID=xxx && export NCP_SECRET_ACCESS_KEY=xxx
  $ point3-doc sync ./output
  $ point3-doc sync ./output --dry-run`)
            .action(async (dir: string, options: any) => {
                await this.executeSync(dir, options);
            });
    }

    private async executeSync(dir: string, options: any): Promise<void> {
        const verbose = options.verbose || false;
        const quiet = options.quiet || false;
        const dryRun = options.dryRun || false;

        const log = (message: string) => {
            if (!quiet) console.log(message);
        };

        const verboseLog = (message: string) => {
            if (verbose) console.log(`[VERBOSE] ${message}`);
        };

        try {
            // 1. 입력 디렉토리 검증
            const inputDir = path.resolve(dir);
            verboseLog(`입력 디렉토리 확인: ${inputDir}`);

            try {
                const stat = await fs.stat(inputDir);
                if (!stat.isDirectory()) {
                    console.error(`❌ 오류: '${inputDir}'는 디렉토리가 아닙니다.`);
                    process.exit(1);
                }
            } catch (error) {
                console.error(`❌ 오류: 디렉토리를 찾을 수 없습니다: ${inputDir}`);
                process.exit(1);
            }

            // 2. S3 설정 읽기
            verboseLog('S3 설정 읽기 중...');
            const config = await this.readS3Config();
            
            // CLI 옵션으로 오버라이드
            const s3Path = options.s3Path || config.s3.docS3Path;
            const endpoint = config.s3.endpoint;
            const region = config.s3.region;

            // S3 경로 검증
            if (!s3Path) {
                console.error(`❌ 오류: S3 경로가 설정되지 않았습니다.

다음 중 하나의 방법으로 S3 경로를 설정하세요:
  1. CLI 옵션: --s3-path s3://my-bucket/docs
  2. Config 설정: point3-doc config s3 set --s3-path s3://my-bucket/docs

현재 설정 확인: point3-doc config s3 show`);
                process.exit(1);
            }

            verboseLog(`S3 설정: ${s3Path} (endpoint: ${endpoint}, region: ${region})`);

            // 3. Git 정보 가져오기
            let repoName = options.repo;
            let branchName = options.branch;

            if (!repoName || !branchName) {
                verboseLog('Git 정보 감지 중...');
                const gitInfo = DocSanitizer.getGitInfo(inputDir);
                repoName = repoName || gitInfo.repoName || 'unknown-repo';
                branchName = branchName || gitInfo.branchName || 'unknown-branch';
                verboseLog(`Git 정보: ${repoName} (${branchName})`);
            }

            // 4. S3 destination 경로 생성
            const s3Destination = `${s3Path}/${repoName}/${branchName}`;
            log(`\n📦 동기화 대상:`);
            log(`  로컬: ${inputDir}`);
            log(`  원격: ${s3Destination}`);

            // 5. 파일 목록 가져오기
            verboseLog('파일 목록 수집 중...');
            const files = await DocSanitizer.getAllFiles(inputDir);

            if (files.length === 0) {
                console.error(`❌ 오류: '${inputDir}'에서 동기화할 파일을 찾을 수 없습니다.`);
                process.exit(1);
            }

            log(`\n📄 발견된 파일: ${files.length}개`);

            // 6. Dry-run 모드
            if (dryRun) {
                log(`\n🔍 [DRY-RUN] 업로드될 파일 목록:\n`);
                files.forEach(file => {
                    const relativePath = path.relative(inputDir, file);
                    log(`  - ${relativePath}`);
                });

                log(`\n📍 S3 업로드 대상: ${s3Destination}`);
                log(`\n✅ Dry-run 완료. 실제 업로드는 수행되지 않았습니다.`);
                return;
            }

            // 7. S3 Client 생성
            verboseLog('S3 Client 생성 중...');
            const s3Client = createNcpS3Client({
                endpoint,
                region,
                accessKey: options.accessKey,
                secretKey: options.secretKey,
            });

            // 8. S3 동기화 실행
            log(`\n🚀 S3 동기화 시작...`);
            await DocSanitizer.runS3Sync(inputDir, s3Destination, {
                s3Client,
                logger: {
                    log: (msg: string) => log(`  ${msg}`),
                    error: (msg: string) => console.error(`  ❌ ${msg}`),
                    warn: (msg: string) => console.warn(`  ⚠️  ${msg}`),
                    debug: (msg: string) => verboseLog(msg),
                    verbose: (msg: string) => verboseLog(msg),
                },
            });

            log(`\n✅ 동기화 완료!`);
            log(`   업로드된 파일: ${files.length}개`);
            log(`   S3 경로: ${s3Destination}`);

        } catch (error) {
            console.error(`\n❌ 오류 발생: ${error.message}`);
            if (verbose && error.stack) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    private async readS3Config(): Promise<S3Config> {
        try {
            const configPath = this.configProgram.ConfigPath;
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent) as S3Config;
            
            // 기본값 설정 (config에 없는 경우)
            if (!config.s3) {
                config.s3 = {
                    docS3Path: '',
                    endpoint: 'https://kr.object.fin-ncloudstorage.com',
                    region: 'fin-standard',
                };
            }
            
            return config;
        } catch (error) {
            console.error(`❌ 오류: 설정 파일을 읽을 수 없습니다: ${error.message}`);
            console.error(`'point3-doc config reset'으로 초기화하세요.`);
            process.exit(1);
        }
    }
}
