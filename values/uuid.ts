/**
 * UUID 클래스를 나타냅니다.
 * 
 * 이 클래스는 문자열 형태의 UUID를 감싸며,
 * 올바른 UUID 형식인지 검증하거나 문자열로 반환하는 기능을 제공합니다.
 */
export class UUID {
	/**
	 * UUID 인스턴스를 생성합니다.
	 * @param value UUID 값 (문자열)
	 * @internal
	 */
	private constructor(private readonly value: string) { }

	/**
	 * 주어진 문자열이 올바른 UUID 형식인지 확인한 후, UUID 인스턴스를 생성합니다.
	 * 
	 * @param uuid UUID 문자열
	 * @returns UUID 인스턴스
	 * @throws UUID 형식이 올바르지 않은 경우 예외를 발생시킵니다.
	 */
	static parse(uuid: string): UUID {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
		if (!uuidRegex.test(uuid)) {
			throw new Error('올바르지 않은 UUID 형식입니다.');
		}
		return new UUID(uuid);
	}

	/**
	 * BigInt 값을 UUID로 변환합니다.
	 * 
	 * @param bigint UUID로 변환할 BigInt 값
	 * @returns 생성된 UUID 인스턴스
	 */
	static fromBigInt(bigint: bigint): UUID {
		const strVal = BigInt(bigint).toString(16);
		return new UUID(
			strVal.substring(0, 8) + '-' +
			strVal.substring(8, 12) + '-' +
			strVal.substring(12, 16) + '-' +
			strVal.substring(16)
		);
	}

	/**
	 * UUID 값을 BigInt로 변환합니다.
	 * 
	 * @returns UUID의 BigInt 값
	 */
	toBigInt(): bigint {
		return BigInt("0x" + this.value.split('-').join(''));
	}

	/**
	 * UUID를 문자열로 반환합니다.
	 * @returns UUID 문자열
	 */
	toString(): string { return this.value };

	/**
	 * 두 UUID 인스턴스가 동일한 값을 가지는지 비교합니다.
	 * 
	 * @param other 비교할 다른 UUID 인스턴스
	 * @returns 값이 같으면 true, 그렇지 않으면 false
	 */
	equals(other: UUID): boolean {
		return this.value === other.value;
	}
}