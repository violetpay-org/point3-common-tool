// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

// ==================== meta_string.ts ====================

/** Encoding Algorithms Flags */
export enum Encoding {
    UTF_8 = 0x00,
    LOWER_SPECIAL = 0x01,
    LOWER_UPPER_DIGIT_SPECIAL = 0x02,
    FIRST_TO_LOWER_SPECIAL = 0x03,
    ALL_TO_LOWER_SPECIAL = 0x04,
}

/** MetaString saves the serialized data */
export class MetaString {
    constructor(
        private inputString: string,
        private encoding: Exclude<Encoding,
            Encoding.LOWER_UPPER_DIGIT_SPECIAL |
            Encoding.FIRST_TO_LOWER_SPECIAL |
            Encoding.ALL_TO_LOWER_SPECIAL |
            Encoding.UTF_8>,
        private specialChar1: number,
        private specialChar2: number,
        private encodedBytes: Buffer | null
    ) { }

    getInputString(): string {
        return this.inputString;
    }

    getEncoding(): Encoding {
        return this.encoding;
    }

    getSpecialChar1(): number {
        return this.specialChar1;
    }

    getSpecialChar2(): number {
        return this.specialChar2;
    }

    getEncodedBytes(): Buffer | null {
        return this.encodedBytes;
    }

    /** StripLastChar return true if last char should be stripped */
    stripLastChar(): boolean {
        // if (this.encoding === Encoding.UTF_8) {
        //     return false;
        // }
        if (this.encodedBytes === null) {
            return false;
        }
        return (this.encodedBytes[0] & 0x80) > 0;
    }
}

// ==================== decoder.ts ====================

export class Decoder {
    constructor(
        private specialChar1: number,
        private specialChar2: number
    ) { }

    /** Decode - Accept an encodedBytes byte array, and the encoding method */
    decode(data: Buffer | null, encoding: Encoding): string {
        // we prepend one bit at the start to indicate whether strip last char
        // so checking empty here will be convenient for decoding procedure
        if (data === null) {
            return "";
        }

        let chars: Buffer;
        switch (encoding) {
            case Encoding.LOWER_SPECIAL:
                chars = this.decodeGeneric(data, encoding);
                break;
            case Encoding.LOWER_UPPER_DIGIT_SPECIAL:
                chars = this.decodeGeneric(data, encoding);
                break;
            case Encoding.FIRST_TO_LOWER_SPECIAL:
                chars = this.decodeGeneric(data, Encoding.LOWER_SPECIAL);
                chars[0] = chars[0] - "a".charCodeAt(0) + "A".charCodeAt(0);
                break;
            case Encoding.ALL_TO_LOWER_SPECIAL:
                chars = this.decodeRepAllToLowerSpecial(data, Encoding.LOWER_SPECIAL);
                break;
            case Encoding.UTF_8:
                chars = data;
                break;
            default:
                throw new Error(`Unexpected encoding flag: ${encoding}`);
        }

        return chars.toString("utf8");
    }

    /** DecodeGeneric - algorithm is LowerSpecial or LowerUpperDigit */
    private decodeGeneric(data: Buffer, algorithm: Encoding): Buffer {
        const bitsPerChar = algorithm === Encoding.LOWER_UPPER_DIGIT_SPECIAL ? 6 : 5;

        // Retrieve 5 bits every iteration from data, convert them to characters, and save them to chars
        // "abc" encodedBytes as [00000] [000,01] [00010] [0, corresponding to three bytes, which are 0, 68, 0
        // Take the highest digit first, then the lower, in order

        // here access data[0] before entering the loop, so we had to deal with empty data in Decode method
        // totChars * bitsPerChar <= totBits < (totChars + 1) * bitsPerChar
        const stripLastChar = (data[0] & 0x80) >> 7;
        const totBits = data.length * 8 - 1 - stripLastChar * bitsPerChar;
        const totChars = Math.floor(totBits / bitsPerChar);
        const chars = Buffer.alloc(totChars);

        let bitPos = 6,
            bitCount = 1; // first highest bit indicates whether strip last char

        for (let i = 0; i < totChars; i++) {
            let val = 0;
            for (let j = 0; j < bitsPerChar; j++) {
                if ((data[Math.floor(bitCount / 8)] & (1 << bitPos)) > 0) {
                    val |= 1 << (bitsPerChar - j - 1);
                }
                bitPos = (bitPos - 1 + 8) % 8;
                bitCount++;
            }
            const ch = this.decodeChar(val, algorithm);
            chars[i] = ch;
        }
        return chars;
    }

