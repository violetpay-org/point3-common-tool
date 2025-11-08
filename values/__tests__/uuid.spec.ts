import { UUID } from '../uuid';

describe('UUID', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const uuid = UUID.parse(validUuid);
        expect(uuid.toString()).toBe(validUuid);
    });

    it('소문자 UUID가 정상적으로 파싱되어야 한다', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        const uuid = UUID.parse(validUuid);
        expect(uuid.toString()).toBe(validUuid);
    });

    it('대문자 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550E8400-E29B-41D4-A716-446655440000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('혼합 대소문자 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-E29b-41d4-A716-446655440000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('하이픈이 없는 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400e29b41d4a716446655440000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('하이픈이 부족한 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-e29b-41d4-a716446655440000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('하이픈이 너무 많은 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-4466-55440000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('길이가 짧은 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-44665544000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('길이가 긴 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-4466554400000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('유효하지 않은 문자가 포함된 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-44665544000g')).toThrow('올바르지 않은 UUID 형식입니다.');
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-44665544000G')).toThrow('올바르지 않은 UUID 형식입니다.');
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-44665544000!')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('빈 문자열은 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('공백이 포함된 UUID는 예외가 발생해야 한다', () => {
        expect(() => UUID.parse('550e8400-e29b-41d4-a716-44665544000 ')).toThrow('올바르지 않은 UUID 형식입니다.');
        expect(() => UUID.parse(' 550e8400-e29b-41d4-a716-446655440000')).toThrow('올바르지 않은 UUID 형식입니다.');
    });

    it('toString()은 원본 UUID 문자열을 반환해야 한다', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const uuid = UUID.parse(validUuid);
        expect(uuid.toString()).toBe(validUuid);
    });

    it('다양한 유효한 UUID 형식이 정상적으로 파싱되어야 한다', () => {
        const validUuids = [
            '00000000-0000-0000-0000-000000000000',
            'ffffffff-ffff-ffff-ffff-ffffffffffff',
            '01234567-89ab-cdef-0123-456789abcdef',
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        ];

        validUuids.forEach(uuidStr => {
            const uuid = UUID.parse(uuidStr);
            expect(uuid.toString()).toBe(uuidStr);
        });
    });
});

