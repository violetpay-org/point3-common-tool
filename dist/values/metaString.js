"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encoder = exports.Decoder = exports.MetaString = exports.Encoding = void 0;
var Encoding;
(function (Encoding) {
    Encoding[Encoding["UTF_8"] = 0] = "UTF_8";
    Encoding[Encoding["LOWER_SPECIAL"] = 1] = "LOWER_SPECIAL";
    Encoding[Encoding["LOWER_UPPER_DIGIT_SPECIAL"] = 2] = "LOWER_UPPER_DIGIT_SPECIAL";
    Encoding[Encoding["FIRST_TO_LOWER_SPECIAL"] = 3] = "FIRST_TO_LOWER_SPECIAL";
    Encoding[Encoding["ALL_TO_LOWER_SPECIAL"] = 4] = "ALL_TO_LOWER_SPECIAL";
})(Encoding || (exports.Encoding = Encoding = {}));
class MetaString {
    constructor(inputString, encoding, specialChar1, specialChar2, encodedBytes) {
        this.inputString = inputString;
        this.encoding = encoding;
        this.specialChar1 = specialChar1;
        this.specialChar2 = specialChar2;
        this.encodedBytes = encodedBytes;
    }
    getInputString() {
        return this.inputString;
    }
    getEncoding() {
        return this.encoding;
    }
    getSpecialChar1() {
        return this.specialChar1;
    }
    getSpecialChar2() {
        return this.specialChar2;
    }
    getEncodedBytes() {
        return this.encodedBytes;
    }
    stripLastChar() {
        if (this.encodedBytes === null) {
            return false;
        }
        return (this.encodedBytes[0] & 0x80) > 0;
    }
}
exports.MetaString = MetaString;
class Decoder {
    constructor(specialChar1, specialChar2) {
        this.specialChar1 = specialChar1;
        this.specialChar2 = specialChar2;
    }
    decode(data, encoding) {
        if (data === null) {
            return "";
        }
        let chars;
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
    decodeGeneric(data, algorithm) {
        const bitsPerChar = algorithm === Encoding.LOWER_UPPER_DIGIT_SPECIAL ? 6 : 5;
        const stripLastChar = (data[0] & 0x80) >> 7;
        const totBits = data.length * 8 - 1 - stripLastChar * bitsPerChar;
        const totChars = Math.floor(totBits / bitsPerChar);
        const chars = Buffer.alloc(totChars);
        let bitPos = 6, bitCount = 1;
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
    decodeRepAllToLowerSpecial(data, algorithm) {
        const str = this.decodeGeneric(data, algorithm);
        const chars = Buffer.alloc(str.length);
        let j = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === "1".charCodeAt(0)) {
                chars[j] =
                    str[i + 1] - "a".charCodeAt(0) + "A".charCodeAt(0);
                i++;
            }
            else {
                chars[j] = str[i];
            }
            j++;
        }
        return chars.slice(0, j);
    }
    decodeChar(val, encoding) {
        switch (encoding) {
            case Encoding.LOWER_SPECIAL:
                return this.decodeLowerSpecialChar(val);
            case Encoding.LOWER_UPPER_DIGIT_SPECIAL:
                return this.decodeLowerUpperDigitSpecialChar(val);
            default:
                throw new Error(`Illegal encoding flag: ${encoding}`);
        }
    }
    decodeLowerSpecialChar(charValue) {
        if (charValue <= 25) {
            return "a".charCodeAt(0) + charValue;
        }
        else if (charValue === 26) {
            return "0".charCodeAt(0);
        }
        else if (charValue === 27) {
            return "_".charCodeAt(0);
        }
        else if (charValue === 28) {
            return "3".charCodeAt(0);
        }
        else if (charValue === 29) {
            return "1".charCodeAt(0);
        }
        else {
            throw new Error(`Invalid character value for LOWER_SPECIAL: ${charValue}`);
        }
    }
    decodeLowerUpperDigitSpecialChar(charValue) {
        if (charValue <= 25) {
            return "a".charCodeAt(0) + charValue;
        }
        else if (charValue >= 26 && charValue <= 51) {
            return "A".charCodeAt(0) + (charValue - 26);
        }
        else if (charValue >= 52 && charValue <= 61) {
            return "0".charCodeAt(0) + (charValue - 52);
        }
        else if (charValue === 62) {
            return this.specialChar1;
        }
        else if (charValue === 63) {
            return this.specialChar2;
        }
        else {
            throw new Error(`Invalid character value for LOWER_UPPER_DIGIT_SPECIAL: ${charValue}`);
        }
    }
}
exports.Decoder = Decoder;
class Encoder {
    constructor(specialChar1, specialChar2) {
        this.specialChar1 = specialChar1;
        this.specialChar2 = specialChar2;
    }
    encode(input) {
        const encoding = this.computeEncoding(input);
        if (encoding != Encoding.LOWER_SPECIAL) {
            throw new Error("LOWER_SPECIAL is not supported");
        }
        return this.encodeWithEncoding(input, encoding);
    }
    encodeWithEncoding(input, encoding) {
        if (input.length > 32767) {
            throw new Error("long meta string than 32767 is not allowed");
        }
        if (input.length === 0) {
            return new MetaString(input, encoding, this.specialChar1, this.specialChar2, null);
        }
        let encodedBytes;
        switch (encoding) {
            case Encoding.LOWER_SPECIAL:
                encodedBytes = this.encodeLowerSpecial(input);
                break;
            default:
                throw new Error("LOWER_UPPER_DIGIT_SPECIAL is not supported");
                encodedBytes = Buffer.from(input, "utf8");
        }
        return new MetaString(input, encoding, this.specialChar1, this.specialChar2, encodedBytes);
    }
    encodeLowerSpecial(input) {
        return this.encodeGeneric(Buffer.from(input), 5);
    }
    encodeLowerUpperDigitSpecial(input) {
        return this.encodeGeneric(Buffer.from(input), 6);
    }
    encodeFirstToLowerSpecial(input) {
        const chars = Buffer.from(input);
        chars[0] = chars[0] - "A".charCodeAt(0) + "a".charCodeAt(0);
        return this.encodeGeneric(chars, 5);
    }
    encodeAllToLowerSpecial(input) {
        const chars = Buffer.alloc(input.length + countUppers(input));
        let idx = 0;
        for (let i = 0; i < input.length; i++) {
            const code = input.charCodeAt(i);
            if (code >= "A".charCodeAt(0) && code <= "Z".charCodeAt(0)) {
                chars[idx] = "1".charCodeAt(0);
                chars[idx + 1] = code - "A".charCodeAt(0) + "a".charCodeAt(0);
                idx += 2;
            }
            else {
                chars[idx] = code;
                idx += 1;
            }
        }
        return this.encodeGeneric(chars, 5);
    }
    encodeGeneric(chars, bitsPerChar) {
        const totBits = chars.length * bitsPerChar + 1;
        const result = Buffer.alloc(Math.floor((totBits + 7) / 8));
        let currentBit = 1;
        for (let i = 0; i < chars.length; i++) {
            const c = chars[i];
            let value;
            if (bitsPerChar === 5) {
                value = this.charToValueLowerSpecial(c);
            }
            else if (bitsPerChar === 6) {
                value = this.charToValueLowerUpperDigitSpecial(c);
            }
            else {
                throw new Error(`Invalid bitsPerChar: ${bitsPerChar}`);
            }
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
    computeEncoding(input) {
        const statistics = this.computeStringStatistics(input);
        if (statistics.canLowerSpecialEncoded) {
            return Encoding.LOWER_SPECIAL;
        }
        if (statistics.canLowerUpperDigitSpecialEncoded) {
            if (statistics.digitCount !== 0) {
                return Encoding.LOWER_UPPER_DIGIT_SPECIAL;
            }
            const upperCount = statistics.upperCount;
            if (upperCount === 1 &&
                input.charCodeAt(0) >= "A".charCodeAt(0) &&
                input.charCodeAt(0) <= "Z".charCodeAt(0)) {
                return Encoding.FIRST_TO_LOWER_SPECIAL;
            }
            if ((input.length + upperCount) * 5 < input.length * 6) {
                return Encoding.ALL_TO_LOWER_SPECIAL;
            }
            return Encoding.LOWER_UPPER_DIGIT_SPECIAL;
        }
        return Encoding.UTF_8;
    }
    computeStringStatistics(input) {
        let digitCount = 0, upperCount = 0;
        let canLowerSpecialEncoded = true;
        let canLowerUpperDigitSpecialEncoded = true;
        for (let i = 0; i < input.length; i++) {
            const c = input.charCodeAt(i);
            if (canLowerUpperDigitSpecialEncoded) {
                if (!((c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) ||
                    (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) ||
                    (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) ||
                    c === this.specialChar1 ||
                    c === this.specialChar2)) {
                    canLowerUpperDigitSpecialEncoded = false;
                }
            }
            if (canLowerSpecialEncoded) {
                if (!((c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) ||
                    c === "0".charCodeAt(0) ||
                    c === "_".charCodeAt(0) ||
                    c === "3".charCodeAt(0) ||
                    c === "1".charCodeAt(0))) {
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
    charToValueLowerSpecial(c) {
        if (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
            return c - "a".charCodeAt(0);
        }
        else if (c === "0".charCodeAt(0)) {
            return 26;
        }
        else if (c === "_".charCodeAt(0)) {
            return 27;
        }
        else if (c === "3".charCodeAt(0)) {
            return 28;
        }
        else if (c === "1".charCodeAt(0)) {
            return 29;
        }
        else {
            throw new Error(`Unsupported character for LOWER_SPECIAL encoding: ${String.fromCharCode(c)}`);
        }
    }
    charToValueLowerUpperDigitSpecial(c) {
        if (c >= "a".charCodeAt(0) && c <= "z".charCodeAt(0)) {
            return c - "a".charCodeAt(0);
        }
        else if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
            return 26 + (c - "A".charCodeAt(0));
        }
        else if (c >= "0".charCodeAt(0) && c <= "9".charCodeAt(0)) {
            return 52 + (c - "0".charCodeAt(0));
        }
        else if (c === this.specialChar1) {
            return 62;
        }
        else if (c === this.specialChar2) {
            return 63;
        }
        else {
            throw new Error(`Unsupported character for LOWER_UPPER_DIGIT_SPECIAL encoding: ${String.fromCharCode(c)}`);
        }
    }
}
exports.Encoder = Encoder;
function countUppers(str) {
    let cnt = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c >= "A".charCodeAt(0) && c <= "Z".charCodeAt(0)) {
            cnt++;
        }
    }
    return cnt;
}
//# sourceMappingURL=metaString.js.map