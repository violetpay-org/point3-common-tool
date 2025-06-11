"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.TimeoutError = exports.NetworkError = exports.HttpError = void 0;
class HttpError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.name = 'LogtoHttpError';
    }
}
exports.HttpError = HttpError;
class NetworkError extends HttpError {
    constructor(message) {
        super(500, 'network_error', message);
        this.name = this.constructor.name;
    }
}
exports.NetworkError = NetworkError;
class TimeoutError extends HttpError {
    constructor(message) {
        super(500, 'timeout_error', message);
        this.name = this.constructor.name;
    }
}
exports.TimeoutError = TimeoutError;
class BadRequestError extends HttpError {
    constructor(message = 'Bad request') {
        super(400, 'bad_request', message);
        this.name = this.constructor.name;
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized access') {
        super(401, 'unauthorized', message);
        this.name = this.constructor.name;
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends HttpError {
    constructor(message = 'Access forbidden') {
        super(403, 'forbidden', message);
        this.name = this.constructor.name;
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends HttpError {
    constructor(message = 'Resource not found') {
        super(404, 'not_found', message);
        this.name = this.constructor.name;
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends HttpError {
    constructor(message, code, details) {
        super(422, code ?? 'validation_error', message, details);
        this.name = this.constructor.name;
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=types.js.map