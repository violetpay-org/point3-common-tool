#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigProgram } from './config/program';
import { S3ConfigProgram } from './config/s3/config.program';
import { SyncProgram } from './commands/sync';

async function main() {
    const program = new Command();
    
    const s3ConfigProgram = new S3ConfigProgram();
    const configProgram = new ConfigProgram([s3ConfigProgram]);
    const syncProgram = new SyncProgram(configProgram);

    await configProgram.setupCommands(program);
    await syncProgram.setupCommands(program);

    program.parse(process.argv);
}

main().catch(console.error);
