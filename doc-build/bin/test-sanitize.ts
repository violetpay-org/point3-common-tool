#!/usr/bin/env node
import { Command } from 'commander';
import { SanitizeProgram } from './commands/sanitize';

async function main() {
    const program = new Command();
    program.name('point3-doc').version('1.0.0');

    const sanitizeProgram = new SanitizeProgram();
    await sanitizeProgram.setupCommands(program);

    await program.parseAsync(process.argv);
}

main().catch(console.error);
