import { DocSanitizer } from "../doc-sanitizer";
import { Logger } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs/promises";
import { S3Client } from "@aws-sdk/client-s3";

async function runIntegrationTest() {
    const logger = new Logger("IntegrationTest");
    const testRepoRoot = path.join(__dirname, "../.test_repo");

    // Check if .test_repo exists
    try {
        await fs.access(testRepoRoot);
    } catch {
        logger.error(`Test repository root not found at ${testRepoRoot}`);
        process.exit(1);
    }

    const repos = await fs.readdir(testRepoRoot, { withFileTypes: true });
    const targetRepos = repos.filter(r => r.isDirectory());

    logger.log(`Found ${targetRepos.length} repositories to process.`);

    // Use real S3Client but mock send to avoid real network calls
    const mockS3Client = new S3Client({ region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
    mockS3Client.send = (async (command: any) => {
        const name = command.name || command.constructor.name;
        if (name === 'ListObjectsV2Command') return { Contents: [] };
        return { ETag: '"mock-etag"' };
    }) as any;

    for (const repo of targetRepos) {
        const repoPath = path.join(testRepoRoot, repo.name);
        logger.log(`--------------------------------------------------`);
        logger.log(`Processing Repository: ${repo.name}`);

        try {
            await DocSanitizer.process(repoPath, {
                docS3Path: "s3://mock-bucket/docs",
                s3Client: mockS3Client,
                logger: logger
            });
            logger.log(`Successfully processed ${repo.name}`);
        } catch (error) {
            logger.error(`Failed to process ${repo.name}: ${error.message}`);
        }
    }

    logger.log(`--------------------------------------------------`);
    logger.log(`Integration testing completed.`);
}

runIntegrationTest();
