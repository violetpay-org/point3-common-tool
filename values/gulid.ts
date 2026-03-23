// Gulid value object for migration to point3-common-tool

import { ulid } from 'ulid';

export class Gulid {
    private readonly _prefix: string;
    private readonly _ulid: string;

    private constructor(prefix: string, ulidValue: string) {
        this._prefix = prefix;
        this._ulid = ulidValue;
    }

    static create(prefix: string): Gulid {
        if (!prefix || prefix.length === 0) {
            throw new Error('Prefix is required');
        }
        if (prefix.includes(':')) {
            throw new Error('Prefix must not contain ":"');
        }
        return new Gulid(prefix, ulid());
    }

    static parse(id: string): Gulid {
        const colonCount = (id.match(/:/g) || []).length;
        if (colonCount === 0) {
            throw new Error('Invalid Gulid format: missing ":" separator');
        }
        if (colonCount > 1) {
            throw new Error('Invalid Gulid format: multiple ":" not allowed');
        }

        const colonIndex = id.indexOf(':');
        const prefix = id.substring(0, colonIndex);
        const ulidPart = id.substring(colonIndex + 1);

        if (!prefix || prefix.length === 0) {
            throw new Error('Invalid Gulid format: empty prefix');
        }
        if (ulidPart.length !== 26) {
            throw new Error(`Invalid Gulid format: ULID must be 26 chars, got ${ulidPart.length}`);
        }

        return new Gulid(prefix, ulidPart);
    }

    get Prefix(): string {
        return this._prefix;
    }

    /** @deprecated Use `Prefix` instead. Will be removed in next major version. */
    get prefix(): string {
        return this._prefix;
    }

    get ULID(): string {
        return this._ulid;
    }

    toString(): string {
        return `${this._prefix}:${this._ulid}`;
    }

    equals(other: Gulid | null | undefined): boolean {
        if (other == null) {
            return false;
        }
        return this._prefix === other._prefix && this._ulid === other._ulid;
    }
} 