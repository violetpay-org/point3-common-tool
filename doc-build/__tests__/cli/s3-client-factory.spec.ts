import { createNcpS3Client } from '../../bin/s3/client-factory';
import { S3Client } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn().mockImplementation((config) => ({
            config,
            send: jest.fn(),
        })),
    };
});

describe('createNcpS3Client', () => {
    const MockedS3Client = S3Client as jest.MockedClass<typeof S3Client>;

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.NCP_ACCESS_KEY_ID;
        delete process.env.NCP_SECRET_ACCESS_KEY;
    });

    it('should create S3Client with CLI options credentials', () => {
        const client = createNcpS3Client({
            endpoint: 'https://kr.object.fin-ncloudstorage.com',
            region: 'fin-standard',
            accessKey: 'cli-access-key',
            secretKey: 'cli-secret-key',
        });

        expect(MockedS3Client).toHaveBeenCalledWith(
            expect.objectContaining({
                endpoint: 'https://kr.object.fin-ncloudstorage.com',
                region: 'fin-standard',
                credentials: {
                    accessKeyId: 'cli-access-key',
                    secretAccessKey: 'cli-secret-key',
                },
                forcePathStyle: true,
            })
        );
        expect(client).toBeDefined();
    });

    it('should create S3Client with environment variable credentials', () => {
        process.env.NCP_ACCESS_KEY_ID = 'env-access-key';
        process.env.NCP_SECRET_ACCESS_KEY = 'env-secret-key';

        const client = createNcpS3Client({
            endpoint: 'https://kr.object.fin-ncloudstorage.com',
            region: 'fin-standard',
        });

        expect(MockedS3Client).toHaveBeenCalledWith(
            expect.objectContaining({
                credentials: {
                    accessKeyId: 'env-access-key',
                    secretAccessKey: 'env-secret-key',
                },
            })
        );
        expect(client).toBeDefined();
    });

    it('should prioritize CLI options over environment variables', () => {
        process.env.NCP_ACCESS_KEY_ID = 'env-access-key';
        process.env.NCP_SECRET_ACCESS_KEY = 'env-secret-key';

        const client = createNcpS3Client({
            endpoint: 'https://kr.object.fin-ncloudstorage.com',
            region: 'fin-standard',
            accessKey: 'cli-access-key',
            secretKey: 'cli-secret-key',
        });

        expect(MockedS3Client).toHaveBeenCalledWith(
            expect.objectContaining({
                credentials: {
                    accessKeyId: 'cli-access-key',
                    secretAccessKey: 'cli-secret-key',
                },
            })
        );
    });

    it('should throw error when no credentials provided', () => {
        expect(() => {
            createNcpS3Client({
                endpoint: 'https://kr.object.fin-ncloudstorage.com',
                region: 'fin-standard',
            });
        }).toThrow('인증 정보가 없습니다');
    });

    it('should include forcePathStyle: true for NCP compatibility', () => {
        const client = createNcpS3Client({
            endpoint: 'https://kr.object.fin-ncloudstorage.com',
            region: 'fin-standard',
            accessKey: 'test-key',
            secretKey: 'test-secret',
        });

        expect(MockedS3Client).toHaveBeenCalledWith(
            expect.objectContaining({
                forcePathStyle: true,
            })
        );
    });
});
