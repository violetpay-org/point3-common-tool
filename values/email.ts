// Email value object for migration to point3-common-tool

export class Email {
    private constructor(private readonly _email: string) {
        this._email = _email;
    }

    public toString(): string {
        return this._email;
    }

    public equals(email: Email): boolean {
        return this._email === email._email;
    }

    public get Provider(): string {
        return this._email.split('@')[1];
    }

    static create(email: string): Email {
        if (!this.isValid(email)) throw new Error('Invalid email');
        return new Email(email);
    }

    private static isValid(email: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
} 