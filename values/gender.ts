/**
 * Gender Value Object
 * 
 * 성별을 다양한 표현 형식으로 파싱하고 변환하는 값 객체입니다.
 * 
 * 주요 책임:
 *   - 다양한 형식의 성별 값 파싱 (ISO, 한국어, 숫자, 단축형)
 *   - 내부 정규화된 형식("MALE"/"FEMALE")으로 저장
 *   - 요청된 포맷으로 문자열 변환
 * 
 * 도메인 규칙:
 *   - 모든 입력은 "MALE" 또는 "FEMALE"로 정규화
 *   - 대소문자 구분 없이 파싱
 *   - 숫자 1/2, 문자열 "1"/"2", 한국어 "남"/"여", 영문 "M"/"F", ISO "MALE"/"FEMALE" 모두 지원
 * 
 * @example
 * ```typescript
 * const g1 = Gender.parse('남');
 * const g2 = Gender.parse(1);
 * const g3 = Gender.parse('MALE');
 * 
 * Gender.toString(g1, Gender.Format.ISO); // "MALE"
 * g1.as(Gender.Format.KOREAN); // "남"
 * ```
 */
export class Gender extends String {
    readonly __brand = 'Gender';

    constructor(value: string) {
        super(value);
    }

    /**
     * Gender를 지정된 포맷의 문자열로 변환합니다.
     * 
     * @param format 출력 포맷
     * @returns 포맷된 성별 문자열
     */
    as(format: Gender.Format): string {
        return Gender.toString(this, format);
    }
}

export namespace Gender {
    export enum Format {
        /** 
         * - 남자: "MALE"
         * - 여자: "FEMALE" 
         * */
        ISO = 'ISO',

        /** 
         * - 남자: "남"
         * - 여자: "여" 
         * */
        KOREAN = 'KOREAN',

        /** 
         * - 남자: "M"
         * - 여자: "F" 
         * */
        SHORT = 'SHORT',

        /** 
         * - 남자: '1'
         * - 여자: '2' 
         * */
        MOBILEOK = 'MOBILEOK',
    }

    /**
     * 성별 값을 파싱하여 정규화된 Gender 타입으로 변환합니다.
     * 
     * @param value 성별 값 (다양한 형식 지원: "MALE", "M", "남", 1, "1" 등)
     * @returns Gender 브랜드 타입 ("MALE" 또는 "FEMALE")
     * @throws {Error} 유효하지 않은 성별 값인 경우
     */
    export function parse(value: string | number): Gender {
        const normalized = normalizeInput(value);

        if (normalized !== 'MALE' && normalized !== 'FEMALE') {
            throw new Error(`유효하지 않은 성별 값입니다: ${value}`);
        }

        return new Gender(normalized);
    }

    /**
     * Gender를 지정된 포맷의 문자열로 변환합니다.
     * 
     * @param gender Gender 값
     * @param format 출력 포맷
     * @returns 포맷된 성별 문자열
     */
    export function toString(gender: Gender, format: Format): string {
        const normalized = gender.toString();
        const isMale = normalized === 'MALE';

        switch (format) {
            case Format.ISO:
                return normalized;

            case Format.KOREAN:
                return isMale ? '남' : '여';

            case Format.SHORT:
                return isMale ? 'M' : 'F';

            case Format.MOBILEOK:
                return isMale ? '1' : '2';

            default:
                throw new Error(`지원하지 않는 포맷입니다: ${format}`);
        }
    }

    function normalizeInput(value: string | number): string {
        if (typeof value === 'number') {
            if (value === 1) return 'MALE';
            if (value === 2) return 'FEMALE';
            return 'INVALID';
        }

        const upper = value.toUpperCase();

        if (upper === 'MALE' || upper === 'M') return 'MALE';
        if (upper === 'FEMALE' || upper === 'F') return 'FEMALE';

        if (value === '남' || value === '1') return 'MALE';
        if (value === '여' || value === '2') return 'FEMALE';

        return 'INVALID';
    }
}
