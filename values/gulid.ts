// Gulid value object for migration to point3-common-tool

import { ulid } from 'ulid';

export class Gulid {
    private _prefix: string;
    private _value: string;

    private constructor(prefix: string, value: string) {
        this._prefix = prefix;
        this._value = value;
    }

    static create(prefix?: string): Gulid {
        return new Gulid(prefix ?? '', ulid());
    }

    static parse(id: string): Gulid {
        // can be more than one colon
        // find the last colon
        const lastColonIndex = id.lastIndexOf(':');
        const prefix = id.substring(0, lastColonIndex);
        const value = id.substring(lastColonIndex + 1);

        return new Gulid(prefix, value);
    }

    get prefix(): string {
        return this._prefix;
    }

    toString(): string {
        return `${this._prefix}:${this._value}`;
    }
} 