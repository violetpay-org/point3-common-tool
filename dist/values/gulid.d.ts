export declare class Gulid {
    private _prefix;
    private _value;
    private constructor();
    static create(prefix?: string): Gulid;
    static parse(id: string): Gulid;
    get prefix(): string;
    toString(): string;
}
