// NestJS Core
import {
    Injectable,
    LoggerService
} from '@nestjs/common';

// HTTP 타입 정의
import {
    HttpResponse,
    ErrorResponse,
    NetworkError,
    TimeoutError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    BadRequestError,
    HttpError,
} from './types';

// Axios 라이브러리
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

/**
 * RESTTemplate 추상 클래스
 * 
 * 이 클래스는 Axios를 기반으로 한 HTTP 클라이언트 템플릿입니다.
 * 공통적인 HTTP 메서드(get, post, put, delete, patch)와 인증 헤더 설정, 
 * 에러 핸들링 로직을 제공합니다.
 * 
 * NestJS의 Injectable 데코레이터가 적용되어 의존성 주입이 가능합니다.
 */
@Injectable()
export abstract class RESTTemplate {
    /**
     * Axios 인스턴스 (내부적으로 사용)
     */
    private readonly axiosInstance: AxiosInstance;

    /**
     * 생성자
     * @param logger NestJS LoggerService 인스턴스
     * @param baseURL 기본 요청 URL (선택)
     * @param timeout 요청 타임아웃(ms, 기본값: 5000)
     */
    constructor(
        private logger: LoggerService,
        baseURL?: string,
        timeout: number = 5000,
    ) {
        this.axiosInstance = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 응답에 대한 에러 처리 인터셉터 추가
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ErrorResponse>) => {
                return Promise.reject(this.handleError(error));
            },
        );
    }

    /**
     * Axios 에러를 커스텀 에러 객체로 변환
     * @param error AxiosError 객체
     * @returns Error 객체 (커스텀 에러)
     */
    private handleError(error: AxiosError<ErrorResponse>): Error {
        if (error.response) {
            // 서버가 응답한 경우 (2xx 범위 외)
            const { status, data } = error.response;
            const message = data?.message || error.message;
            const code = data?.code || 'unknown_error';
            const details = data?.details;

            // log_level에 따라 로그 출력
            switch (data.log_level) {
                case undefined:
                case "error":
                    this.logger.error(
                        `HTTP Error: ${status} - ${message} (code: ${code})`,
                        this.constructor.name,
                    );
                case "log":
                    this.logger.log(
                        `HTTP Error: ${status} - ${message} (code: ${code})`,
                        this.constructor.name
                    );
                case "warn":
                    this.logger.warn(
                        `HTTP Error: ${status} - ${message} (code: ${code})`,
                        this.constructor.name
                    );
            };

            // 상태 코드에 따라 커스텀 에러 반환
            switch (status) {
                case 400:
                    return new BadRequestError(message);
                case 401:
                    return new UnauthorizedError(message);
                case 403:
                    return new ForbiddenError(message);
                case 404:
                    return new NotFoundError(message);
                case 422:
                    return new ValidationError(message, code, details);
                default:
                    return new HttpError(status, code, message, details);
            }
        } else if (error.request) {
            // 서버 응답이 없는 경우 (네트워크 에러 등)
            if (error.code === 'ECONNABORTED') return new TimeoutError('아웃바운드 요청 중 타임아웃 예외 발생하였습니다.');
            return new NetworkError('아웃바운드 요청 중 네트워크 예외 발생하였습니다.');
        }
        return error;
    }

    /**
     * Bearer 인증 토큰 설정
     * @param token Bearer 토큰 문자열
     */
    public setBearer(token: string): void {
        this.axiosInstance.defaults.headers.common['Authorization'] =
            `Bearer ${token}`;
    };

    /**
     * Basic 인증 헤더 설정
     * @param username 사용자명
     * @param password 비밀번호
     */
    public setBasic(username: string, password: string): void {
        const basicAuth = btoa(`${username}:${password}`);
        this.axiosInstance.defaults.headers.common['Authorization'] =
            `Basic ${basicAuth}`;
    };

    /**
     * GET 요청
     * @param url 요청 URL
     * @param config Axios 요청 설정 (선택)
     * @returns HttpResponse<T>
     */
    public async get<T>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.get<T>(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
        };
    }

    /**
     * POST 요청
     * @param url 요청 URL
     * @param data 전송 데이터 (선택)
     * @param config Axios 요청 설정 (선택)
     * @returns HttpResponse<T>
     */
    public async post<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.post<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
        };
    }

    /**
     * PUT 요청
     * @param url 요청 URL
     * @param data 전송 데이터 (선택)
     * @param config Axios 요청 설정 (선택)
     * @returns HttpResponse<T>
     */
    public async put<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.put<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
        };
    }

    /**
     * DELETE 요청
     * @param url 요청 URL
     * @param config Axios 요청 설정 (선택)
     * @returns HttpResponse<T>
     */
    public async delete<T>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.delete<T>(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
        };
    }

    /**
     * PATCH 요청
     * @param url 요청 URL
     * @param data 전송 데이터 (선택)
     * @param config Axios 요청 설정 (선택)
     * @returns HttpResponse<T>
     */
    public async patch<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<HttpResponse<T>> {
        const response = await this.axiosInstance.patch<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as Record<string, string>,
        };
    }
}
