"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checksum_1 = require("../checksum");
describe('잠시 테스트', () => {
    it('test', async () => {
        const cks = checksum_1.Checksum.from("983683a738f7ecc7aec9b0049f3bccfe");
        console.log(cks.toBigInt());
    });
});
describe.skip('체크섬 (Checksum)', () => {
    describe('from 메서드', () => {
        it('유효한 32자리 16진수 문자열로 Checksum을 생성해야 한다', () => {
            const validHexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum = checksum_1.Checksum.from(validHexString);
            expect(checksum.toString()).toBe(validHexString);
            expect(checksum.toBigInt()).toBe(BigInt("0x" + validHexString));
        });
        it('유효한 bigint로 Checksum을 생성해야 한다', () => {
            const validBigInt = BigInt("0xe4d909c290d0fb1ca068ffaddf22cbd0");
            const checksum = checksum_1.Checksum.from(validBigInt);
            expect(checksum.toBigInt()).toBe(validBigInt);
            expect(checksum.toString()).toBe("e4d909c290d0fb1ca068ffaddf22cbd0");
        });
        it('결정적 동작을 보장해야 한다', () => {
            const validHexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum1 = checksum_1.Checksum.from(validHexString);
            const checksum2 = checksum_1.Checksum.from(validHexString);
            expect(checksum1.toString()).toBe(checksum2.toString());
            expect(checksum1.toBigInt()).toBe(checksum2.toBigInt());
            expect(checksum1.equals(checksum2)).toBe(true);
        });
        it('32자리가 아닌 16진수 문자열에 대해 예외를 발생시켜야 한다', () => {
            const invalidHexString = "e4d909c290d0fb1ca068ffaddf22cbd";
            expect(() => {
                checksum_1.Checksum.from(invalidHexString);
            }).toThrow("MD5 해시는 반드시 32자리 16진수(0-9, a-f) 문자열이어야 합니다.");
        });
        it('유효하지 않은 문자가 포함된 문자열에 대해 예외를 발생시켜야 한다', () => {
            const invalidHexString = "e4d909c290d0fb1ca068ffaddf22cbdg";
            expect(() => {
                checksum_1.Checksum.from(invalidHexString);
            }).toThrow("MD5 해시는 반드시 32자리 16진수(0-9, a-f) 문자열이어야 합니다.");
        });
        it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
            expect(() => {
                checksum_1.Checksum.from("");
            }).toThrow("MD5 해시는 반드시 32자리 16진수(0-9, a-f) 문자열이어야 합니다.");
        });
        it('null 값에 대해 예외를 발생시켜야 한다', () => {
            expect(() => {
                checksum_1.Checksum.from(null);
            }).toThrow("Cannot read properties of null");
        });
        it('undefined 값에 대해 예외를 발생시켜야 한다', () => {
            expect(() => {
                checksum_1.Checksum.from(undefined);
            }).toThrow("Cannot read properties of undefined");
        });
        it('대문자 16진수 문자열을 올바르게 처리해야 한다', () => {
            const upperCaseHexString = "E4D909C290D0FB1CA068FFADDF22CBD0";
            const checksum = checksum_1.Checksum.from(upperCaseHexString);
            expect(checksum.toString()).toBe(upperCaseHexString);
            expect(checksum.toBigInt()).toBe(BigInt("0x" + upperCaseHexString));
        });
    });
    describe('parse 메서드', () => {
        it('문자열 배열로부터 Checksum을 생성해야 한다', () => {
            const strings = ["a", "b", "c"];
            const checksum = checksum_1.Checksum.parse(...strings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('순서에 관계없이 동일한 체크섬을 생성해야 한다', () => {
            const strings1 = ["a", "b", "c"];
            const strings2 = ["c", "b", "a"];
            const checksum1 = checksum_1.Checksum.parse(...strings1);
            const checksum2 = checksum_1.Checksum.parse(...strings2);
            expect(checksum1.toString()).toBe(checksum2.toString());
            expect(checksum1.toBigInt()).toBe(checksum2.toBigInt());
            expect(checksum1.equals(checksum2)).toBe(true);
        });
        it('결정적 동작을 보장해야 한다', () => {
            const strings = ["test", "data", "123"];
            const checksum1 = checksum_1.Checksum.parse(...strings);
            const checksum2 = checksum_1.Checksum.parse(...strings);
            expect(checksum1.toString()).toBe(checksum2.toString());
            expect(checksum1.toBigInt()).toBe(checksum2.toBigInt());
            expect(checksum1.equals(checksum2)).toBe(true);
        });
        it('빈 배열로부터 Checksum을 생성해야 한다', () => {
            const checksum = checksum_1.Checksum.parse();
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('단일 문자열로부터 Checksum을 생성해야 한다', () => {
            const singleString = ["test"];
            const checksum = checksum_1.Checksum.parse(...singleString);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('긴 문자열로부터 Checksum을 생성해야 한다', () => {
            const longStrings = ["very", "long", "string", "with", "many", "characters"];
            const checksum = checksum_1.Checksum.parse(...longStrings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('특수문자가 포함된 문자열로부터 Checksum을 생성해야 한다', () => {
            const specialStrings = ["test@123", "data#456", "value$789"];
            const checksum = checksum_1.Checksum.parse(...specialStrings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('숫자 문자열로부터 Checksum을 생성해야 한다', () => {
            const numberStrings = ["123", "456", "789"];
            const checksum = checksum_1.Checksum.parse(...numberStrings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
    });
    describe('toString 메서드', () => {
        it('32자리 16진수 문자열을 반환해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum = checksum_1.Checksum.from(hexString);
            const result = checksum.toString();
            expect(result).toBe(hexString);
            expect(result.length).toBe(32);
            expect(result).toMatch(/^[0-9a-f]{32}$/);
        });
        it('결정적 동작을 보장해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum = checksum_1.Checksum.from(hexString);
            const result1 = checksum.toString();
            const result2 = checksum.toString();
            expect(result1).toBe(result2);
        });
    });
    describe('toBigInt 메서드', () => {
        it('올바른 bigint 값을 반환해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const expectedBigInt = BigInt("0x" + hexString);
            const checksum = checksum_1.Checksum.from(hexString);
            const result = checksum.toBigInt();
            expect(result).toBe(expectedBigInt);
            expect(typeof result).toBe("bigint");
        });
        it('결정적 동작을 보장해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum = checksum_1.Checksum.from(hexString);
            const result1 = checksum.toBigInt();
            const result2 = checksum.toBigInt();
            expect(result1).toBe(result2);
        });
    });
    describe('equals 메서드', () => {
        it('동일한 체크섬에 대해 true를 반환해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum1 = checksum_1.Checksum.from(hexString);
            const checksum2 = checksum_1.Checksum.from(hexString);
            const result = checksum1.equals(checksum2);
            expect(result).toBe(true);
        });
        it('다른 체크섬에 대해 false를 반환해야 한다', () => {
            const hexString1 = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const hexString2 = "f5e020d3a1e0fc2db1790fbee33dce1f";
            const checksum1 = checksum_1.Checksum.from(hexString1);
            const checksum2 = checksum_1.Checksum.from(hexString2);
            const result = checksum1.equals(checksum2);
            expect(result).toBe(false);
        });
        it('자기 자신과 비교 시 true를 반환해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum = checksum_1.Checksum.from(hexString);
            const result = checksum.equals(checksum);
            expect(result).toBe(true);
        });
        it('결정적 동작을 보장해야 한다', () => {
            const hexString = "e4d909c290d0fb1ca068ffaddf22cbd0";
            const checksum1 = checksum_1.Checksum.from(hexString);
            const checksum2 = checksum_1.Checksum.from(hexString);
            const result1 = checksum1.equals(checksum2);
            const result2 = checksum1.equals(checksum2);
            expect(result1).toBe(result2);
        });
    });
    describe('경계값 테스트', () => {
        it('0으로 시작하는 16진수 문자열을 올바르게 처리해야 한다', () => {
            const zeroStartHex = "00000000000000000000000000000000";
            const checksum = checksum_1.Checksum.from(zeroStartHex);
            expect(checksum.toString()).toBe(zeroStartHex);
            expect(checksum.toBigInt()).toBe(0n);
        });
        it('f로만 구성된 16진수 문자열을 올바르게 처리해야 한다', () => {
            const allFHex = "ffffffffffffffffffffffffffffffff";
            const checksum = checksum_1.Checksum.from(allFHex);
            expect(checksum.toString()).toBe(allFHex);
            expect(checksum.toBigInt()).toBe(BigInt("0x" + allFHex));
        });
        it('매우 긴 문자열 배열로부터 체크섬을 생성해야 한다', () => {
            const longStrings = Array.from({ length: 1000 }, (_, i) => `string${i}`);
            const checksum = checksum_1.Checksum.parse(...longStrings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('빈 문자열로부터 체크섬을 생성해야 한다', () => {
            const emptyStrings = ["", "", ""];
            const checksum = checksum_1.Checksum.parse(...emptyStrings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
        it('중복된 문자열로부터 체크섬을 생성해야 한다', () => {
            const duplicateStrings = ["test", "test", "test"];
            const checksum = checksum_1.Checksum.parse(...duplicateStrings);
            expect(checksum.toString()).toMatch(/^[0-9a-f]{32}$/);
            expect(checksum.toBigInt()).toBeGreaterThan(0n);
        });
    });
    describe('통합 테스트', () => {
        it('from과 parse 메서드 간의 호환성을 보장해야 한다', () => {
            const strings = ["test", "data", "123"];
            const parsedChecksum = checksum_1.Checksum.parse(...strings);
            const fromChecksum = checksum_1.Checksum.from(parsedChecksum.toString());
            expect(parsedChecksum.toString()).toBe(fromChecksum.toString());
            expect(parsedChecksum.toBigInt()).toBe(fromChecksum.toBigInt());
            expect(parsedChecksum.equals(fromChecksum)).toBe(true);
        });
        it('bigint와 문자열 간의 변환이 일관성을 보장해야 한다', () => {
            const originalBigInt = BigInt("0xe4d909c290d0fb1ca068ffaddf22cbd0");
            const checksumFromBigInt = checksum_1.Checksum.from(originalBigInt);
            const checksumFromString = checksum_1.Checksum.from(checksumFromBigInt.toString());
            expect(checksumFromBigInt.toBigInt()).toBe(originalBigInt);
            expect(checksumFromString.toBigInt()).toBe(originalBigInt);
            expect(checksumFromBigInt.equals(checksumFromString)).toBe(true);
        });
        it('다양한 입력에 대해 고유한 체크섬을 생성해야 한다', () => {
            const inputs = [
                ["a", "b", "c"],
                ["x", "y", "z"],
                ["1", "2", "3"],
                ["test", "data"],
                ["long", "string", "with", "many", "words"]
            ];
            const checksums = inputs.map(input => checksum_1.Checksum.parse(...input));
            for (let i = 0; i < checksums.length; i++) {
                for (let j = i + 1; j < checksums.length; j++) {
                    expect(checksums[i].toString()).not.toBe(checksums[j].toString());
                    expect(checksums[i].toBigInt()).not.toBe(checksums[j].toBigInt());
                    expect(checksums[i].equals(checksums[j])).toBe(false);
                }
            }
        });
    });
});
//# sourceMappingURL=checksum.spec.js.map