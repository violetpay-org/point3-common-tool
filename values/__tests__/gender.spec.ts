import { Gender } from '../gender';

describe('Gender', () => {
    describe('parse - 다양한 입력 형식', () => {
        it('ISO 표준 "MALE" 파싱', () => {
            // Arrange & Act
            const gender = Gender.parse('MALE');

            // Assert
            expect(gender).toBeDefined();
        });

        it('ISO 표준 "FEMALE" 파싱', () => {
            // Arrange & Act
            const gender = Gender.parse('FEMALE');

            // Assert
            expect(gender).toBeDefined();
        });

        it('단축형 "M" → "MALE"', () => {
            // Arrange & Act
            const gender = Gender.parse('M');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('MALE');
        });

        it('단축형 "F" → "FEMALE"', () => {
            // Arrange & Act
            const gender = Gender.parse('F');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('FEMALE');
        });

        it('한국어 "남" → "MALE"', () => {
            // Arrange & Act
            const gender = Gender.parse('남');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('MALE');
        });

        it('한국어 "여" → "FEMALE"', () => {
            // Arrange & Act
            const gender = Gender.parse('여');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('FEMALE');
        });

        it('숫자 1 (number) → "MALE"', () => {
            // Arrange & Act
            const gender = Gender.parse(1);
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('MALE');
        });

        it('숫자 2 (number) → "FEMALE"', () => {
            // Arrange & Act
            const gender = Gender.parse(2);
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('FEMALE');
        });

        it('문자열 "1" → "MALE"', () => {
            // Arrange & Act
            const gender = Gender.parse('1');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('MALE');
        });

        it('문자열 "2" → "FEMALE"', () => {
            // Arrange & Act
            const gender = Gender.parse('2');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('FEMALE');
        });

        it('소문자 "male" → "MALE" (대소문자 무시)', () => {
            // Arrange & Act
            const gender = Gender.parse('male');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('MALE');
        });

        it('소문자 "female" → "FEMALE" (대소문자 무시)', () => {
            // Arrange & Act
            const gender = Gender.parse('female');
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe('FEMALE');
        });

        it('유효하지 않은 값은 예외 발생', () => {
            expect(() => Gender.parse('X')).toThrow();
            expect(() => Gender.parse(3)).toThrow();
            expect(() => Gender.parse('UNKNOWN')).toThrow();
        });
    });

    describe('toString - 포맷 변환', () => {
        it('ISO 포맷 (MALE/FEMALE)', () => {
            // Arrange
            const male = Gender.parse('남');
            const female = Gender.parse('여');

            // Act & Assert
            expect(Gender.toString(male, Gender.Format.ISO)).toBe('MALE');
            expect(Gender.toString(female, Gender.Format.ISO)).toBe('FEMALE');
        });

        it('KOREAN 포맷 (남/여)', () => {
            // Arrange
            const male = Gender.parse('MALE');
            const female = Gender.parse('FEMALE');

            // Act & Assert
            expect(Gender.toString(male, Gender.Format.KOREAN)).toBe('남');
            expect(Gender.toString(female, Gender.Format.KOREAN)).toBe('여');
        });

        it('MOBILEOK 포맷 (1/2)', () => {
            // Arrange
            const male = Gender.parse('M');
            const female = Gender.parse('F');

            // Act & Assert
            expect(Gender.toString(male, Gender.Format.MOBILEOK)).toBe('1');
            expect(Gender.toString(female, Gender.Format.MOBILEOK)).toBe('2');
        });

        it('SHORT 포맷 (M/F)', () => {
            // Arrange
            const male = Gender.parse(1);
            const female = Gender.parse(2);

            // Act & Assert
            expect(Gender.toString(male, Gender.Format.SHORT)).toBe('M');
            expect(Gender.toString(female, Gender.Format.SHORT)).toBe('F');
        });
    });

    describe('as - 인스턴스 메서드 포맷 변환', () => {
        it('gender.as(format) 호출 시 올바른 포맷 문자열 반환', () => {
            // Arrange
            const male = Gender.parse('남');
            const female = Gender.parse('여');

            // Act & Assert
            expect(male.as(Gender.Format.ISO)).toBe('MALE');
            expect(male.as(Gender.Format.KOREAN)).toBe('남');
            expect(female.as(Gender.Format.SHORT)).toBe('F');
            expect(female.as(Gender.Format.MOBILEOK)).toBe('2');
        });
    });

    describe('Roundtrip 테스트', () => {
        it('ISO → ISO', () => {
            // Arrange
            const original = 'MALE';

            // Act
            const gender = Gender.parse(original);
            const result = Gender.toString(gender, Gender.Format.ISO);

            // Assert
            expect(result).toBe(original);
        });

        it('KOREAN → KOREAN', () => {
            // Arrange
            const original = '남';

            // Act
            const gender = Gender.parse(original);
            const result = Gender.toString(gender, Gender.Format.KOREAN);

            // Assert
            expect(result).toBe(original);
        });

        it('MOBILEOK → MOBILEOK', () => {
            // Arrange
            const original = '1';

            // Act
            const gender = Gender.parse(original);
            const result = Gender.toString(gender, Gender.Format.MOBILEOK);

            // Assert
            expect(result).toBe(original);
        });
    });

    describe('엣지 케이스', () => {
        it('다양한 입력 → 동일한 정규화 값', () => {
            // Arrange
            const inputs = ['MALE', 'M', 'male', 'm', '남', 1, '1'];

            // Act
            const results = inputs.map(input => {
                const gender = Gender.parse(input);
                return Gender.toString(gender, Gender.Format.ISO);
            });

            // Assert
            results.forEach(result => {
                expect(result).toBe('MALE');
            });
        });

        it('여성 다양한 입력 → 동일한 정규화 값', () => {
            // Arrange
            const inputs = ['FEMALE', 'F', 'female', 'f', '여', 2, '2'];

            // Act
            const results = inputs.map(input => {
                const gender = Gender.parse(input);
                return Gender.toString(gender, Gender.Format.ISO);
            });

            // Assert
            results.forEach(result => {
                expect(result).toBe('FEMALE');
            });
        });
    });
});
