export declare enum Encoding {
    UTF_8 = 0,
    LOWER_SPECIAL = 1,
    LOWER_UPPER_DIGIT_SPECIAL = 2,
    FIRST_TO_LOWER_SPECIAL = 3,
    ALL_TO_LOWER_SPECIAL = 4
}
export declare class MetaString {
    private inputString;
    private encoding;
    private specialChar1;
    private specialChar2;
    private encodedBytes;
    constructor(inputString: string, encoding: Exclude<Encoding, Encoding.LOWER_UPPER_DIGIT_SPECIAL | Encoding.FIRST_TO_LOWER_SPECIAL | Encoding.ALL_TO_LOWER_SPECIAL | Encoding.UTF_8>, specialChar1: number, specialChar2: number, encodedBytes: Buffer | null);
    getInputString(): string;
    getEncoding(): Encoding;
    getSpecialChar1(): number;
    getSpecialChar2(): number;
    getEncodedBytes(): Buffer | null;
    stripLastChar(): boolean;
}
export declare class Decoder {
    private specialChar1;
    private specialChar2;
    constructor(specialChar1: number, specialChar2: number);
    decode(data: Buffer | null, encoding: Encoding): string;
    private decodeGeneric;
    private decodeRepAllToLowerSpecial;
    private decodeChar;
    private decodeLowerSpecialChar;
    private decodeLowerUpperDigitSpecialChar;
}
export declare class Encoder {
    private specialChar1;
    private specialChar2;
    constructor(specialChar1: number, specialChar2: number);
    encode(input: string): MetaString;
    encodeWithEncoding(input: string, encoding: Encoding.LOWER_SPECIAL): MetaString;
    private encodeLowerSpecial;
    private encodeLowerUpperDigitSpecial;
    private encodeFirstToLowerSpecial;
    private encodeAllToLowerSpecial;
    private encodeGeneric;
    private computeEncoding;
    private computeStringStatistics;
    private charToValueLowerSpecial;
    private charToValueLowerUpperDigitSpecial;
}
