export class Money {
    private readonly amount: number;

    constructor(amount: number) {
        this.amount = amount;
    }

    public get Amount(): number {
        return this.amount
    };

    public add = (money: Money) => new Money(this.amount + money.Amount);

    public subtract = (money: Money) => new Money(this.amount - money.Amount);

    public equals = (other: Money) => {
        return this.Amount == other.Amount;
    };
}