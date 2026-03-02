import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

import { CLIProgram } from '../program';
import { DocSanitizer } from '../../doc-sanitizer';

export class SanitizeProgram extends CLIProgram {
    protected async _setupCommands(mainProgram: Command): Promise<void> {
        mainProgram
            .command('sanitize <dir>')
            .description(`지정된 디렉토리의 문서 파일(.md, .mdx)을 MDX 호환 형식으로 살균화합니다.

처리 내용:
  - 누락된 frontmatter 자동 추가
  - HTML void 요소 수정 (<br> → <br />)
  - 닫히지 않은 HTML 태그 자동 닫기
  - MDX 코드 블록 내 중괄호 이스케이프
  - 레포지토리 인덱스(index.md) 자동 생성`)
            .requiredOption('-o, --output <path>', '처리된 결과물을 저장할 디렉토리 (필수)')
            .option('--repo <name>', '레포지토리 이름 수동 지정 (기본: git에서 자동 감지)')
            .option('--branch <name>', '브랜치 이름 수동 지정 (기본: git에서 자동 감지)')
            .option('--dry-run', '실제 파일 작성 없이 처리될 파일 목록만 표시')
            .option('-v, --verbose', '상세 로그 출력')
            .option('-q, --quiet', '최소한의 로그만 출력')
            .addHelpText('after', `

사용 예시:
  $ point3-doc sanitize ./my-repo -o ./output
  $ point3-doc sanitize /path/to/repo -o /tmp/sanitized --verbose
  $ point3-doc sanitize . --dry-run -o ./output
  $ point3-doc sanitize ../docs -o ./sanitized --repo my-project --branch main`)
            .action(async (dir: string, options: any) => {
                await this.executeSanitize(dir, options);
            });
    }

    private async executeSanitize(dir: string, options: any): Promise<void> {
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

            // 2. 마크다운 및 에셋 파일 찾기
            verboseLog('마크다운 파일 검색 중...');
            const markdownFiles = await DocSanitizer.findMarkdownFiles(inputDir);
            
            verboseLog('에셋 파일 검색 중...');
            const assetFiles = await DocSanitizer.findAssetFiles(inputDir);

            if (markdownFiles.length === 0) {
                console.error(`❌ 오류: '${inputDir}'에서 .md 또는 .mdx 파일을 찾을 수 없습니다.`);
                process.exit(1);
            }

            log(`\n📄 발견된 파일:`);
            log(`  - 마크다운: ${markdownFiles.length}개`);
            log(`  - 에셋: ${assetFiles.length}개`);

            // 3. Dry-run 모드
            if (dryRun) {
                log(`\n🔍 [DRY-RUN] 처리될 파일 목록:\n`);
                log('마크다운 파일:');
                markdownFiles.forEach(file => {
                    const relativePath = path.relative(inputDir, file);
                    log(`  - ${relativePath}`);
                });

                if (assetFiles.length > 0) {
                    log('\n에셋 파일:');
                    assetFiles.forEach(file => {
                        const relativePath = path.relative(inputDir, file);
                        log(`  - ${relativePath}`);
                    });
                }

                log(`\n✅ Dry-run 완료. 실제 파일은 생성되지 않았습니다.`);
                return;
            }

            // 4. 출력 디렉토리 준비
            const outputDir = path.resolve(options.output);
            verboseLog(`출력 디렉토리: ${outputDir}`);

            // 5. 임시 디렉토리 생성
            const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-sanitize-'));
            verboseLog(`임시 디렉토리 생성: ${tmpDir}`);

            try {
                // 6. 파일 복사
                log(`\n📋 파일 복사 중...`);
                await this.copyFiles(inputDir, tmpDir, [...markdownFiles, ...assetFiles], verboseLog);

                // 7. 마크다운 파일 살균화
                log(`\n🧹 마크다운 파일 살균화 중...`);
                let processedCount = 0;
                for (const file of markdownFiles) {
                    const relativePath = path.relative(inputDir, file);
                    const tmpFilePath = path.join(tmpDir, relativePath);
                    
                    verboseLog(`처리 중: ${relativePath}`);
                    
                    const content = await fs.readFile(tmpFilePath, 'utf-8');
                    const processed = DocSanitizer.processContent(content, path.basename(file));
                    
                    if (processed !== content) {
                        await fs.writeFile(tmpFilePath, processed, 'utf-8');
                        processedCount++;
                        verboseLog(`  ✓ 수정됨`);
                    } else {
                        verboseLog(`  - 변경 없음`);
                    }
                }
                log(`  수정된 파일: ${processedCount}/${markdownFiles.length}개`);

                // 8. Git 정보 가져오기 및 인덱스 생성
                log(`\n📑 레포지토리 인덱스 생성 중...`);
                let repoName = options.repo;
                let branchName = options.branch;

                if (!repoName || !branchName) {
                    const gitInfo = DocSanitizer.getGitInfo(inputDir);
                    repoName = repoName || gitInfo.repoName || 'unknown-repo';
                    branchName = branchName || gitInfo.branchName || 'unknown-branch';
                    verboseLog(`Git 정보: ${repoName} (${branchName})`);
                }

                await DocSanitizer.ensureRepositoryIndex(tmpDir, repoName, branchName);
                log(`  ✓ index.md 생성 완료`);

                // 9. 출력 디렉토리로 복사
                log(`\n📦 출력 디렉토리로 복사 중...`);
                await fs.rm(outputDir, { recursive: true, force: true });
                await fs.mkdir(outputDir, { recursive: true });
                await this.copyDirectory(tmpDir, outputDir, verboseLog);

                log(`\n✅ 살균화 완료!`);
                log(`   출력 위치: ${outputDir}`);
                log(`   처리된 파일: ${markdownFiles.length + assetFiles.length}개`);

            } finally {
                // 10. 임시 디렉토리 정리
                verboseLog(`임시 디렉토리 삭제: ${tmpDir}`);
                await fs.rm(tmpDir, { recursive: true, force: true });
            }

        } catch (error) {
            console.error(`\n❌ 오류 발생: ${error.message}`);
            if (verbose && error.stack) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    private async copyFiles(
        sourceDir: string,
        destDir: string,
        files: string[],
        verboseLog: (msg: string) => void
    ): Promise<void> {
        for (const file of files) {
            const relativePath = path.relative(sourceDir, file);
            const destPath = path.join(destDir, relativePath);
            const destDirPath = path.dirname(destPath);

            await fs.mkdir(destDirPath, { recursive: true });
            await fs.copyFile(file, destPath);
            verboseLog(`  복사: ${relativePath}`);
        }
    }

    private async copyDirectory(
        source: string,
        dest: string,
        verboseLog: (msg: string) => void
    ): Promise<void> {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath, verboseLog);
            } else {
                await fs.copyFile(srcPath, destPath);
                verboseLog(`  복사: ${path.relative(source, srcPath)}`);
            }
        }
    }
}
