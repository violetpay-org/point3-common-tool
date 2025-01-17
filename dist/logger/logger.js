"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerFactory = void 0;
exports.Log = Log;
const winston = __importStar(require("winston"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const common_1 = require("@nestjs/common");
class WinstonLogger {
    constructor(winstonLogger) {
        this.winstonLogger = winstonLogger;
    }
    log(message, ...optionalParams) {
        if (!this.isLogLevelEnabled("log"))
            return;
        return this.winstonLogger.info(message, ...optionalParams);
    }
    error(message, ...optionalParams) {
        if (!this.isLogLevelEnabled("error"))
            return;
        return this.winstonLogger.error(message, ...optionalParams);
    }
    warn(message, ...optionalParams) {
        if (!this.isLogLevelEnabled("warn"))
            return;
        return this.winstonLogger.warn(message, ...optionalParams);
    }
    debug(message, ...optionalParams) {
        if (!this.isLogLevelEnabled("debug"))
            return;
        return this.winstonLogger.debug(message, ...optionalParams);
    }
    verbose(message, ...optionalParams) {
        if (!this.isLogLevelEnabled("verbose"))
            return;
        return this.winstonLogger.verbose(message, ...optionalParams);
    }
    fatal(message, ...optionalParams) {
        if (!this.isLogLevelEnabled("log"))
            return;
        return this.winstonLogger.alert(message, ...optionalParams);
    }
    setLogLevels(levels) {
        WinstonLogger.logLevels = levels;
    }
    isLogLevelEnabled(level) {
        return (WinstonLogger.logLevels.length == 0 ||
            WinstonLogger.logLevels.includes(level));
    }
}
WinstonLogger.logLevels = [];
const formatTimestamp = winston.format((info, opts) => {
    info.timestamp = (0, moment_timezone_1.default)().tz("Asia/Seoul").format();
    return info;
});
const loggerFactory = (configService) => {
    return new WinstonLogger(winston.createLogger({
        level: "info",
        format: winston.format.combine(formatTimestamp(), winston.format.splat(), winston.format.json(), winston.format.printf((info) => {
            if (info.splat) {
                return `${info.timestamp} - ${info.level}: ${info.message}\n${info.splat}`;
            }
            return `${info.timestamp} - ${info.level}: ${info.message}`;
        })),
        transports: [
            new winston.transports.File({
                filename: `${configService.get("LOG_DIRECTORY")}/ob-session.log`
            }),
            new winston.transports.Console()
        ]
    }));
};
exports.loggerFactory = loggerFactory;
function Log(level = "log") {
    return function (target, propertyKey, propertyDescriptor) {
        let method = propertyDescriptor.value;
        let logger = Object.entries(target)
            .find(([key, _]) => key == "logger")?.[1] ||
            new common_1.ConsoleLogger;
        let log = logger[level];
        propertyDescriptor.value = async function (...args) {
            try {
                return await method.apply(this, args);
            }
            catch (error) {
                if (!(error instanceof Error))
                    return;
                log = log.bind(logger);
                log(error.message);
                throw error;
            }
        };
    };
}
//# sourceMappingURL=logger.js.map