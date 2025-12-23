"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoNothing = exports.DoNothingAsync = void 0;
exports.SilentlyRunAsync = SilentlyRunAsync;
exports.SilentlyRun = SilentlyRun;
exports.OptionallyRunAsync = OptionallyRunAsync;
exports.OptionallyRun = OptionallyRun;
const DoNothingAsync = async () => { };
exports.DoNothingAsync = DoNothingAsync;
const DoNothing = () => { };
exports.DoNothing = DoNothing;
function SilentlyRunAsync(func, shouldLog = false) {
    return async (...args) => {
        try {
            return await func(...args);
        }
        catch (error) {
            if (shouldLog)
                console.error(error);
        }
    };
}
function SilentlyRun(func, shouldLog = false) {
    return (...args) => {
        try {
            return func(...args);
        }
        catch (error) {
            if (shouldLog)
                console.error(error);
        }
    };
}
function OptionallyRunAsync(func) {
    return (func ?? exports.DoNothingAsync);
}
function OptionallyRun(func) {
    return (func ?? exports.DoNothing);
}
//# sourceMappingURL=index.js.map