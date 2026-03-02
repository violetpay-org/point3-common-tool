import { Command } from "commander";
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

import { CLIProgram } from "../program";
import { Point3DocConfig } from "./config";

export abstract class ConfigReadWriteProgram extends CLIProgram {
	protected configPath: fs.PathLike | undefined;
	setConfigPath(path: fs.PathLike): void {
		this.configPath = path;
	}
	abstract writeConfig(): void;
	abstract readConfig<C extends Point3DocConfig>(): Promise<C>;
}

export class ConfigProgram extends CLIProgram {
	private static readonly HOME = 'point3_doc/';
	private static readonly FILE = '.config';
	constructor(
		private readonly configRWPrograms: Array<ConfigReadWriteProgram>
	) {
		super();
		this.configRWPrograms.forEach((program) => program.setConfigPath(this.ConfigPath));
		this.initialize();
	}

	protected async _setupCommands(mainProgram: Command): Promise<void> {
		const configProgram = mainProgram
			.command("config")
			.description("다양한 configuration 설정 및 조회");

		configProgram
			.command("reset")
			.description("초기 기본설정으로 복귀합니다.")
			.action(async () => {
				await this.initialize(true);
				process.exit(0);
			});

		this.configRWPrograms.forEach(async (program) => {
			await program.setupCommands(configProgram);
		});
	}

	get Point3DocHomeDir(): string {
		const home = os.homedir();
		const fullDir = path.join(home, ConfigProgram.HOME);
		return fullDir;
	}

	get ConfigPath(): string {
		const dir = this.Point3DocHomeDir;
		const fullPath = path.join(dir, ConfigProgram.FILE);
		return fullPath;
	}

	async initialize(overwrite: boolean = false): Promise<void> {
		if (fs.existsSync(this.ConfigPath) && !overwrite) {
			return;
		}

		if (!fs.existsSync(this.Point3DocHomeDir)) {
			fs.mkdirSync(this.Point3DocHomeDir, { recursive: true });
		}

		this.createDefaultConfig();
	}

	async createDefaultConfig(): Promise<void> {
		fs.writeFileSync(this.ConfigPath, '{}');
		this.configRWPrograms.forEach(pg => pg.writeConfig());
	}
}
