export declare class PhoneNumber {
    private readonly phoneNumber;
    private constructor();
    static create(phoneNumber: string): PhoneNumber;
    private isValid;
    toString(): string;
    equal(compare: PhoneNumber): boolean;
}
