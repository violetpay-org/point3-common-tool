import { Logger, LoggerService } from "@nestjs/common";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, ObjectIdentifier } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import * as lookup from "mime-types";
import * as path from "path";
import * as os from "os";
import { readdir, readFile, writeFile, access, mkdtemp, cp, rm, mkdir, copyFile } from "fs/promises";
import { createReadStream, lstatSync } from "fs";
import { execSync } from "child_process";

/**
 * DocSanitizer namespace provides a unified, stateless utility for documentation sanitization.
 * It is designed specifically for 'Source Build' workflows: 
 * Sanitizing local documentation files and pushing them to a target S3 bucket.
 * 
 * Flow: Local Workspace -> MDX Sanitization -> Index Generation -> S3 Sync
 */
export namespace DocSanitizer {
    let _defaultLogger: Logger | undefined;
    function getDefaultLogger(): Logger {
        if (!_defaultLogger) {
            _defaultLogger = new Logger("DocSanitizer");
        }
        return _defaultLogger;
    }

    export interface SyncOptions {
        docS3Path: string;
        buildTimeout?: number;
        logger?: LoggerService;
        s3Client?: S3Client;
    }

    /**
     * Main entry point for the Source Build Workflow.
     * Sanitizes MDX files in rootDir, ensures a repository index, and pushes everything to the configured S3 path.
     */
    export async function process(
        rootDir: string,
        options: SyncOptions & { repoName?: string; branchName?: string }
    ): Promise<void> {
        // Collect metadata from the original source directory
        const repoName = options.repoName || getGitInfo(rootDir).repoName || "unknown-repo";
        const branchName = options.branchName || getGitInfo(rootDir).branchName || "main";

        const log = options.logger || getDefaultLogger();
        const startTime = Date.now();
        let tmpDir: string | undefined;

        try {
            log.log(`Initializing isolated sanitization for ${repoName}/${branchName}`);

            // Create a temporary processing directory
            tmpDir = await mkdtemp(path.join(os.tmpdir(), "doc-sanitizer-"));

            log.log(`Creating isolated workspace for documentation...`);

            // Strictly copy only documentation and assets
            const docFiles = await findMarkdownFiles(rootDir, log);
            const assetFiles = await findAssetFiles(rootDir);
            const allFiles = [...docFiles, ...assetFiles];

            for (const file of allFiles) {
                const relativePath = path.relative(rootDir, file);
                const targetPath = path.join(tmpDir, relativePath);
                await mkdir(path.dirname(targetPath), { recursive: true });
                await copyFile(file, targetPath);
            }

            log.log(`Isolated workspace created at: ${tmpDir} with ${allFiles.length} files.`);

            // Step 1: MDX Sanitization (in temp dir)
            const filesProcessed = await processDirectory(tmpDir, log);
            log.log(`Sanitization complete: ${filesProcessed} files handled.`);

            // Step 2: Ensure Index (in temp dir)
            await ensureRepositoryIndex(tmpDir, repoName, branchName, log);

            // Step 3: Sync to S3 (from temp dir)
            const s3Dest = `${options.docS3Path}/${repoName}/${branchName}`;
            await runS3Sync(tmpDir, s3Dest, {
                buildTimeout: options.buildTimeout,
                logger: log,
                s3Client: options.s3Client
            });

            log.log(`Doc Sanitization for ${repoName}/${branchName} completed in ${Date.now() - startTime}ms`);
        } catch (error) {
            log.error(`Doc Sanitization failed for ${repoName}/${branchName}: ${error.message}`, error.stack);
            throw error;
        } finally {
            if (tmpDir) {
                try {
                    log.log(`Attempting cleanup of ${tmpDir}...`);
                    await rm(tmpDir, { recursive: true, force: true });
                    log.log(`Successfully cleaned up temporary directory: ${tmpDir}`);
                } catch (cleanupError) {
                    log.warn(`[CLEANUP ERROR] Failed to remove ${tmpDir}: ${cleanupError.message}`);
                }
            }
        }
    }