    private decodeRepAllToLowerSpecial(data: Buffer, algorithm: Encoding): Buffer {
        // Decode the data to the lowercase letters, then convert
        const str = this.decodeGeneric(data, algorithm);
        const chars = Buffer.alloc(str.length);
        let j = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === "1".charCodeAt(0)) {
                chars[j] =
                    str[i + 1] - "a".charCodeAt(0) + "A".charCodeAt(0);
                i++;
            } else {
                chars[j] = str[i];
            }
            j++;
        }
        return chars.slice(0, j);
    }

    /** Decoding char for two encoding algorithms */
    private decodeChar(val: number, encoding: Encoding): number {
        switch (encoding) {
            case Encoding.LOWER_SPECIAL:
                return this.decodeLowerSpecialChar(val);
            case Encoding.LOWER_UPPER_DIGIT_SPECIAL:
                return this.decodeLowerUpperDigitSpecialChar(val);
            default:
                throw new Error(`Illegal encoding flag: ${encoding}`);
        }
    }

    /** Decoding char for LOWER_SPECIAL Encoding Algorithm */
    private decodeLowerSpecialChar(charValue: number): number {
        if (charValue <= 25) {
            return "a".charCodeAt(0) + charValue;
        } else if (charValue === 26) {
            return "0".charCodeAt(0);
        } else if (charValue === 27) {
            return "_".charCodeAt(0);
        } else if (charValue === 28) {
            return "3".charCodeAt(0);
        } else if (charValue === 29) {
            return "1".charCodeAt(0);
        } else {
            throw new Error(`Invalid character value for LOWER_SPECIAL: ${charValue}`);
        }
    }

    /** Decoding char for LOWER_UPPER_DIGIT_SPECIAL Encoding Algorithm */
    private decodeLowerUpperDigitSpecialChar(charValue: number): number {
        if (charValue <= 25) {
            return "a".charCodeAt(0) + charValue;
        } else if (charValue >= 26 && charValue <= 51) {
            return "A".charCodeAt(0) + (charValue - 26);
        } else if (charValue >= 52 && charValue <= 61) {
            return "0".charCodeAt(0) + (charValue - 52);
        } else if (charValue === 62) {
            return this.specialChar1;
        } else if (charValue === 63) {
            return this.specialChar2;
        } else {
            throw new Error(
                `Invalid character value for LOWER_UPPER_DIGIT_SPECIAL: ${charValue}`
            );
        }
    }
}

// ==================== encoder.ts ====================

interface StringStatistics {
    digitCount: number;
    upperCount: number;
    canLowerSpecialEncoded: boolean;
    canLowerUpperDigitSpecialEncoded: boolean;
}

export class Encoder {
    constructor(
        private specialChar1: number,
        private specialChar2: number
    ) { }

    /** Encode the input string to MetaString using adaptive encoding */
    encode(input: string): MetaString {
        const encoding = this.computeEncoding(input);
        if (encoding != Encoding.LOWER_SPECIAL) {
            throw new Error("LOWER_SPECIAL is not supported");
        }

        return this.encodeWithEncoding(input, encoding);
    }

