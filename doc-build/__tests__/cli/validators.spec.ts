import { validateS3Path } from '../../bin/validators/s3-path';

describe('validateS3Path', () => {
    it('should validate correct S3 path', () => {
        const result = validateS3Path('s3://my-bucket/docs');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('should validate S3 path with nested prefix', () => {
        const result = validateS3Path('s3://my-bucket/path/to/docs');
        expect(result.valid).toBe(true);
    });

    it('should reject path without s3:// prefix', () => {
        const result = validateS3Path('my-bucket/docs');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('s3://');
    });

    it('should reject empty path', () => {
        const result = validateS3Path('');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should reject path with only s3://', () => {
        const result = validateS3Path('s3://');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should validate S3 path without prefix', () => {
        const result = validateS3Path('s3://my-bucket');
        expect(result.valid).toBe(true);
    });
});
