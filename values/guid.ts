import { v7 as uuidv7 } from 'uuid';
import { UUID } from './uuid';

/** @internal */
export class Guid {
    /** @internal */
    private readonly prefix: string;
    /** @internal */
    private readonly uuid: UUID;

    /** @internal */
    private constructor(prefix: string, uuid: string) {
        if (prefix.includes('-')) {
            throw new Error('Prefix should not contain "-"')
        }

        this.prefix = prefix;
        this.uuid = UUID.parse(uuid);
    }

    /** @internal */
    public toString(): string {
        return this.prefix + '-' + this.uuid.toString();
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

    public get Prefix(): string {
        return this.prefix
    }

    public get UUID(): UUID {
        return this.uuid;
    }

    /** @internal */
    public equals(other: Guid) {
        return ((this.prefix + '-' + this.uuid.toString()) === other.toString());
    }
}