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
	private constructor(private readonly value: string) {}

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
	 * UUID를 문자열로 반환합니다.
	 * @returns UUID 문자열
	 */
	toString(): string { return this.value };
}