/**
 * Birthdate Value Object
 * 
 * 생년월일을 다양한 포맷으로 파싱하고 변환하는 값 객체입니다.
 * 
 * 주요 책임:
 *   - 다양한 포맷의 생년월일 문자열 파싱 (YYYYMMDD, YYYY-MM-DD, YYMMDD)
 *   - 내부 정규화된 형식(YYYY-MM-DD)으로 저장
 *   - 요청된 포맷으로 문자열 변환
 * 
 * 도메인 규칙:
 *   - YYMMDD 포맷은 00-99 범위의 연도를 1900-1999 또는 2000-2099로 해석
 *   - 내부적으로 YYYY-MM-DD 형식으로 정규화하여 저장
 *   - 달력 유효성 검증 없음 (포맷 일치 여부만 검증)
 * 
 * @example
 * ```typescript
 * const bd1 = Birthdate.parse('19900115', Birthdate.Format.YYYYMMDD);
 * const bd2 = Birthdate.parse('1990-01-15', Birthdate.Format.YYYY_MM_DD);
 * const bd3 = Birthdate.parse('900115', Birthdate.Format.YYMMDD);
 * 
 * Birthdate.toString(bd1, Birthdate.Format.YYYY_MM_DD); // "1990-01-15"
 * bd1.as(Birthdate.Format.YYYY_MM_DD); // "1990-01-15"
 * ```
 */
export class Birthdate extends String {
    readonly __brand = 'Birthdate';

    constructor(value: string) {
        super(value);
    }

    /**
     * Birthdate를 지정된 포맷의 문자열로 변환합니다.
     * 
     * @param format 출력 포맷
     * @returns 포맷된 생년월일 문자열
     */
    as(format: Birthdate.Format): string {
        return Birthdate.toString(this, format);
    }
}

export namespace Birthdate {
    export enum Format {
        YYYYMMDD = 'YYYYMMDD',
        YYYY_MM_DD = 'YYYY-MM-DD',
        YYMMDD = 'YYMMDD',
    }

    /**
     * 생년월일 문자열을 지정된 포맷으로 파싱합니다.
     * 
     * @param value 생년월일 문자열
     * @param format 입력 포맷
     * @returns Birthdate 브랜드 타입
     * @throws {Error} 포맷이 일치하지 않거나 유효하지 않은 경우
     */
    export function parse(value: string, format: Format): Birthdate {
        let normalized: string;

        switch (format) {
            case Format.YYYYMMDD:
                if (!/^\d{8}$/.test(value)) {
                    throw new Error('YYYYMMDD 포맷은 8자리 숫자여야 합니다.');
                }
                normalized = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
                break;

            case Format.YYYY_MM_DD:
                if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    throw new Error('YYYY-MM-DD 포맷은 "YYYY-MM-DD" 형식이어야 합니다.');
                }
                normalized = value;
                break;

            case Format.YYMMDD:
                if (!/^\d{6}$/.test(value)) {
                    throw new Error('YYMMDD 포맷은 6자리 숫자여야 합니다.');
                }
                const yy = parseInt(value.slice(0, 2), 10);
                const century = yy >= 0 && yy <= 99 ? (yy >= 0 && yy <= 50 ? '20' : '19') : '19';
                const fullYear = `${century}${value.slice(0, 2)}`;
                normalized = `${fullYear}-${value.slice(2, 4)}-${value.slice(4, 6)}`;
                break;

            default:
                throw new Error(`지원하지 않는 포맷입니다: ${format}`);
        }

        return new Birthdate(normalized);
    }

    /**
     * Birthdate를 지정된 포맷의 문자열로 변환합니다.
     * 
     * @param birthdate Birthdate 값
     * @param format 출력 포맷
     * @returns 포맷된 생년월일 문자열
     */
    export function toString(birthdate: Birthdate, format: Format): string {
        const normalized = birthdate.toString();

        switch (format) {
            case Format.YYYYMMDD:
                return normalized.replace(/-/g, '');

            case Format.YYYY_MM_DD:
                return normalized;

            case Format.YYMMDD:
                const year = normalized.slice(0, 4);
                const yy = year.slice(2, 4);
                return `${yy}${normalized.slice(5, 7)}${normalized.slice(8, 10)}`;

            default:
                throw new Error(`지원하지 않는 포맷입니다: ${format}`);
        }
    }
}
