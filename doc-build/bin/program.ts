import { Command } from 'commander';

export abstract class CLIProgram {
    private commandAttached: boolean = false;

    constructor() { }

    async setupCommands(mainProgram: Command): Promise<void> {
        if (this.commandAttached) return;

        await this._setupCommands(mainProgram);
        this.commandAttached = true;
    }

    protected abstract _setupCommands(mainProgram: Command): Promise<void>;
}
