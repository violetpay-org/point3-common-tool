import { Command } from "commander";
import * as fs from 'node:fs';

import { ConfigReadWriteProgram } from "../program";
import { S3Config } from "./config";

export class S3ConfigProgram extends ConfigReadWriteProgram {
	private static DEFAULT_CONFIG = {
		docS3Path: "",
		endpoint: "https://kr.object.fin-ncloudstorage.com",
		region: "fin-standard"
	};

	constructor() { super(); }

	setConfigPath(path: fs.PathLike): void {
		this.configPath = path;
	}

	writeConfig(opts: {
		docS3Path?: string | undefined,
		endpoint?: string | undefined,
		region?: string | undefined
	} = S3ConfigProgram.DEFAULT_CONFIG
	): void {
		this.assertsConfigExists();
		try {
			const fileContent = fs.readFileSync(this.configPath!, "utf-8");
			const config = JSON.parse(fileContent);

			let s3Config = config['s3'];
			if (!s3Config) {
				s3Config = {};
				config['s3'] = s3Config;
			}

			for (const key of Object.keys(opts)) {
				const value = opts[key as keyof typeof opts];
				if (value !== undefined) {
					s3Config[key] = value;
				}
			}
			fs.writeFileSync(this.configPath!, JSON.stringify(config, null, 2), "utf-8");
		} catch (error) {
			throw new Error(`설정 파일 작성 실패: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async readConfig<S3Config>(): Promise<S3Config> {
		this.assertsConfigExists();

		try {
			const fileContent = fs.readFileSync(this.configPath!, "utf-8");
			const config = JSON.parse(fileContent);
			this.assertsS3ConfigExists(config);
			return config as S3Config;
		} catch (error) {
			throw new Error(`설정 파일 읽기 실패: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private assertsConfigExists(): void {
		if (!fs.existsSync(this.configPath!))
			throw new Error('S3 Config를 작성할 설정파일이 없습니다. \'point3-doc config reset\'으로 초기화하세요.');
	}

	private assertsS3ConfigExists(config: any): asserts config is S3Config {
		if (!config || !config['s3']) {
			throw new Error('S3 설정이 없습니다. \'point3-doc config reset\'으로 초기화하세요.');
		}
	}

	protected async _setupCommands(mainProgram: Command): Promise<void> {
		const s3Command = mainProgram
			.command("s3")
			.description('S3 환경설정');

		s3Command
			.command("show")
			.description('S3 설정 조회')
			.action(async () => {
				try {
					const s3Config = await this.readConfig<S3Config>();
					console.log('NCP Object Storage S3 설정:');
					console.log(`  버킷 경로: ${s3Config.s3.docS3Path || '(미설정)'}`);
					console.log(`  엔드포인트: ${s3Config.s3.endpoint}`);
					console.log(`  리전: ${s3Config.s3.region}`);
					console.log('');
					console.log('💡 NCP Object Storage 설정 가이드:');
					console.log('  1. NCP 콘솔 접속: https://console.fin-ncloud.com');
					console.log('  2. Object Storage 메뉴에서 버킷 생성');
					console.log('  3. 마이페이지 > API 인증키 관리에서 Access Key/Secret Key 발급');
					console.log('  4. 환경변수 또는 CLI 옵션으로 인증키 전달');
					console.log('  5. 문서: https://api-fin.ncloud-docs.com/docs/storage-objectstorage');
					console.log('');
				} catch (error) {
					console.error('오류:', error instanceof Error ? error.message : String(error));
					process.exit(1);
				}
				process.exit(0);
			});

		s3Command
			.command('set')
			.description('S3 설정 변경')
			.option('--s3-path <path>', 'S3 버킷 경로 설정 (예: my-bucket/docs)')
			.option('--endpoint <url>', 'S3 엔드포인트 URL 설정')
			.option('--region <region>', 'S3 리전 설정')
			.action(async (command) => {
				const updates: {
					docS3Path?: string,
					endpoint?: string,
					region?: string
				} = {};

				if (command['s3Path']) {
					updates.docS3Path = command.s3Path;
				}

				if (command['endpoint']) {
					updates.endpoint = command.endpoint;
				}

				if (command['region']) {
					updates.region = command.region;
				}

				if (Object.keys(updates).length === 0) {
					console.error('오류: 변경할 설정을 지정해주세요.');
					console.log('사용 예시:');
					console.log('  point3-doc config s3 set --s3-path my-bucket/docs');
					console.log('  point3-doc config s3 set --endpoint https://kr.object.fin-ncloudstorage.com');
					console.log('  point3-doc config s3 set --region fin-standard');
					console.log('');
					process.exit(1);
				}

				try {
					this.writeConfig(updates);
					console.log('S3 설정이 업데이트되었습니다:');
					if (updates.docS3Path) console.log(`  버킷 경로: ${updates.docS3Path}`);
					if (updates.endpoint) console.log(`  엔드포인트: ${updates.endpoint}`);
					if (updates.region) console.log(`  리전: ${updates.region}`);
					console.log('');
				} catch (error) {
					console.error('오류:', error instanceof Error ? error.message : String(error));
					process.exit(1);
				}
				process.exit(0);
			});
	}
}
