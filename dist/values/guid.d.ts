import { UUID } from './uuid';
export declare class Guid {
    private readonly prefix;
    private readonly uuid;
    private constructor();
    toString(): string;
    static parse(guid: string): Guid;
    static create(prefix: string): Guid;
    get Prefix(): string;
    get UUID(): UUID;
    equals(other: Guid): boolean;
}
