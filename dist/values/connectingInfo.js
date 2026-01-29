"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectingInfo = void 0;
var ConnectingInfo;
(function (ConnectingInfo) {
    function isConnectingInfo(raw) {
        return isBase64(raw) && raw.length === 88 && raw.endsWith("==");
    }
    ConnectingInfo.isConnectingInfo = isConnectingInfo;
    function from(raw) {
        if (typeof raw === "string") {
            if (!isConnectingInfo(raw)) {
                throw new Error("올바르지 않은 CI 입니다.");
            }
            return raw;
        }
        if (raw.length === 64) {
            return raw.toString("base64");
        }
        throw new Error("올바르지 않은 CI 입니다.");
    }
    ConnectingInfo.from = from;
})(ConnectingInfo || (exports.ConnectingInfo = ConnectingInfo = {}));
function isBase64(str) {
    try {
        if (str.length % 4 !== 0)
            return false;
        if (!/^[A-Za-z0-9+/=]+$/.test(str))
            return false;
        const buf = Buffer.from(str, "base64");
        const re = buf.toString("base64");
        return re.replace(/=+$/, "") === str.replace(/=+$/, "");
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=connectingInfo.js.map