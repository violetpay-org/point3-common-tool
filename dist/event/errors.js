"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayerError = exports.NoEventFoundError = void 0;
class NoEventFoundError extends Error {
    constructor(messageOrError) {
        const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
        super(message);
        this.name = 'NoEventFoundError';
        Error.captureStackTrace(this, NoEventFoundError);
    }
}
exports.NoEventFoundError = NoEventFoundError;
class RelayerError extends Error {
    constructor(messageOrError) {
        const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
        super(message);
        this.name = 'RelayerError';
        Error.captureStackTrace(this, RelayerError);
    }
}
exports.RelayerError = RelayerError;
//# sourceMappingURL=errors.js.map