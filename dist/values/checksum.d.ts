export declare class Checksum {
    static readonly SEPARATOR = "<|separation|>";
    private readonly bigIntValue;
    private readonly md5Hex;
    protected constructor(bigint: bigint, md5Hex: string);
    static from(input: bigint | string): Checksum;
    static parse(...args: string[]): Checksum;
    toBigInt(): bigint;
    toString(): string;
    equals(another: Checksum): boolean;
}
