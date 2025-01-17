import * as winston from "winston";
import { LoggerService, LogLevel } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
declare class WinstonLogger implements LoggerService {
    private winstonLogger;
    private static logLevels;
    constructor(winstonLogger: winston.Logger);
    log(message: any, ...optionalParams: any[]): winston.Logger;
    error(message: any, ...optionalParams: any[]): winston.Logger;
    warn(message: any, ...optionalParams: any[]): winston.Logger;
    debug?(message: any, ...optionalParams: any[]): winston.Logger;
    verbose?(message: any, ...optionalParams: any[]): winston.Logger;
    fatal?(message: any, ...optionalParams: any[]): winston.Logger;
    setLogLevels?(levels: LogLevel[]): void;
    private isLogLevelEnabled;
}
export declare const loggerFactory: (configService: ConfigService) => WinstonLogger;
export declare function Log(level?: LogLevel): (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => void;
export {};
