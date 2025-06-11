import { LoggerService } from '@nestjs/common';
import { HttpResponse } from './types';
import { AxiosRequestConfig } from 'axios';
export declare class RESTTemplate {
    private logger;
    private readonly axiosInstance;
    constructor(logger: LoggerService, baseURL?: string, timeout?: number);
    private handleError;
    setBearer(token: string): void;
    setBasic(username: string, password: string): void;
    get<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>>;
    patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>>;
}
