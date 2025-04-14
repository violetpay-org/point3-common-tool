/** @internal */
export class PhoneNumber {
    private readonly phoneNumber: string;
    private readonly phoneNumberType: "mobile" | "landline";

    private constructor(phoneNumber: string) {
        if (this.isMobile(phoneNumber)) this.phoneNumberType = "mobile";
        else if (this.isLandline(phoneNumber)) this.phoneNumberType = "landline";
        else throw new Error(`올바르지 않은 형식의 전화번호입니다.\n입력값: ${phoneNumber}`);
        
        this.phoneNumber = phoneNumber;
    }

    public static create(phoneNumber: string) {
        return new PhoneNumber(phoneNumber);
    }

    public static get Mobile(): "mobile" {
        return "mobile" as const;
    }

    public static get Landline(): "landline" {
        return "landline" as const;
    }

    private isMobile(phoneNumber: string): boolean {
        if (!phoneNumber) {
            return false;
        }

        if (phoneNumber.trim() === '') {
            return false;
        }

        if (phoneNumber.split('').some(char => char < '0' || char > '9')) {
            return false;
        }

        if (phoneNumber.length !== 11) {
            return false;
        }

        if (!phoneNumber.startsWith('010')) {
            return false;
        }

        return true;
    }

    private isLandline(phoneNumber: string): boolean {
        if (!phoneNumber) {
            return false;
        }

        if (phoneNumber.trim() === '') {
            return false;
        }

        // Remove hyphens for validation
        const normalizedNumber = phoneNumber.replace(/-/g, '');

        // 한국의 유선전화번호 형식
        // 서울(02): 총 8자리 (02-XXXX-XXXX)
        // 기타 지역: 총 10자리 (03X-XXX-XXXX)
        const areaCodePatterns = [
            /^02\d{8}$/, // 서울: 02 + 8자리
            /^0[3-6]\d{8}$/, // 기타 지역: 03X-06X + 8자리
        ];

        // Check if the normalized number matches any of the patterns
        const isValid = areaCodePatterns.some(pattern => pattern.test(normalizedNumber));

        // If valid, also check if the original format with hyphens is correct
        if (isValid) {
            if (phoneNumber.includes('-')) {
                const parts = phoneNumber.split('-');
                if (parts[0] === '02') {
                    // 서울: 02-XXXX-XXXX
                    return parts.length === 3 && parts[1].length === 4 && parts[2].length === 4;
                } else {
                    // 기타 지역: 03X-XXX-XXXX
                    return parts.length === 3 && parts[1].length === 3 && parts[2].length === 4;
                }
            }
            return true; // Allow non-hyphenated format if it matches the patterns
        }
        return false;
    }

    public Type(): "mobile" | "landline" {
        return this.phoneNumberType;
    }

    public toString(): string {
        // Remove any hyphens for consistent string representation
        return this.phoneNumber.replace(/-/g, '');
    }

    public toMaskedString(): string {
        const normalizedNumber = this.toString();
        if (this.phoneNumberType === PhoneNumber.Mobile) {
            // 휴대폰 번호의 경우 (예: 01012345678 -> 010****5678)
            const prefix = normalizedNumber.substring(0, 3);
            const suffix = normalizedNumber.substring(7);
            return `${prefix}****${suffix}`;
        } else {
            // 유선전화번호의 경우
            if (normalizedNumber.startsWith('02')) {
                // 서울: 0212345678 -> 02****5678
                const prefix = normalizedNumber.substring(0, 2);
                const suffix = normalizedNumber.substring(6);
                return `${prefix}****${suffix}`;
            } else {
                // 기타 지역: 0311234567 -> 031****567
                const prefix = normalizedNumber.substring(0, 3);
                const suffix = normalizedNumber.substring(7);
                return `${prefix}****${suffix}`;
            }
        }
    }

    public equal(compare: PhoneNumber): boolean {
        // Compare normalized numbers (without hyphens)
        return this.toString() === compare.toString() && this.phoneNumberType === compare.phoneNumberType;
    }
}