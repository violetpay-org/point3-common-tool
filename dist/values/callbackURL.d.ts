declare const CallBackURLBrand: unique symbol;
export type CallBackURL = string & {
    [CallBackURLBrand]: true;
};
export declare function createCallBackURL(url: string, query?: {
    [key: string]: string | number | boolean | undefined;
}): CallBackURL;
export declare function isCallBackURL(url: any): url is CallBackURL;
export {};
