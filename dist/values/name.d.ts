export type MaskedName = string & {
    readonly __brand: 'MaskedName';
};
export declare class Name {
    private readonly _name;
    private constructor();
    static create(name: string): Name;
    toString(): string;
    equals(name: Name): boolean;
    get Masked(): MaskedName;
}
