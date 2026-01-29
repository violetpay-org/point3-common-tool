"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarrierId = void 0;
var CarrierId;
(function (CarrierId) {
    CarrierId["SKT"] = "SKT";
    CarrierId["KT"] = "KT";
    CarrierId["LGU"] = "LGU";
    CarrierId["SKTMVNO"] = "SKTMVNO";
    CarrierId["KTMVNO"] = "KTMVNO";
    CarrierId["LGUMVNO"] = "LGUMVNO";
})(CarrierId || (exports.CarrierId = CarrierId = {}));
(function (CarrierId) {
    function fromString(value) {
        switch (value) {
            case CarrierId.SKT:
            case CarrierId.KT:
            case CarrierId.LGU:
            case CarrierId.SKTMVNO:
            case CarrierId.KTMVNO:
            case CarrierId.LGUMVNO:
                return value;
            default:
                throw new Error(`Unknown CarrierId: ${value}`);
        }
    }
    CarrierId.fromString = fromString;
    function tryFromString(value) {
        switch (value) {
            case CarrierId.SKT:
            case CarrierId.KT:
            case CarrierId.LGU:
            case CarrierId.SKTMVNO:
            case CarrierId.KTMVNO:
            case CarrierId.LGUMVNO:
                return value;
            default:
                return undefined;
        }
    }
    CarrierId.tryFromString = tryFromString;
})(CarrierId || (exports.CarrierId = CarrierId = {}));
//# sourceMappingURL=carrier.js.map