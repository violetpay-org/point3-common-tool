export type ConnectingInfo = string & {
    readonly __brand: 'ConnectingInfo';
    length: 88;
};
export declare namespace ConnectingInfo {
    function isConnectingInfo(raw: string): raw is ConnectingInfo;
    function from(raw: string | Buffer): ConnectingInfo;
}
