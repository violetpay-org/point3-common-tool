import { Birthdate } from '../birthdate';

describe('Birthdate', () => {
    describe('parse - YYYYMMDD 포맷', () => {
        it('유효한 YYYYMMDD 형식 파싱', () => {
            // Arrange & Act
            const bd = Birthdate.parse('19900115', Birthdate.Format.YYYYMMDD);

            // Assert
            expect(bd).toBeDefined();
        });

        it('잘못된 길이는 예외 발생', () => {
            expect(() => Birthdate.parse('199001', Birthdate.Format.YYYYMMDD)).toThrow();
        });

        it('숫자가 아닌 문자 포함 시 예외 발생', () => {
            expect(() => Birthdate.parse('1990011A', Birthdate.Format.YYYYMMDD)).toThrow();
        });
    });

    describe('parse - YYYY-MM-DD 포맷', () => {
        it('유효한 YYYY-MM-DD 형식 파싱', () => {
            // Arrange & Act
            const bd = Birthdate.parse('1990-01-15', Birthdate.Format.YYYY_MM_DD);

            // Assert
            expect(bd).toBeDefined();
        });

        it('구분자 없는 경우 예외 발생', () => {
            expect(() => Birthdate.parse('19900115', Birthdate.Format.YYYY_MM_DD)).toThrow();
        });

        it('잘못된 구분자는 예외 발생', () => {
            expect(() => Birthdate.parse('1990/01/15', Birthdate.Format.YYYY_MM_DD)).toThrow();
        });
    });

    describe('parse - YYMMDD 포맷', () => {
        it('유효한 YYMMDD 형식 파싱 (90년대 → 1990년대)', () => {
            // Arrange & Act
            const bd = Birthdate.parse('900115', Birthdate.Format.YYMMDD);

            // Assert
            expect(bd).toBeDefined();
        });

        it('00년대는 2000년대로 해석', () => {
            // Arrange & Act
            const bd = Birthdate.parse('050315', Birthdate.Format.YYMMDD);
            const formatted = Birthdate.toString(bd, Birthdate.Format.YYYYMMDD);

            // Assert
            expect(formatted).toBe('20050315');
        });

        it('잘못된 길이는 예외 발생', () => {
            expect(() => Birthdate.parse('9001', Birthdate.Format.YYMMDD)).toThrow();
        });
    });

    describe('toString - 포맷 변환', () => {
        it('YYYYMMDD → YYYY-MM-DD', () => {
            // Arrange
            const bd = Birthdate.parse('19900115', Birthdate.Format.YYYYMMDD);

            // Act
            const result = Birthdate.toString(bd, Birthdate.Format.YYYY_MM_DD);

            // Assert
            expect(result).toBe('1990-01-15');
        });

        it('YYYY-MM-DD → YYYYMMDD', () => {
            // Arrange
            const bd = Birthdate.parse('1990-01-15', Birthdate.Format.YYYY_MM_DD);

            // Act
            const result = Birthdate.toString(bd, Birthdate.Format.YYYYMMDD);

            // Assert
            expect(result).toBe('19900115');
        });

        it('YYMMDD → YYYYMMDD (1900년대)', () => {
            // Arrange
            const bd = Birthdate.parse('900115', Birthdate.Format.YYMMDD);

            // Act
            const result = Birthdate.toString(bd, Birthdate.Format.YYYYMMDD);

            // Assert
            expect(result).toBe('19900115');
        });

        it('YYMMDD → YYYY-MM-DD (2000년대)', () => {
            // Arrange
            const bd = Birthdate.parse('050315', Birthdate.Format.YYMMDD);

            // Act
            const result = Birthdate.toString(bd, Birthdate.Format.YYYY_MM_DD);

            // Assert
            expect(result).toBe('2005-03-15');
        });
    });

    describe('Roundtrip 테스트', () => {
        it('YYYYMMDD 포맷 왕복', () => {
            // Arrange
            const original = '19900115';

            // Act
            const bd = Birthdate.parse(original, Birthdate.Format.YYYYMMDD);
            const result = Birthdate.toString(bd, Birthdate.Format.YYYYMMDD);

            // Assert
            expect(result).toBe(original);
        });

        it('YYYY-MM-DD 포맷 왕복', () => {
            // Arrange
            const original = '1990-01-15';

            // Act
            const bd = Birthdate.parse(original, Birthdate.Format.YYYY_MM_DD);
            const result = Birthdate.toString(bd, Birthdate.Format.YYYY_MM_DD);

            // Assert
            expect(result).toBe(original);
        });

        it('YYMMDD 포맷 왕복', () => {
            // Arrange
            const original = '900115';

            // Act
            const bd = Birthdate.parse(original, Birthdate.Format.YYMMDD);
            const result = Birthdate.toString(bd, Birthdate.Format.YYMMDD);

            // Assert
            expect(result).toBe(original);
        });
    });

    describe('as - 인스턴스 메서드 포맷 변환', () => {
        it('bd.as(format) 호출 시 올바른 포맷 문자열 반환', () => {
            // Arrange
            const bd = Birthdate.parse('19900115', Birthdate.Format.YYYYMMDD);

            // Act & Assert
            expect(bd.as(Birthdate.Format.YYYY_MM_DD)).toBe('1990-01-15');
            expect(bd.as(Birthdate.Format.YYYYMMDD)).toBe('19900115');
            expect(bd.as(Birthdate.Format.YYMMDD)).toBe('900115');
        });
    });

    describe('엣지 케이스', () => {
        it('다른 포맷으로 파싱 후 동일 값 비교', () => {
            // Arrange
            const bd1 = Birthdate.parse('19900115', Birthdate.Format.YYYYMMDD);
            const bd2 = Birthdate.parse('1990-01-15', Birthdate.Format.YYYY_MM_DD);
            const bd3 = Birthdate.parse('900115', Birthdate.Format.YYMMDD);

            // Act
            const str1 = Birthdate.toString(bd1, Birthdate.Format.YYYY_MM_DD);
            const str2 = Birthdate.toString(bd2, Birthdate.Format.YYYY_MM_DD);
            const str3 = Birthdate.toString(bd3, Birthdate.Format.YYYY_MM_DD);

            // Assert
            expect(str1).toBe('1990-01-15');
            expect(str2).toBe('1990-01-15');
            expect(str3).toBe('1990-01-15');
        });
    });
});
