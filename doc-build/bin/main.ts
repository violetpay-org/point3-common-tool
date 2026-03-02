#!/usr/bin/env node
import { Command } from 'commander';
import * as figlet from 'figlet';

import { ConfigProgram } from './config/program';
import { S3ConfigProgram } from './config/s3/config.program';
import { SanitizeProgram, SyncProgram, RunProgram } from './commands';

const packageJson = require('../../../package.json');

async function main(): Promise<void> {
    // Initialize config programs
    const s3ConfigProgram = new S3ConfigProgram();
    const configProgram = new ConfigProgram([s3ConfigProgram]);

    // Initialize command programs
    const sanitizeProgram = new SanitizeProgram();
    const syncProgram = new SyncProgram(configProgram);
    const runProgram = new RunProgram(s3ConfigProgram);

    // Create main program
    const mainProgram = new Command();
    mainProgram
        .name('point3-doc')
        .description('포인트3 문서 관리 CLI 도구')
        .version(packageJson.version);

    // Global options
    mainProgram
        .option('-v, --verbose', '상세 로그 출력')
        .option('-q, --quiet', '최소한의 로그만 출력');

    // Register all subcommands
    await configProgram.setupCommands(mainProgram);
    await sanitizeProgram.setupCommands(mainProgram);
    await syncProgram.setupCommands(mainProgram);
    await runProgram.setupCommands(mainProgram);

    // Show banner + help when no arguments provided
    if (process.argv.length <= 2) {
        const opts = mainProgram.opts();
        if (!opts.quiet) {
            console.log(figlet.textSync('Point3 Doc Tool', {
                font: 'Standard',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            }));
            console.log('');
        }
        mainProgram.outputHelp();
        process.exit(0);
    }

    // Handle unknown commands
    mainProgram.on('command:*', function () {
        const args = mainProgram.args.join(' ');
        console.error(`오류: 알 수 없는 명령어입니다: ${args}. 사용 가능한 명령어를 보려면 --help를 사용하세요.`);
        process.exit(1);
    });

    await mainProgram.parseAsync(process.argv);
}

if (require.main == module) {
    main().catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('CLI 실행 중 오류 발생:', errorMessage);
        process.exit(1);
    });
}
