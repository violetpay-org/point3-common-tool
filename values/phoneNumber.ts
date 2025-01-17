/** @internal */
export class PhoneNumber {
    private readonly phoneNumber: string;

    private constructor(phoneNumber: string) {
        this.isValid(phoneNumber);
        this.phoneNumber = phoneNumber;
    }

    public static create(phoneNumber: string) {
        return new PhoneNumber(phoneNumber);
    }

    private isValid(phoneNumber: string): void {
        if (!phoneNumber) {
            return;
        }

        if (phoneNumber.trim() === '') {
            throw new Error('Phone number cannot be an empty string.');
        }

        if (phoneNumber.split('').some(char => char < '0' || char > '9')) {
            throw new Error('Phone number should contain only digits.');
        }

        if (phoneNumber.length !== 11) {
            throw new Error('Phone number must be 11 digits long.');
        }

        if (!phoneNumber.startsWith('010')) {
            throw new Error('Phone number must start with "010".');
        }
    }

    public toString(): string {
        return this.phoneNumber;
    }

    public equal(compare: PhoneNumber): boolean {
        return this.phoneNumber === compare.toString();
    }
}