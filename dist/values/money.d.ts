export declare class Money {
    private readonly amount;
    constructor(amount: number);
    get Amount(): number;
    add: (money: Money) => Money;
    subtract: (money: Money) => Money;
    equals: (other: Money) => boolean;
}
