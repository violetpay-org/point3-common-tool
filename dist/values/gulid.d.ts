export declare class Gulid {
    private readonly _prefix;
    private readonly _ulid;
    private constructor();
    static create(prefix: string): Gulid;
    static parse(id: string): Gulid;
    get Prefix(): string;
    get prefix(): string;
    get ULID(): string;
    toString(): string;
    equals(other: Gulid | null | undefined): boolean;
}
