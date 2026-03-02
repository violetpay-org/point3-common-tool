import { S3Client } from '@aws-sdk/client-s3';

/**
 * NCP S3 Client 생성 옵션
 */
export interface NcpS3ClientOptions {
    endpoint: string;
    region: string;
    accessKey?: string;
    secretKey?: string;
}

/**
 * NCP Object Storage용 S3 Client를 생성합니다.
 * 
 * 인증 정보 우선순위:
 * 1. CLI 옵션 (accessKey, secretKey)
 * 2. 환경변수 (NCP_ACCESS_KEY_ID, NCP_SECRET_ACCESS_KEY)
 * 
 * @param options - S3 Client 생성 옵션
 * @returns NCP Object Storage용으로 구성된 S3Client 인스턴스
 * @throws {Error} 인증 정보가 없는 경우 한국어 에러 메시지와 함께 예외 발생
 */
export function createNcpS3Client(options: NcpS3ClientOptions): S3Client {
    // 인증 정보 우선순위: CLI 옵션 > 환경변수
    const accessKeyId = options.accessKey || process.env.NCP_ACCESS_KEY_ID;
    const secretAccessKey = options.secretKey || process.env.NCP_SECRET_ACCESS_KEY;

    // 인증 정보 검증
    if (!accessKeyId || !secretAccessKey) {
        throw new Error(
            `인증 정보가 없습니다.

다음 중 하나의 방법으로 인증 정보를 제공하세요:
  1. CLI 옵션: --access-key <키> --secret-key <키>
  2. 환경변수: export NCP_ACCESS_KEY_ID=<키>
               export NCP_SECRET_ACCESS_KEY=<키>

NCP API 인증키는 NCP 콘솔 > 마이페이지 > API 인증키 관리에서 발급받을 수 있습니다.
상세 안내: https://api-fin.ncloud-docs.com/docs/common-ncpapi`
        );
    }

    // NCP Object Storage용 S3 Client 생성
    return new S3Client({
        endpoint: options.endpoint,
        region: options.region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        forcePathStyle: true, // NCP Object Storage 필수 설정
    });
}
