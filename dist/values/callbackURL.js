"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCallBackURL = createCallBackURL;
exports.isCallBackURL = isCallBackURL;
function createCallBackURL(url, query) {
    if (!isCallBackURL(url))
        throw new Error("Invalid URL");
    const searchParams = new URLSearchParams();
    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined)
                searchParams.append(key, value.toString());
        });
    }
    const result = `${url}?${searchParams.toString()}`;
    if (searchParams.toString() != '')
        return result;
    return url;
}
function isCallBackURL(url) {
    if (typeof url !== 'string')
        return false;
    const urlPattern = /^(https:\/\/|http:\/\/)/;
    return urlPattern.test(url);
}
//# sourceMappingURL=callbackURL.js.map