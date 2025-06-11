export type HttpResponse<T = any> = {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
};
export type ErrorResponse = {
    code: string;
    message: string;
    details?: Record<string, any>;
    log_level?: "error" | "log" | "warn";
};
export declare class HttpError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: Record<string, any>;
    constructor(status: number, code: string, message: string, details?: Record<string, any>);
}
export declare class NetworkError extends HttpError {
    constructor(message: string);
}
export declare class TimeoutError extends HttpError {
    constructor(message: string);
}
export declare class BadRequestError extends HttpError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends HttpError {
    constructor(message?: string);
}
export declare class ForbiddenError extends HttpError {
    constructor(message?: string);
}
export declare class NotFoundError extends HttpError {
    constructor(message?: string);
}
export declare class ValidationError extends HttpError {
    constructor(message: string, code?: string, details?: Record<string, any>);
}