    /** EncodeWithEncoding - Encodes the input string to MetaString using specified encoding */
    encodeWithEncoding(input: string, encoding: Encoding.LOWER_SPECIAL): MetaString {
        if (input.length > 32767) {
            throw new Error("long meta string than 32767 is not allowed");
        }

        if (input.length === 0) {
            // we prepend one bit at the start to indicate whether strip last char
            // so checking empty here will be convenient for encoding procedure
            return new MetaString(
                input,
                encoding,
                this.specialChar1,
                this.specialChar2,
                null
            );
        }

        // execute encoding algorithm according to the encoding mode
        let encodedBytes: Buffer;
        switch (encoding) {
            case Encoding.LOWER_SPECIAL:
                encodedBytes = this.encodeLowerSpecial(input);
                break;
            // case Encoding.LOWER_UPPER_DIGIT_SPECIAL:
            //     throw new Error("LOWER_UPPER_DIGIT_SPECIAL is not supported");
            //     encodedBytes = this.encodeLowerUpperDigitSpecial(input);
            //     break;
            // case Encoding.FIRST_TO_LOWER_SPECIAL:
            //     throw new Error("LOWER_UPPER_DIGIT_SPECIAL is not supported");
            //     encodedBytes = this.encodeFirstToLowerSpecial(input);
            //     break;
            // case Encoding.ALL_TO_LOWER_SPECIAL:
            //     throw new Error("LOWER_UPPER_DIGIT_SPECIAL is not supported");
            //     encodedBytes = this.encodeAllToLowerSpecial(input);
            //     break;
            default:
                throw new Error("LOWER_UPPER_DIGIT_SPECIAL is not supported");
                // UTF-8 Encoding, stay the same
                encodedBytes = Buffer.from(input, "utf8");
        }

        return new MetaString(
            input,
            encoding,
            this.specialChar1,
            this.specialChar2,
            encodedBytes
        );
    }

    private encodeLowerSpecial(input: string): Buffer {
        return this.encodeGeneric(Buffer.from(input), 5);
    }

    private encodeLowerUpperDigitSpecial(input: string): Buffer {
        return this.encodeGeneric(Buffer.from(input), 6);
    }

    private encodeFirstToLowerSpecial(input: string): Buffer {
        // all chars in string are ASCII, so we can modify input[0] directly
        const chars = Buffer.from(input);
        chars[0] = chars[0] - "A".charCodeAt(0) + "a".charCodeAt(0);
        return this.encodeGeneric(chars, 5);
    }

    private encodeAllToLowerSpecial(input: string): Buffer {
        const chars = Buffer.alloc(input.length + countUppers(input));
        let idx = 0;
        for (let i = 0; i < input.length; i++) {
            const code = input.charCodeAt(i);
            if (code >= "A".charCodeAt(0) && code <= "Z".charCodeAt(0)) {
                chars[idx] = "1".charCodeAt(0);
                chars[idx + 1] = code - "A".charCodeAt(0) + "a".charCodeAt(0);
                idx += 2;
            } else {
                chars[idx] = code;
                idx += 1;
            }
        }
        return this.encodeGeneric(chars, 5);
    }

    private encodeGeneric(chars: Buffer, bitsPerChar: number): Buffer {
        const totBits = chars.length * bitsPerChar + 1;
        const result = Buffer.alloc(Math.floor((totBits + 7) / 8));
        let currentBit = 1;

        for (let i = 0; i < chars.length; i++) {
            const c = chars[i];
            let value: number;
            if (bitsPerChar === 5) {
                value = this.charToValueLowerSpecial(c);
            } else if (bitsPerChar === 6) {
                value = this.charToValueLowerUpperDigitSpecial(c);
            } else {
                throw new Error(`Invalid bitsPerChar: ${bitsPerChar}`);
            }

            // Use currentBit to figure out where the result should be filled
            // abc encodedBytes as [00000] [000,01] [00010] [0, corresponding to three bytes, which are 0, 68, 0 (68 = 64 + 4)
            // In order, put the highest bit first, then the lower
            for (let j = bitsPerChar - 1; j >= 0; j--) {
                if ((value & (1 << j)) > 0) {
                    const bytePos = Math.floor(currentBit / 8);
                    const bitPos = currentBit % 8;
                    result[bytePos] |= 1 << (7 - bitPos);
                }
                currentBit++;
            }
        }

        if (totBits + bitsPerChar <= result.length * 8) {
            result[0] |= 0x80;
        }

        return result;
    }

