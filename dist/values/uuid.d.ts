export declare class UUID {
    private readonly value;
    private constructor();
    static parse(uuid: string): UUID;
    static fromBigInt(bigint: bigint): UUID;
    toBigInt(): bigint;
    toString(): string;
    equals(other: UUID): boolean;
}
