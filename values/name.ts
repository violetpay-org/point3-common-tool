// Name value object for migration to point3-common-tool

export type MaskedName = string & { readonly __brand: 'MaskedName' };

export class Name {
    private constructor(private readonly _name: string) {
        this._name = _name;
    }

    static create(name: string): Name {
        // TODO: Add validation if needed
        return new Name(name);
    }

    public toString(): string {
        return this._name;
    }

    public equals(name: Name): boolean {
        return this._name === name._name;
    }

    /**
     * 마스킹된 사용자 이름
     * 3글자: 앞1+*+뒤1, 4글자 이상: 앞2+*+뒤1
     * @returns 마스킹된 사용자 이름
     */
    get Masked(): MaskedName {
        const len = this._name.length;
        if (len === 2) {
            return (this._name[0] + '*') as MaskedName;
        } else if (len === 3) {
            return (this._name[0] + '*' + this._name[2]) as MaskedName;
        } else if (len > 3) {
            return (this._name.slice(0, 2) + '*' + this._name.slice(-1)) as MaskedName;
        } else {
            return this._name as MaskedName;
        }
    }
} 