export function validateS3Path(input: string): { valid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
        return { valid: false, error: 'S3 경로는 문자열이어야 합니다.' };
    }

    if (!input.startsWith('s3://')) {
        return {
            valid: false,
            error: `S3 경로 형식이 올바르지 않습니다. 's3://버킷이름/경로' 형식으로 입력하세요. (입력값: ${input})`
        };
    }

    const cleanUrl = input.replace('s3://', '');
    if (!cleanUrl) {
        return {
            valid: false,
            error: `S3 경로 형식이 올바르지 않습니다. 's3://버킷이름/경로' 형식으로 입력하세요. (입력값: ${input})`
        };
    }

    const parts = cleanUrl.split('/');
    const bucket = parts[0];

    if (!bucket) {
        return {
            valid: false,
            error: `S3 경로 형식이 올바르지 않습니다. 's3://버킷이름/경로' 형식으로 입력하세요. (입력값: ${input})`
        };
    }

    const bucketNameRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!bucketNameRegex.test(bucket)) {
        return {
            valid: false,
            error: `버킷 이름이 올바르지 않습니다. 버킷 이름은 소문자, 숫자, 하이픈(-)만 사용할 수 있으며, 3-63자 사이여야 합니다. (입력값: ${bucket})`
        };
    }

    return { valid: true };
}