    /**
     * Extracts repository name and branch name from local git metadata if available.
     */
    export function getGitInfo(dir: string): { repoName: string; branchName: string } {
        try {
            const branchName = execSync("git rev-parse --abbrev-ref HEAD", { cwd: dir, stdio: "pipe" }).toString().trim();
            const remoteUrl = execSync("git remote get-url origin", { cwd: dir, stdio: "pipe" }).toString().trim();

            // Extract repo name from URL (e.g., https://github.com/org/repo.git -> repo)
            const repoName = path.basename(remoteUrl, ".git");

            return { repoName, branchName };
        } catch (e) {
            return { repoName: "", branchName: "" };
        }
    }

    // --- Core Processing Utilities ---

    export async function processDirectory(dirPath: string, logger?: LoggerService): Promise<number> {
        const files = await findMarkdownFiles(dirPath, logger);
        let modifiedCount = 0;
        for (const file of files) {
            if (await processFile(file, logger)) modifiedCount++;
        }
        return modifiedCount;
    }

    export async function processFile(filePath: string, logger?: LoggerService): Promise<boolean> {
        try {
            const content = await readFile(filePath, 'utf-8');
            const processed = processContent(content, path.basename(filePath));
            if (processed === content) return false;

            await writeFile(filePath, processed, 'utf-8');
            return true;
        } catch (error) {
            logger?.error?.(`Failed to process file ${filePath}: ${error.message}`, error.stack);
            throw error;
        }
    }

    export function processContent(content: string, filename?: string): string {
        let processed = content;
        processed = addFrontmatterIfMissing(processed, filename);
        processed = fixVoidElements(processed);
        processed = fixUnclosedTags(processed);
        if (filename?.toLowerCase().endsWith('.mdx')) {
            processed = escapeCurlyBracesInCodeBlocks(processed);
        }
        return processed;
    }

    /**
     * SDK-based S3 Synchronization.
     */
    export async function runS3Sync(
        sourceDir: string,
        destinationUrl: string,
        options: {
            buildTimeout?: number;
            logger?: LoggerService;
            s3Client?: S3Client;
        }
    ): Promise<void> {
        const log = options.logger || getDefaultLogger();
        const s3Client = options.s3Client || new S3Client({});
        const { bucket, prefix } = parseS3Url(destinationUrl);

        if (!bucket) throw new Error(`Invalid S3 URL: ${destinationUrl}`);

        log.log(`Syncing ${sourceDir} to s3://${bucket}/${prefix}...`);

        try {
            const localFiles = await getAllFiles(sourceDir);
            const s3Keys = new Set<string>();

            for (const filePath of localFiles) {
                const relativePath = path.relative(sourceDir, filePath);
                const s3Key = prefix ? `${prefix}/${relativePath}` : relativePath;
                s3Keys.add(s3Key);

                const contentType = lookup.lookup(filePath) || "application/octet-stream";
                const fileStream = createReadStream(filePath);

                const upload = new Upload({
                    client: s3Client,
                    params: {
                        Bucket: bucket,
                        Key: s3Key,
                        Body: fileStream,
                        ContentType: contentType,
                    },
                    queueSize: 4,
                    partSize: 5 * 1024 * 1024,
                });
                await upload.done();
            }

            await deleteRemoteOrphans(s3Client, bucket, prefix, s3Keys, log);
        } catch (error) {
            log.error(`S3 Sync failed: ${error.message}`);
            throw error;
        }
    }

    // --- Private Internal Support ---

    async function deleteRemoteOrphans(
        s3Client: S3Client,
        bucket: string,
        prefix: string,
        localS3Keys: Set<string>,
        logger: LoggerService
    ): Promise<void> {
        let continuationToken: string | undefined;
        do {
            const response = await s3Client.send(new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix ? `${prefix}/` : undefined,
                ContinuationToken: continuationToken,
            }));
            const keysToDelete = (response.Contents || [])
                .filter(obj => obj.Key && !localS3Keys.has(obj.Key))
                .map(obj => ({ Key: obj.Key }));

