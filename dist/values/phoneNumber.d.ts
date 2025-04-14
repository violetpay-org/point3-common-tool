export declare class PhoneNumber {
    private readonly phoneNumber;
    private readonly phoneNumberType;
    private constructor();
    static create(phoneNumber: string): PhoneNumber;
    static get Mobile(): "mobile";
    static get Landline(): "landline";
    private isMobile;
    private isLandline;
    Type(): "mobile" | "landline";
    toString(): string;
    toMaskedString(): string;
    equal(compare: PhoneNumber): boolean;
}
