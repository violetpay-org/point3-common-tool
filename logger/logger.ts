import * as winston from "winston";
import moment from "moment-timezone";
import { ConsoleLogger, Logger, LoggerService, LogLevel } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Winston Logger 를 이용하여 LoggerService 를 구현
 * 본 서비스는 최대한 밖에서 이용하지 않아야 합니다.
 */
class WinstonLogger implements LoggerService {
    private static logLevels: LogLevel[] = [];

    constructor(private winstonLogger: winston.Logger) {}

    log(message: any, ...optionalParams: any[]) {
        if (!this.isLogLevelEnabled("log")) return;
        return this.winstonLogger.info(message, ...optionalParams);
    }

    error(message: any, ...optionalParams: any[]) {
        if (!this.isLogLevelEnabled("error")) return;
        return this.winstonLogger.error(message, ...optionalParams);
    }

    warn(message: any, ...optionalParams: any[]) {
        if (!this.isLogLevelEnabled("warn")) return;
        return this.winstonLogger.warn(message, ...optionalParams);
    }
    
    debug?(message: any, ...optionalParams: any[]) {
        if (!this.isLogLevelEnabled("debug")) return;
        return this.winstonLogger.debug(message, ...optionalParams);
        
    }

    verbose?(message: any, ...optionalParams: any[]) {
        if (!this.isLogLevelEnabled("verbose")) return;
        return this.winstonLogger.verbose(message, ...optionalParams);
    }

    fatal?(message: any, ...optionalParams: any[]) {
        if (!this.isLogLevelEnabled("log")) return;
        return this.winstonLogger.alert(message, ...optionalParams);
    }

    setLogLevels?(levels: LogLevel[]) {
        WinstonLogger.logLevels = levels;
    }    

    private isLogLevelEnabled(level: LogLevel): boolean {
        return (
            WinstonLogger.logLevels.length == 0 ||
            WinstonLogger.logLevels.includes(level)
        )
    }
}

const formatTimestamp: winston.Logform.FormatWrap = winston.format((info, opts) => {
    info.timestamp = moment().tz("Asia/Seoul").format();
    return info
})

export const loggerFactory = (
    configService: ConfigService
) => {
    return new WinstonLogger(winston.createLogger({
        level: "info",
        format: winston.format.combine(
            formatTimestamp(),
            winston.format.splat(),
            winston.format.json(),
            winston.format.printf((info) => {
                if (info.splat) {
                    return `${info.timestamp} - ${info.level}: ${info.message}\n${info.splat}`;
                }
                return `${info.timestamp} - ${info.level}: ${info.message}`;
            })
        ),
        transports: [
            new winston.transports.File({
                filename: `${configService.get<string>("LOG_DIRECTORY")}/ob-session.log`
            }),
            new winston.transports.Console()
        ]
    }));
}

export function Log(level: LogLevel = "log") {
    return function (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) {
        let method = propertyDescriptor.value;
        let logger = Object.entries(target)
            .find(([key, _]) => key == "logger")?.[1] || 
            new ConsoleLogger;
        let log = logger[level];

        propertyDescriptor.value = async function (...args: any) {
            try {
                return await method.apply(this, args)
            } catch (error) {
                if (!(error instanceof Error)) return;
                log = log.bind(logger);
                log(error.message);
                throw error;
            }
        }
    }
}