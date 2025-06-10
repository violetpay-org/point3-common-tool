export declare class Email {
    private readonly _email;
    private constructor();
    toString(): string;
    equals(email: Email): boolean;
    get Provider(): string;
    static create(email: string): Email;
    private static isValid;
}
