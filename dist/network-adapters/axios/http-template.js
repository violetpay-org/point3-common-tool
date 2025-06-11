"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTTemplate = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("./types");
const axios_1 = __importDefault(require("axios"));
let RESTTemplate = class RESTTemplate {
    constructor(logger, baseURL, timeout = 5000) {
        this.logger = logger;
        this.axiosInstance = axios_1.default.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.axiosInstance.interceptors.response.use((response) => response, (error) => {
            return Promise.reject(this.handleError(error));
        });
    }
    handleError(error) {
        if (error.response) {
            const { status, data } = error.response;
            const message = data?.message || error.message;
            const code = data?.code || 'unknown_error';
            const details = data?.details;
            switch (data.log_level) {
                case undefined:
                case "error":
                    this.logger.error(`HTTP Error: ${status} - ${message} (code: ${code})`, this.constructor.name);
                case "log":
                    this.logger.log(`HTTP Error: ${status} - ${message} (code: ${code})`, this.constructor.name);
                case "warn":
                    this.logger.warn(`HTTP Error: ${status} - ${message} (code: ${code})`, this.constructor.name);
            }
            ;
            switch (status) {
                case 400:
                    return new types_1.BadRequestError(message);
                case 401:
                    return new types_1.UnauthorizedError(message);
                case 403:
                    return new types_1.ForbiddenError(message);
                case 404:
                    return new types_1.NotFoundError(message);
                case 422:
                    return new types_1.ValidationError(message, code, details);
                default:
                    return new types_1.HttpError(status, code, message, details);
            }
        }
        else if (error.request) {
            if (error.code === 'ECONNABORTED')
                return new types_1.TimeoutError('아웃바운드 요청 중 타임아웃 예외 발생하였습니다.');
            return new types_1.NetworkError('아웃바운드 요청 중 네트워크 예외 발생하였습니다.');
        }
        return error;
    }
    setBearer(token) {
        this.axiosInstance.defaults.headers.common['Authorization'] =
            `Bearer ${token}`;
    }
    ;
    setBasic(username, password) {
        const basicAuth = btoa(`${username}:${password}`);
        this.axiosInstance.defaults.headers.common['Authorization'] =
            `Basic ${basicAuth}`;
    }
    ;
    async get(url, config) {
        const response = await this.axiosInstance.get(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }
    async post(url, data, config) {
        const response = await this.axiosInstance.post(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }
    async put(url, data, config) {
        const response = await this.axiosInstance.put(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }
    async delete(url, config) {
        const response = await this.axiosInstance.delete(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }
    async patch(url, data, config) {
        const response = await this.axiosInstance.patch(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }
};
exports.RESTTemplate = RESTTemplate;
exports.RESTTemplate = RESTTemplate = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, String, Number])
], RESTTemplate);
//# sourceMappingURL=http-template.js.map