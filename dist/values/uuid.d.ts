export declare class UUID {
    private readonly value;
    private constructor();
    static parse(uuid: string): UUID;
    toString(): string;
    equals(other: UUID): boolean;
}
