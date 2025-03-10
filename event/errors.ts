export class NoEventFoundError extends Error {
    constructor(messageOrError?: string | Error) {
        const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
        super(message);
        this.name = 'NoEventFoundError';
        Error.captureStackTrace(this, NoEventFoundError);
    }
}

export class RelayerError extends Error {
    constructor(messageOrError?: string | Error) {
        const message = messageOrError instanceof Error ? messageOrError.message : messageOrError;
        super(message);
        this.name = 'RelayerError';
        Error.captureStackTrace(this, RelayerError);
    }
}