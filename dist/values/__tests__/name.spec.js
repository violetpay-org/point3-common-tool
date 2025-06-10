"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const name_1 = require("../name");
describe('Name', () => {
    it('이름 객체가 정상적으로 생성되어야 한다', () => {
        const name = name_1.Name.create('홍길동');
        expect(name.toString()).toBe('홍길동');
    });
    it('동일한 이름은 equals가 true여야 한다', () => {
        const name1 = name_1.Name.create('홍길동');
        const name2 = name_1.Name.create('홍길동');
        expect(name1.equals(name2)).toBe(true);
    });
    it('다른 이름은 equals가 false여야 한다', () => {
        const name1 = name_1.Name.create('홍길동');
        const name2 = name_1.Name.create('김철수');
        expect(name1.equals(name2)).toBe(false);
    });
    it('이름 마스킹이 올바르게 동작해야 한다', () => {
        const name = name_1.Name.create('홍길동');
        expect(name.Masked).toBe('홍*동');
        const name2 = name_1.Name.create('이순신');
        expect(name2.Masked).toBe('이*신');
    });
});
//# sourceMappingURL=name.spec.js.map