            if (keysToDelete.length > 0) {
                logger.log(`Deleting ${keysToDelete.length} obsolete remote files...`);
                for (let i = 0; i < keysToDelete.length; i += 1000) {
                    await s3Client.send(new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: { Objects: keysToDelete.slice(i, i + 1000) },
                    }));
                }
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);
    }

    function addFrontmatterIfMissing(content: string, filename?: string): string {
        if (content.trimStart().startsWith('---')) return content;
        const title = filename
            ? path.basename(filename, path.extname(filename)).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : 'Documentation';
        return `---\ntitle: ${title}\n---\n\n` + content;
    }

    function fixVoidElements(content: string): string {
        const voidTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        const parts = splitByCodeBlocks(content);
        for (let i = 0; i < parts.length; i += 2) {
            for (const tag of voidTags) {
                parts[i] = parts[i].replace(new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi'), `<${tag}$1 />`);
            }
        }
        return parts.join('');
    }

    function fixUnclosedTags(content: string): string {
        const lines = content.split('\n');
        const stack: string[] = [];
        const targetTags = ['details', 'summary', 'div', 'section'];
        for (const line of lines) {
            const open = line.matchAll(/<(details|summary|div|section)(?:\s[^>]*)?\s*>/gi);
            for (const m of open) stack.push(m[1].toLowerCase());
            const close = line.matchAll(/<\/(details|summary|div|section)>/gi);
            for (const m of close) if (stack[stack.length - 1] === m[1].toLowerCase()) stack.pop();
        }
        return lines.join('\n') + stack.reverse().map(tag => `\n</${tag}>`).join('');
    }

    function escapeCurlyBracesInCodeBlocks(content: string): string {
        const parts = splitByCodeBlocks(content);
        for (let i = 1; i < parts.length; i += 2) {
            parts[i] = parts[i].replace(/{/g, '\\{').replace(/}/g, '\\}');
        }
        return parts.join('');
    }

    function splitByCodeBlocks(content: string): string[] {
        const parts: string[] = [];
        const regex = /```[\s\S]*?```/g;
        let last = 0, match;
        while ((match = regex.exec(content)) !== null) {
            parts.push(content.substring(last, match.index), match[0]);
            last = regex.lastIndex;
        }
        parts.push(content.substring(last));
        return parts;
    }

    function parseS3Url(url: string) {
        if (!url.startsWith("s3://")) return { bucket: "", prefix: "" };
        const cleanUrl = url.replace("s3://", "");
        const parts = cleanUrl.split("/");
        const bucket = parts.shift();
        const prefix = parts.join("/");
        return { bucket, prefix };
    }

    export async function findMarkdownFiles(dirPath: string, logger?: LoggerService): Promise<string[]> {
        const files: string[] = [];
        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') continue;
                if (entry.isDirectory()) files.push(...(await findMarkdownFiles(fullPath, logger)));
                else if (['.md', '.mdx'].includes(path.extname(entry.name).toLowerCase())) files.push(fullPath);
            }
        } catch (e) {
            // Ignore errors
        }
        return files;
    }

    export async function findAssetFiles(dirPath: string): Promise<string[]> {
        const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.webp'];
        const files: string[] = [];
        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === 'src') continue;
                if (entry.isDirectory()) {
                    files.push(...(await findAssetFiles(fullPath)));
                } else {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (assetExtensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (e) {
            // Ignore
        }
        return files;
    }

    export async function getAllFiles(dirPath: string): Promise<string[]> {
        const docExtensions = ['.md', '.mdx', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];
        const files: string[] = [];
        try {
            const entries = await readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.name === '.git' || entry.name === 'node_modules') continue;
                if (entry.isDirectory()) {
                    files.push(...(await getAllFiles(fullPath)));
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (docExtensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (e) {
            // Ignore errors
        }
        return files;
    }

    export async function ensureRepositoryIndex(dir: string, repo: string, branch: string, logger?: LoggerService): Promise<void> {
        const idxPath = path.join(dir, 'index.md');
        try { await access(idxPath); return; } catch { }
        const files = await findMarkdownFiles(dir, logger);
        const links = files.map(f => {
            const rel = path.relative(dir, f).replace(/\\/g, '/');
            return `- [${path.basename(f, path.extname(f))}](${rel})`;
        }).filter(l => !l.includes('index.md')).sort();
        const content = `---\ntitle: ${repo} - ${branch}\n---\n\n# ${repo} (${branch})\n\n${links.join('\n')}`;
        await writeFile(idxPath, content, 'utf-8');
        logger?.log?.(`Index generated for ${repo}/${branch}`);
    }
}