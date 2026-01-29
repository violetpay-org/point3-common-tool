export type ConnectingInfo = string & {
    readonly __brand: 'ConnectingInfo';
    length: 88;
}

export namespace ConnectingInfo {
    export function isConnectingInfo(raw: string): raw is ConnectingInfo {
        return isBase64(raw) && raw.length === 88 && raw.endsWith("==");
    }

    export function from(raw: string | Buffer): ConnectingInfo {
        if (typeof raw === "string") {
            if (!isConnectingInfo(raw)) {
                throw new Error("올바르지 않은 CI 입니다.");
            }
            return raw as ConnectingInfo;
        }

        if (raw.length === 64) {
            return raw.toString("base64") as ConnectingInfo;
        }

        throw new Error("올바르지 않은 CI 입니다.");
    }
}

function isBase64(str: string): boolean {
    try {
        if (str.length % 4 !== 0) return false;
        if (!/^[A-Za-z0-9+/=]+$/.test(str)) return false;

        const buf = Buffer.from(str, "base64");
        const re = buf.toString("base64");

        return re.replace(/=+$/, "") === str.replace(/=+$/, "");
    } catch {
        return false;
    }
}