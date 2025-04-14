import { PhoneNumber } from '../phoneNumber';

describe('전화번호 클래스 테스트', () => {
  describe('전화번호 생성', () => {
    it('휴대폰 번호 인스턴스를 생성해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('01012345678');
      expect(phoneNumber.toString()).toBe('01012345678');
      expect(phoneNumber.Type()).toBe(PhoneNumber.Mobile);
    });

    it('서울 지역번호를 가진 유선전화 인스턴스를 생성해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('0212345678'); // 02-1234-5678 형식
      expect(phoneNumber.toString()).toBe('0212345678');
      expect(phoneNumber.Type()).toBe(PhoneNumber.Landline);
    });

    it('다른 지역번호를 가진 유선전화 인스턴스를 생성해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('0311234567'); // 031-123-4567 형식
      expect(phoneNumber.toString()).toBe('0311234567');
      expect(phoneNumber.Type()).toBe(PhoneNumber.Landline);
    });

    it('잘못된 전화번호 형식에 대해 에러를 발생시켜야 합니다', () => {
      expect(() => PhoneNumber.create('1234567890')).toThrow('올바르지 않은 형식의 전화번호입니다');
      expect(() => PhoneNumber.create('010123456')).toThrow('올바르지 않은 형식의 전화번호입니다');
      expect(() => PhoneNumber.create('abc1234567')).toThrow('올바르지 않은 형식의 전화번호입니다');
    });
  });

  describe('전화번호 타입 확인', () => {
    it('휴대폰 번호의 타입을 올바르게 반환해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('01012345678');
      expect(phoneNumber.Type()).toBe(PhoneNumber.Mobile);
    });

    it('유선전화 번호의 타입을 올바르게 반환해야 합니다', () => {
      const seoulPhone = PhoneNumber.create('0212345678');
      expect(seoulPhone.Type()).toBe(PhoneNumber.Landline);

      const otherRegionPhone = PhoneNumber.create('0311234567');
      expect(otherRegionPhone.Type()).toBe(PhoneNumber.Landline);
    });
  });

  describe('전화번호 마스킹', () => {
    it('휴대폰 번호를 올바르게 마스킹해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('01012345678');
      expect(phoneNumber.toMaskedString()).toBe('010****5678');
    });

    it('서울 유선전화 번호를 올바르게 마스킹해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('0212345678');
      expect(phoneNumber.toMaskedString()).toBe('02****5678');
    });

    it('다른 지역 유선전화 번호를 올바르게 마스킹해야 합니다', () => {
      const phoneNumber = PhoneNumber.create('0311234567');
      expect(phoneNumber.toMaskedString()).toBe('031****567');
    });
  });

  describe('전화번호 비교', () => {
    it('같은 전화번호를 비교했을 때 true를 반환해야 합니다', () => {
      const phone1 = PhoneNumber.create('01012345678');
      const phone2 = PhoneNumber.create('01012345678');
      expect(phone1.equal(phone2)).toBe(true);
    });

    it('다른 전화번호를 비교했을 때 false를 반환해야 합니다', () => {
      const phone1 = PhoneNumber.create('01012345678');
      const phone2 = PhoneNumber.create('01012345679');
      expect(phone1.equal(phone2)).toBe(false);
    });

    it('같은 번호이지만 타입이 다른 경우 false를 반환해야 합니다', () => {
      const mobile = PhoneNumber.create('01012345678');
      const landline = PhoneNumber.create('0212345678');
      expect(mobile.equal(landline)).toBe(false);
    });
  });

  describe('정적 속성', () => {
    it('Mobile 타입 값이 올바르게 설정되어 있어야 합니다', () => {
      expect(PhoneNumber.Mobile).toBe('mobile');
    });

    it('Landline 타입 값이 올바르게 설정되어 있어야 합니다', () => {
      expect(PhoneNumber.Landline).toBe('landline');
    });
  });

  describe('휴대폰 번호 유효성 검사', () => {
    const validMobileNumbers = [
      '01012345678',
      '01098765432',
      '01011112222',
    ];

    const invalidMobileNumbers = [
      '0101234567',    // 짧은 번호
      '010123456789',  // 긴 번호
      '02012345678',   // 잘못된 접두사
      '01112345678',   // 올드 포맷 (011)
      '01612345678',   // 올드 포맷 (016)
      '01912345678',   // 올드 포맷 (019)
      '0101234567a',   // 숫자가 아닌 문자 포함
      '010-1234-5678', // 하이픈 포함
      '',              // 빈 문자열
      ' ',             // 공백
      '0000000000',    // 모두 0
    ];

    test.each(validMobileNumbers)('유효한 휴대폰 번호를 허용해야 합니다: %s', (number) => {
      const phoneNumber = PhoneNumber.create(number);
      expect(phoneNumber.Type()).toBe(PhoneNumber.Mobile);
    });

    test.each(invalidMobileNumbers)('유효하지 않은 휴대폰 번호를 거부해야 합니다: %s', (number) => {
      expect(() => PhoneNumber.create(number)).toThrow('올바르지 않은 형식의 전화번호입니다');
    });
  });

  describe('유선전화 번호 유효성 검사', () => {
    const validLandlineNumbers = [
      // 서울 (02)
      '0212345678',     // 기본 형식
      '02-1234-5678',   // 하이픈 포함
      // 경기 (031)
      '0311234567',     // 기본 형식
      '031-123-4567',   // 하이픈 포함
      // 인천 (032)
      '0321234567',
      '032-123-4567',
      // 강원 (033)
      '0331234567',
      '033-123-4567',
      // 충남 (041)
      '0411234567',
      '041-123-4567',
      // 충북 (043)
      '0431234567',
      '043-123-4567',
      // 부산 (051)
      '0511234567',
      '051-123-4567',
      // 울산 (052)
      '0521234567',
      '052-123-4567',
      // 대구 (053)
      '0531234567',
      '053-123-4567',
      // 경북 (054)
      '0541234567',
      '054-123-4567',
      // 경남 (055)
      '0551234567',
      '055-123-4567',
      // 전남 (061)
      '0611234567',
      '061-123-4567',
      // 광주 (062)
      '0621234567',
      '062-123-4567',
      // 전북 (063)
      '0631234567',
      '063-123-4567',
      // 제주 (064)
      '0641234567',
      '064-123-4567',
    ];

    const invalidLandlineNumbers = [
      // 잘못된 지역번호
      '0012345678',    // 존재하지 않는 지역번호
      '0712345678',    // 존재하지 않는 지역번호
      '0812345678',    // 존재하지 않는 지역번호
      '0912345678',    // 존재하지 않는 지역번호
      // 잘못된 길이
      '02123456789',   // 서울 번호 너무 김
      '021234567',     // 서울 번호 너무 짧음
      '031123456',     // 지방 번호 너무 짧음
      '03112345678',   // 지방 번호 너무 김
      // 잘못된 형식
      '02-123-4567',   // 서울 번호 잘못된 하이픈 위치
      '031-1234-567',  // 지방 번호 잘못된 하이픈 위치
      '02--1234-5678', // 중복 하이픈
      '031---123-4567', // 중복 하이픈
      // 잘못된 문자
      '02a1234567',    // 문자 포함
      '031abc4567',    // 문자 포함
      // 빈 값
      '',              // 빈 문자열
      ' ',             // 공백
      '02-',           // 불완전한 번호
      '031-',          // 불완전한 번호
    ];

    test.each(validLandlineNumbers)('유효한 유선전화 번호를 허용해야 합니다: %s', (number) => {
      const phoneNumber = PhoneNumber.create(number);
      expect(phoneNumber.Type()).toBe(PhoneNumber.Landline);
    });

    test.each(invalidLandlineNumbers)('유효하지 않은 유선전화 번호를 거부해야 합니다: %s', (number) => {
      expect(() => PhoneNumber.create(number)).toThrow('올바르지 않은 형식의 전화번호입니다');
    });
  });

  describe('전화번호 마스킹', () => {
    const maskingTestCases = [
      // 휴대폰
      { input: '01012345678', expected: '010****5678' },
      { input: '01098765432', expected: '010****5432' },
      // 서울
      { input: '0212345678', expected: '02****5678' },
      { input: '02-1234-5678', expected: '02****5678' },
      // 지방
      { input: '0311234567', expected: '031****567' },
      { input: '031-123-4567', expected: '031****567' },
      { input: '0511234567', expected: '051****567' },
      { input: '051-123-4567', expected: '051****567' },
    ];

    test.each(maskingTestCases)('전화번호를 올바르게 마스킹해야 합니다: $input -> $expected', ({ input, expected }) => {
      const phoneNumber = PhoneNumber.create(input);
      expect(phoneNumber.toMaskedString()).toBe(expected);
    });
  });

  describe('전화번호 비교', () => {
    const equalityTestCases = [
      // 같은 번호, 다른 형식
      { a: '0212345678', b: '02-1234-5678', expected: true },
      { a: '0311234567', b: '031-123-4567', expected: true },
      // 다른 번호
      { a: '0212345678', b: '0212345679', expected: false },
      { a: '0311234567', b: '0311234568', expected: false },
      // 다른 타입
      { a: '01012345678', b: '0212345678', expected: false },
      { a: '01012345678', b: '0311234567', expected: false },
    ];

    test.each(equalityTestCases)('전화번호 비교가 올바르게 동작해야 합니다', ({ a, b, expected }) => {
      const phoneNumber1 = PhoneNumber.create(a);
      const phoneNumber2 = PhoneNumber.create(b);
      expect(phoneNumber1.equal(phoneNumber2)).toBe(expected);
    });
  });
}); 