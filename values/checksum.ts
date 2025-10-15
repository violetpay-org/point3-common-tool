import { createHash } from "crypto";

/**
 * Checksum 값 객체
 * 
 * 다양한 문자열 집합(순서 무관)으로부터 고유한 체크섬(MD5 기반)을 생성하고,
 * 32자리 16진수 문자열 또는 bigint로부터 불변의 체크섬 객체를 제공합니다.
 * 
 * 🔍 주요 책임:
 *   ⦿ 입력 값(문자열 배열)의 순서와 무관하게 동일한 체크섬 생성
 *   ⦿ 32자리 16진수 문자열/BigInt 변환 및 역변환 지원
 *   ⦿ 체크섬 값의 불변성 및 타입 안전성 보장
 * 
 * 🔄 도메인 규칙:
 *   ⦿ 입력 문자열 배열은 정렬 후 체크섬 생성 (순서 무관)
 *   ⦿ 32자리 16진수 문자열만 유효 (MD5 해시)
 *   ⦿ 불변 객체로 외부에서 값 변경 불가
 * 
 * 🏷️ 식별자:
 *   - 체크섬: 32자리 16진수 문자열 (예: "e4d909c290d0fb1ca068ffaddf22cbd0")
 *   - bigint: 128비트 정수값
 * 
 * @example
 * const checksum = Checksum.from("a", "b", "c");
 * console.log(checksum.toHex()); // "e4d909c290d0fb1ca068ffaddf22cbd0"
 * 
 * @see https://datatracker.ietf.org/doc/html/rfc1321 (MD5)
 */
export class Checksum {
    static readonly SEPARATOR = "<|separation|>";
    private readonly bigIntValue: bigint;
    private readonly md5Hex: string;

    protected constructor(
        bigint: bigint,
        md5Hex: string
    ) {
        this.bigIntValue = bigint;
        this.md5Hex = md5Hex;
    }

    /**
     * 문자열(32자리 16진수) 또는 bigint로부터 Checksum 인스턴스를 생성합니다.
     * 
     * - 문자열 입력: 반드시 32자리 16진수 문자열이어야 하며, 내부적으로 bigint로 변환됩니다.
     * - bigint 입력: 32자리 16진수 문자열로 변환하여 사용합니다.
     * 
     * @param input 체크섬 값 (32자리 16진수 문자열 또는 bigint)
     * @returns Checksum 인스턴스
     * @throws {Error} 입력이 32자리 16진수 문자열이 아닐 경우 예외 발생
     * 
     * @example
     * const checksum1 = Checksum.from("e4d909c290d0fb1ca068ffaddf22cbd0");
     * const checksum2 = Checksum.from(BigInt("0xe4d909c290d0fb1ca068ffaddf22cbd0"));
     */
    static from(input: bigint | string): Checksum {
        if (typeof input === "string") {
            if (!/^[0-9a-f]{32}$/i.test(input)) {
                throw new Error("MD5 해시는 반드시 32자리 16진수(0-9, a-f) 문자열이어야 합니다.");
            }
            return new Checksum(BigInt("0x" + input), input);
        }
        return new Checksum(input, input.toString(16).padStart(32, "0"));
    }

    /**
     * 주어진 문자열 배열로부터 체크섬을 생성합니다.
     * 
     * ⚠️ 입력 배열의 순서는 결과에 영향을 주지 않습니다.  
     * (즉, ["a", "b", "c"]와 ["c", "b", "a"]는 동일한 체크섬을 생성합니다.)
     * 
     * @param args 체크섬을 생성할 문자열 목록 (순서 무관)
     * @returns Checksum 인스턴스
     */
    static parse(...args: string[]): Checksum {
        // 입력값의 순서를 정렬하여 순서에 관계없이 동일한 체크섬이 생성되도록 보장
        args = args.sort();
        const content = args.join(this.SEPARATOR);
        return this.from(
            createHash("md5").update(content).digest("hex")
        );
    }

    toBigInt(): bigint {
        return this.bigIntValue;
    };

    toString(): string {
        return this.md5Hex;
    };

    equals(another: Checksum): boolean {
        return this.toBigInt() == another.toBigInt() && 
            this.toString() == another.toString()
    };
};