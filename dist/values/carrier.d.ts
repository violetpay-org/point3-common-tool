export declare enum CarrierId {
    SKT = "SKT",
    KT = "KT",
    LGU = "LGU",
    SKTMVNO = "SKTMVNO",
    KTMVNO = "KTMVNO",
    LGUMVNO = "LGUMVNO"
}
export declare namespace CarrierId {
    function fromString(value: string): CarrierId;
    function tryFromString(value: string): CarrierId | undefined;
}
