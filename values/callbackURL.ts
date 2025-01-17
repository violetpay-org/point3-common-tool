/** @internal */
declare const CallBackURLBrand: unique symbol;

/**
 * A URL string that must start with http:// or https://
 * @internal
 */
export type CallBackURL = string & { [CallBackURLBrand]: true };

/** @internal */
export function createCallBackURL(
    url: string,
    query?: { [key: string]: string | number | boolean | undefined }): CallBackURL 
{
    if (!isCallBackURL(url)) throw new Error("Invalid URL");
    const searchParams = new URLSearchParams();

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined) searchParams.append(key, value.toString());
        });
    }

    const queryString = searchParams.toString().replace(/\+/g, "%20");

    const result = `${url}?${queryString}` as CallBackURL;
    if (queryString != '') return result;
    return url as CallBackURL;
}

/** @internal */
export function isCallBackURL(url: any): url is CallBackURL {
    if (typeof url !== 'string') return false;

    const urlPattern = /^(https:\/\/|http:\/\/)/;
    return urlPattern.test(url);
}