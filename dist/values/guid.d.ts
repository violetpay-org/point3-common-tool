export declare class Guid {
    private readonly prefix;
    private readonly uuid;
    private constructor();
    toString(): string;
    static parse(guid: string): Guid;
    static create(prefix: string): Guid;
    equals(other: Guid): boolean;
}
