"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
class Money {
    constructor(amount) {
        this.add = (money) => new Money(this.amount + money.Amount);
        this.subtract = (money) => new Money(this.amount - money.Amount);
        this.equals = (other) => {
            return this.Amount == other.Amount;
        };
        this.amount = amount;
    }
    get Amount() {
        return this.amount;
    }
    ;
}
exports.Money = Money;
//# sourceMappingURL=money.js.map