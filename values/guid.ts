import {v7 as uuidv7} from 'uuid';

/** @internal */
export class Guid {
    /** @internal */
    private readonly prefix: string;
    /** @internal */
    private readonly uuid: string;

    /** @internal */
    private constructor(prefix: string, uuid: string) {
        if (prefix.includes('-')) {
            throw new Error('Prefix should not contain "-"')
        }

        this.prefix = prefix;
        this.uuid = uuid;
    }

    /** @internal */
    public toString(): string {
        return this.prefix + '-' + this.uuid;
    }

    /** @internal */
    public static parse(guid: string): Guid {
        const sectionedId = guid.split('-');
        if (sectionedId.length !== 6) {
            throw new Error('Invalid Guid');
        }

        const prefix = sectionedId[0];
        const uuid = sectionedId.slice(1).join('-');

        return new Guid(prefix, uuid);
    }

    /** @internal */
    public static create(prefix: string): Guid {
        const hash = uuidv7();
        // prefix should not contain '-'
        if (prefix.includes('-')) {
            throw new Error('Prefix should not contain "-"')
        }

        return new Guid(prefix, hash);
    }

    /** @internal */
    public equals(other: Guid) {
        return ((this.prefix + '-' + this.uuid) === other.toString());
    }
}