    private computeEncoding(input: string): Encoding {
        const statistics = this.computeStringStatistics(input);

        if (statistics.canLowerSpecialEncoded) {
            return Encoding.LOWER_SPECIAL;
        }

        if (statistics.canLowerUpperDigitSpecialEncoded) {
            // Here, the string contains only letters, numbers, and two special symbols
            if (statistics.digitCount !== 0) {
                return Encoding.LOWER_UPPER_DIGIT_SPECIAL;
            }

            const upperCount = statistics.upperCount;
            if (
                upperCount === 1 &&
                input.charCodeAt(0) >= "A".charCodeAt(0) &&
                input.charCodeAt(0) <= "Z".charCodeAt(0)
            ) {
                return Encoding.FIRST_TO_LOWER_SPECIAL;
            }

            if ((input.length + upperCount) * 5 < input.length * 6) {
                return Encoding.ALL_TO_LOWER_SPECIAL;
            }

            return Encoding.LOWER_UPPER_DIGIT_SPECIAL;
        }

        return Encoding.UTF_8;
    }

    private computeStringStatistics(input: string): StringStatistics {
        let digitCount = 0,
            upperCount = 0;
        let canLowerSpecialEncoded = true;
        let canLowerUpperDigitSpecialEncoded = true;

        for (let i = 0; i < input.length; i++) {
            const c = input.charCodeAt(i);

            if (canLowerUpperDigitSpecialEncoded) {
                if (
                    !(
                        (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) ||
                        (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) ||
                        (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) ||
                        c === this.specialChar1 ||
                        c === this.specialChar2
                    )
                ) {
                    canLowerUpperDigitSpecialEncoded = false;
                }
            }

            if (canLowerSpecialEncoded) {
                if (
                    !(
                        (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) ||
                        c === "0".charCodeAt(0) ||
                        c === "_".charCodeAt(0) ||
                        c === "3".charCodeAt(0) ||
                        c === "1".charCodeAt(0)
                    )
                ) {
                    canLowerSpecialEncoded = false;
                }
            }

            if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
                digitCount++;
            }

            if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
                upperCount++;
            }
        }

        return {
            digitCount,
            upperCount,
            canLowerSpecialEncoded,
            canLowerUpperDigitSpecialEncoded,
        };
    }

    private charToValueLowerSpecial(c: number): number {
        if (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
            return c - "a".charCodeAt(0);
        } else if (c === "0".charCodeAt(0)) {
            return 26;
        } else if (c === "_".charCodeAt(0)) {
            return 27;
        } else if (c === "3".charCodeAt(0)) {
            return 28;
        } else if (c === "1".charCodeAt(0)) {
            return 29;
        } else {
            throw new Error(
                `Unsupported character for LOWER_SPECIAL encoding: ${String.fromCharCode(c)}`
            );
        }
    }

    private charToValueLowerUpperDigitSpecial(c: number): number {
        if (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
            return c - "a".charCodeAt(0);
        } else if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
            return 26 + (c - "A".charCodeAt(0));
        } else if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
            return 52 + (c - "0".charCodeAt(0));
        } else if (c === this.specialChar1) {
            return 62;
        } else if (c === this.specialChar2) {
            return 63;
        } else {
            throw new Error(
                `Unsupported character for LOWER_UPPER_DIGIT_SPECIAL encoding: ${String.fromCharCode(c)}`
            );
        }
    }
}

function countUppers(str: string): number {
    let cnt = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
            cnt++;
        }
    }
    return cnt;
}