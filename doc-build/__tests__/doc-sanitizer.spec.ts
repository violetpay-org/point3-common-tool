import { Logger } from '@nestjs/common';
import { DocSanitizer } from '../doc-sanitizer';
import { readdir, readFile, writeFile, access, mkdtemp, cp, rm } from 'fs/promises';
import { createReadStream } from 'fs';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Mock dependencies
jest.mock('fs/promises', () => ({
    readdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdtemp: jest.fn(),
    cp: jest.fn(),
    rm: jest.fn(),
}));

jest.mock('fs', () => ({
    createReadStream: jest.fn().mockReturnValue('mock-stream'),
}));

jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn().mockImplementation(() => ({
            send: jest.fn().mockResolvedValue({ Contents: [] }),
        })),
        ListObjectsV2Command: jest.fn().mockImplementation((input) => ({ input, name: 'ListObjectsV2Command' })),
        DeleteObjectsCommand: jest.fn().mockImplementation((input) => ({ input, name: 'DeleteObjectsCommand' })),
    };
});

jest.mock('@aws-sdk/lib-storage', () => {
    return {
        Upload: jest.fn().mockImplementation(() => ({
            done: jest.fn(),
        })),
    };
});

describe('DocSanitizer', () => {
    const mockLogger = new Logger('TestLogger');
    mockLogger.log = jest.fn();
    mockLogger.error = jest.fn();
    mockLogger.debug = jest.fn();
    mockLogger.warn = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('processContent', () => {
        it('should add frontmatter when missing', () => {
            const input = '# Hello World\n\nThis is content.';
            const result = DocSanitizer.processContent(input, 'test-file.md');

            expect(result).toContain('---\ntitle: Test File\n---\n\n');
            expect(result).toContain('# Hello World');
        });

        it('should not duplicate frontmatter if already present', () => {
            const input = '---\ntitle: Existing\n---\n\n# Content';
            const result = DocSanitizer.processContent(input);

            const frontmatterCount = (result.match(/---/g) || []).length;
            expect(frontmatterCount).toBe(2);
        });

        it('should fix void HTML elements: <br> to <br />', () => {
            const input = '---\ntitle: Test\n---\n\nLine one<br>Line two';
            const result = DocSanitizer.processContent(input);

            expect(result).toContain('<br />');
            expect(result).not.toContain('<br>');
        });

        it('should fix void HTML elements: <hr> to <hr />', () => {
            const input = '---\ntitle: Test\n---\n\nSection one\n<hr>\nSection two';
            const result = DocSanitizer.processContent(input);

            expect(result).toContain('<hr />');
            expect(result).not.toContain('<hr>');
        });

        it('should fix void HTML elements: <img> to <img />', () => {
            const input = '---\ntitle: Test\n---\n\n<img src="test.png" alt="test">';
            const result = DocSanitizer.processContent(input);

            expect(result).toContain('<img src="test.png" alt="test" />');
        });

        it('should not modify already self-closed void elements', () => {
            const input = '---\ntitle: Test\n---\n\n<br /><hr />';
            const result = DocSanitizer.processContent(input);

            expect(result).toBe(input);
        });

        it('should escape curly braces in code blocks (only for .mdx)', () => {
            const input = '---\ntitle: Test\n---\n\n```javascript\nconst obj = { key: value };\n```';
            const result = DocSanitizer.processContent(input, 'test-file.mdx');

            expect(result).toContain('\\{');
            expect(result).toContain('\\}');
            expect(result).toContain('const obj = \\{ key: value \\};');
        });

        it('should not escape curly braces if not .mdx', () => {
            const input = '---\ntitle: Test\n---\n\n```javascript\nconst obj = { key: value };\n```';
            const result = DocSanitizer.processContent(input, 'test-file.md');

            expect(result).not.toContain('\\{');
            expect(result).not.toContain('\\}');
            expect(result).toContain('const obj = { key: value };');
        });

        it('should not escape curly braces outside code blocks even in .mdx', () => {
            const input = '---\ntitle: Test\n---\n\nThis is {not} a code block.';
            const result = DocSanitizer.processContent(input, 'test-file.mdx');

            expect(result).toContain('This is {not} a code block.');
            expect(result).not.toContain('\\{not\\}');
        });

        it('should fix unclosed <details> tags', () => {
            const input = '---\ntitle: Test\n---\n\n<details>\nSome content\n';
            const result = DocSanitizer.processContent(input);

            expect(result).toContain('</details>');
        });

        it('should fix unclosed <summary> tags', () => {
            const input = '---\ntitle: Test\n---\n\n<summary>\nSummary text';
            const result = DocSanitizer.processContent(input);

            expect(result).toContain('</summary>');
        });

        it('should handle multiple unclosed tags', () => {
            const input = '---\ntitle: Test\n---\n\n<details>\n<summary>Title\nContent';
            const result = DocSanitizer.processContent(input);

            expect(result).toContain('</summary>');
            expect(result).toContain('</details>');
        });

        it('should not modify already valid content', () => {
            const input = '---\ntitle: Valid\n---\n\n# Title\n\nParagraph with <br /> and `code`.\n\n<details>\n<summary>Summary</summary>\nContent\n</details>';
            const result = DocSanitizer.processContent(input);

            expect(result).toBe(input);
        });

        it('should preserve code block markers when escaping braces', () => {
            const input = '---\ntitle: Test\n---\n\n```typescript\nfunction test() { return {}; }\n```';
            const result = DocSanitizer.processContent(input, 'test-file.mdx');

            expect(result).toContain('```typescript');
            expect(result).toContain('```');
            expect(result).toContain('\\{');
            expect(result).toContain('\\}');
        });

        it('should handle empty content gracefully', () => {
            const result = DocSanitizer.processContent('', 'empty.md');

            expect(result).toContain('---\ntitle: Empty\n---\n\n');
        });

        it('should handle content with only whitespace', () => {
            const result = DocSanitizer.processContent('   \n\n  ', 'whitespace.md');

            expect(result).toContain('---\ntitle: Whitespace\n---\n\n');
        });
    });

    describe('processFile', () => {
        it('should process and update file when changes are needed', async () => {
            (readFile as jest.Mock).mockResolvedValue('# Test\n\n<br>');
            (writeFile as jest.Mock).mockResolvedValue(undefined);

            const result = await DocSanitizer.processFile('/test/file.md', mockLogger);

            expect(result).toBe(true);
            expect(writeFile).toHaveBeenCalledWith(
                '/test/file.md',
                expect.stringContaining('<br />'),
                'utf-8',
            );
        });

        it('should return false when no processing needed', async () => {
            (readFile as jest.Mock).mockResolvedValue('---\ntitle: Valid\n---\n\nunchanged content');
            (writeFile as jest.Mock).mockResolvedValue(undefined);

            const result = await DocSanitizer.processFile('/test/valid.md', mockLogger);

            expect(result).toBe(false);
            expect(writeFile).not.toHaveBeenCalled();
        });
    });

    describe('getAllFiles', () => {
        it('should recursively find all valid files, ignoring dotfiles and node_modules', async () => {
            (readdir as jest.Mock).mockImplementation(async (dirPath) => {
                if (dirPath === '/root') {
                    return [
                        { name: 'file1.md', isDirectory: () => false, isFile: () => true },
                        { name: 'file2.mdx', isDirectory: () => false, isFile: () => true },
                        { name: 'ignore.txt', isDirectory: () => false, isFile: () => true },
                        { name: '.git', isDirectory: () => true, isFile: () => false },
                        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
                        { name: 'subdir', isDirectory: () => true, isFile: () => false },
                    ] as any;
                }
                if (dirPath === '/root/subdir') {
                    return [
                        { name: 'file3.md', isDirectory: () => false, isFile: () => true },
                    ] as any;
                }
                return [];
            });

            const files = await DocSanitizer.getAllFiles('/root');

            expect(files.length).toBe(4);
            expect(files).toContain('/root/file1.md');
            expect(files).toContain('/root/file2.mdx');
            expect(files).toContain('/root/ignore.txt');
            expect(files).toContain('/root/subdir/file3.md');
        });
    });

    describe('findMarkdownFiles', () => {
        it('should recursively find .md and .mdx files, ignoring dotfiles and node_modules', async () => {
            (readdir as jest.Mock).mockImplementation(async (dirPath) => {
                if (dirPath === '/root') {
                    return [
                        { name: 'file1.md', isDirectory: () => false, isFile: () => true },
                        { name: 'file2.mdx', isDirectory: () => false, isFile: () => true },
                        { name: 'ignore.txt', isDirectory: () => false, isFile: () => true },
                        { name: '.hidden', isDirectory: () => true, isFile: () => false },
                        { name: 'node_modules', isDirectory: () => true, isFile: () => false },
                        { name: 'subdir', isDirectory: () => true, isFile: () => false },
                    ] as any;
                }
                if (dirPath === '/root/subdir') {
                    return [
                        { name: 'file3.md', isDirectory: () => false, isFile: () => true },
                    ] as any;
                }
                return [];
            });

            const files = await DocSanitizer.findMarkdownFiles('/root', mockLogger);

            expect(files.length).toBe(3);
            expect(files).toContain('/root/file1.md');
            expect(files).toContain('/root/file2.mdx');
            expect(files).toContain('/root/subdir/file3.md');
        });
    });

    describe('processDirectory', () => {
        it('should process all markdown files and return modified count', async () => {
            (readdir as jest.Mock).mockImplementation(async (dirPath) => {
                if (dirPath === '/dir') {
                    return [
                        { name: 'file1.md', isDirectory: () => false, isFile: () => true },
                        { name: 'file2.mdx', isDirectory: () => false, isFile: () => true },
                    ] as any;
                }
                return [];
            });

            (readFile as jest.Mock).mockImplementation(async (filePath) => {
                if (filePath === '/dir/file1.md') return '# Test\n<br>'; // Needs fix
                if (filePath === '/dir/file2.mdx') return '---\ntitle: Test\n---\n\n# Valid'; // No fix
                return '';
            });

            (writeFile as jest.Mock).mockResolvedValue(undefined);

            const result = await DocSanitizer.processDirectory('/dir', mockLogger);

            expect(result).toBe(1); // Only 1 file out of 2 needed modification
            expect(writeFile).toHaveBeenCalledTimes(1);
        });
    });

    describe('ensureRepositoryIndex', () => {
        it('should do nothing if index.md already exists', async () => {
            (access as jest.Mock).mockResolvedValue(undefined); // access resolves if file exists
            (writeFile as jest.Mock).mockResolvedValue(undefined);

            await DocSanitizer.ensureRepositoryIndex('/dir', 'test-repo', 'main', mockLogger);

            expect(writeFile).not.toHaveBeenCalled();
        });

        it('should create index.md if it does not exist', async () => {
            (access as jest.Mock).mockRejectedValue(new Error('ENOENT')); // access rejects if missing
            (readdir as jest.Mock).mockImplementation(async (dirPath) => {
                if (dirPath === '/dir') {
                    return [
                        { name: 'doc1.md', isDirectory: () => false, isFile: () => true },
                        { name: 'nested', isDirectory: () => true, isFile: () => false },
                    ] as any;
                }
                if (dirPath === '/dir/nested') {
                    return [
                        { name: 'doc2.md', isDirectory: () => false, isFile: () => true },
                    ] as any;
                }
                return [];
            });
            (writeFile as jest.Mock).mockResolvedValue(undefined);

            await DocSanitizer.ensureRepositoryIndex('/dir', 'test-repo', 'main', mockLogger);

            expect(writeFile).toHaveBeenCalledWith(
                '/dir/index.md',
                expect.stringContaining('title: test-repo - main'),
                'utf-8'
            );
            expect(writeFile).toHaveBeenCalledWith(
                '/dir/index.md',
                expect.stringContaining('- [doc1](doc1.md)'),
                'utf-8'
            );
            expect(writeFile).toHaveBeenCalledWith(
                '/dir/index.md',
                expect.stringContaining('- [doc2](nested/doc2.md)'),
                'utf-8'
            );
        });
    });

    describe('runS3Sync', () => {
        let mockS3Client: any;

        beforeEach(() => {
            jest.clearAllMocks();
            mockS3Client = new S3Client({});
        });

        it('should upload local files and delete remote orphans', async () => {
            // Ensure local files are found
            (readdir as jest.Mock).mockImplementation(async (dirPath) => {
                if (dirPath === '/local/dir') {
                    return [
                        { name: 'file1.md', isDirectory: () => false, isFile: () => true },
                        { name: 'subdir', isDirectory: () => true, isFile: () => false },
                    ] as any;
                }
                if (dirPath === '/local/dir/subdir') {
                    return [
                        { name: 'file2.md', isDirectory: () => false, isFile: () => true },
                    ] as any;
                }
                return [];
            });

            mockS3Client.send.mockImplementation(async (command: any) => {
                const name = command.name || command.constructor.name;
                if (name === 'ListObjectsV2Command') {
                    return {
                        Contents: [
                            { Key: 'prefix/file1.md' }, // matches local
                            { Key: 'prefix/older.md' }, // orphan
                        ]
                    };
                }
                if (name === 'DeleteObjectsCommand') {
                    return {};
                }
                return {};
            });

            await DocSanitizer.runS3Sync('/local/dir', 's3://my-bucket/prefix', {
                s3Client: mockS3Client,
                logger: mockLogger
            });

            // Upload calls (2 local files)
            expect(Upload).toHaveBeenCalledTimes(2);

            // S3 send calls: 1 list, 1 delete
            expect(mockS3Client.send).toHaveBeenCalledTimes(2);

            const listCommandValues = mockS3Client.send.mock.calls[0][0].input;
            expect(listCommandValues.Bucket).toBe('my-bucket');
            expect(listCommandValues.Prefix).toBe('prefix/');

            const deleteCommandValues = mockS3Client.send.mock.calls[1][0].input;
            expect(deleteCommandValues.Bucket).toBe('my-bucket');
            expect(deleteCommandValues.Delete.Objects).toEqual([{ Key: 'prefix/older.md' }]);
        });

        it('should throw an error for invalid S3 URL', async () => {
            await expect(DocSanitizer.runS3Sync('/local', 'invalid-url', { logger: mockLogger }))
                .rejects.toThrow('Invalid S3 URL');
        });
    });

    describe('getGitInfo', () => {
        it('should return empty strings if git fails', () => {
            const result = DocSanitizer.getGitInfo('/non-git-dir');
            expect(result.repoName).toBe('');
            expect(result.branchName).toBe('');
        });
    });

    describe('process', () => {
        it('should orchestrate proper workflow via a temporary directory', async () => {
            const sourceDir = '/src';
            const tempDir = '/tmp/doc-sanitizer-123';

            (mkdtemp as jest.Mock).mockResolvedValue(tempDir);
            (cp as jest.Mock).mockResolvedValue(undefined);
            (rm as jest.Mock).mockResolvedValue(undefined);
            (readdir as jest.Mock).mockImplementation(async (dir) => {
                if (dir === tempDir) {
                    return [{ name: 'doc.md', isDirectory: () => false, isFile: () => true }];
                }
                return [];
            });
            (readFile as jest.Mock).mockResolvedValue('content');
            (writeFile as jest.Mock).mockResolvedValue(undefined);
            (access as jest.Mock).mockResolvedValue(undefined); // Index access ok

            const mockS3Client = new S3Client({});
            (mockS3Client.send as jest.Mock).mockResolvedValue({ Contents: [] });

            await DocSanitizer.process(sourceDir, {
                repoName: 'repo',
                branchName: 'main',
                docS3Path: 's3://docs',
                s3Client: mockS3Client,
                logger: mockLogger
            });

            // Verify temporary directory lifecycle
            expect(mkdtemp).toHaveBeenCalled();
            expect(cp).toHaveBeenCalledWith(sourceDir, tempDir, expect.any(Object));

            // Verify operations switch to the temp directory
            expect(readdir).toHaveBeenCalledWith(tempDir, expect.any(Object));
            expect(access).toHaveBeenCalledWith(expect.stringContaining(tempDir));

            // Verify S3 sync uses temp directory
            expect(Upload).toHaveBeenCalledWith(expect.objectContaining({
                client: mockS3Client,
                params: expect.objectContaining({
                    Bucket: 'docs'
                })
            }));

            // Verify cleanup
            expect(rm).toHaveBeenCalledWith(tempDir, expect.objectContaining({ recursive: true }));
        });

        it('should cleanup temp directory even if processing fails', async () => {
            const tempDir = '/tmp/fail-dir';
            (mkdtemp as jest.Mock).mockResolvedValue(tempDir);
            (cp as jest.Mock).mockRejectedValue(new Error('Copy failed'));
            (rm as jest.Mock).mockResolvedValue(undefined);

            await expect(DocSanitizer.process('/src', {
                docS3Path: 's3://docs',
                logger: mockLogger
            })).rejects.toThrow('Copy failed');

            expect(rm).toHaveBeenCalledWith(tempDir, expect.any(Object));
        });
    });
});
