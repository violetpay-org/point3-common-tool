/**
 * 통신사 CarrierId를 나타내는 열거형입니다.
 *
 * - SKT: SK텔레콤
 * - KT: KT
 * - LGU: LG유플러스
 * - SKTMVNO: SKT 알뜰폰(MVNO)
 * - KTMVNO: KT 알뜰폰(MVNO)
 * - LGUMVNO: LGU+ 알뜰폰(MVNO)
 */
export enum CarrierId {
    /** SK텔레콤 */
    SKT = 'SKT',
    /** KT */
    KT = 'KT',
    /** LG유플러스 */
    LGU = 'LGU',
    /** SKT 알뜰폰(MVNO) */
    SKTMVNO = 'SKTMVNO',
    /** KT 알뜰폰(MVNO) */
    KTMVNO = 'KTMVNO',
    /** LGU+ 알뜰폰(MVNO) */
    LGUMVNO = 'LGUMVNO',
}

/**
 * CarrierId 관련 유틸리티 함수 네임스페이스입니다.
 */
export namespace CarrierId {
    /**
     * 주어진 문자열에서 CarrierId를 유도합니다.
     * 문자열이 유효한 CarrierId가 아니면 예외를 발생시킵니다.
     *
     * @param value - 통신사 문자열 (예: 'SKT', 'KT', 'LGU', 'SKTMVNO', 'KTMVNO', 'LGUMVNO')
     * @returns CarrierId
     * @throws Error - 알 수 없는 CarrierId인 경우
     *
     * @example
     * CarrierId.fromString('SKT'); // CarrierId.SKT
     * CarrierId.fromString('KT'); // CarrierId.KT
     * CarrierId.fromString('UNKNOWN'); // throws Error
     */
    export function fromString(value: string): CarrierId {
        switch (value) {
            case CarrierId.SKT:
            case CarrierId.KT:
            case CarrierId.LGU:
            case CarrierId.SKTMVNO:
            case CarrierId.KTMVNO:
            case CarrierId.LGUMVNO:
                return value as CarrierId;
            default:
                throw new Error(`Unknown CarrierId: ${value}`);
        }
    }

    /**
     * 주어진 문자열에서 CarrierId를 유도하려 시도합니다.
     * 문자열이 유효한 CarrierId가 아니면 undefined를 반환합니다.
     *
     * @param value - 통신사 문자열 (예: 'SKT', 'KT', 'LGU', 'SKTMVNO', 'KTMVNO', 'LGUMVNO')
     * @returns CarrierId 또는 undefined
     *
     * @example
     * CarrierId.tryFromString('SKT'); // CarrierId.SKT
     * CarrierId.tryFromString('UNKNOWN'); // undefined
     */
    export function tryFromString(value: string): CarrierId | undefined {
        switch (value) {
            case CarrierId.SKT:
            case CarrierId.KT:
            case CarrierId.LGU:
            case CarrierId.SKTMVNO:
            case CarrierId.KTMVNO:
            case CarrierId.LGUMVNO:
                return value as CarrierId;
            default:
                return undefined;
        }
    }
}
