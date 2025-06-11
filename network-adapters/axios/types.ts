// HTTP 응답 타입 정의 (제네릭 사용)
// data: 실제 응답 데이터
// status: HTTP 상태 코드
// statusText: 상태 메시지
// headers: 응답 헤더 (키-값 쌍)
export type HttpResponse<T = any> = {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
};

// 에러 응답 타입 정의
// code: 에러 코드
// message: 에러 메시지
// details: 추가적인 에러 정보 (선택적)
export type ErrorResponse = {
    code: string;
    message: string;
    details?: Record<string, any>;
    log_level?: "error" | "log" | "warn";
};

// HTTP 에러의 기본 클래스입니다.
// status: HTTP 상태 코드
// code: 에러 코드
// message: 에러 메시지
// details: 추가적인 에러 정보 (선택적)
export class HttpError extends Error {
    constructor(
        public readonly status: number, // HTTP 상태 코드
        public readonly code: string,   // 에러 코드
        message: string,                // 에러 메시지
        public readonly details?: Record<string, any>, // 추가 정보 (선택)
    ) {
        super(message);
        this.name = 'LogtoHttpError'; // 에러 이름 지정
    }
}

// 네트워크 에러를 나타내는 클래스입니다.
export class NetworkError extends HttpError {
    constructor(message: string) {
        super(500, 'network_error', message);
        this.name = this.constructor.name; // 클래스 이름으로 에러 이름 설정
    }
}

// 타임아웃 에러를 나타내는 클래스입니다.
export class TimeoutError extends HttpError {
    constructor(message: string) {
        super(500, 'timeout_error', message);
        this.name = this.constructor.name;
    }
}

// 잘못된 요청(400)에 대한 에러 클래스입니다.
export class BadRequestError extends HttpError {
    constructor(message: string = 'Bad request') {
        super(400, 'bad_request', message);
        this.name = this.constructor.name;
    }
}

// 인증 실패(401)에 대한 에러 클래스입니다.
export class UnauthorizedError extends HttpError {
    constructor(message: string = 'Unauthorized access') {
        super(401, 'unauthorized', message);
        this.name = this.constructor.name;
    }
}

// 권한 없음(403)에 대한 에러 클래스입니다.
export class ForbiddenError extends HttpError {
    constructor(message: string = 'Access forbidden') {
        super(403, 'forbidden', message);
        this.name = this.constructor.name;
    }
}

// 리소스를 찾을 수 없음(404)에 대한 에러 클래스입니다.
export class NotFoundError extends HttpError {
    constructor(message: string = 'Resource not found') {
        super(404, 'not_found', message);
        this.name = this.constructor.name;
    }
}

// 유효성 검사 실패(422)에 대한 에러 클래스입니다.
// code와 details는 선택적으로 전달할 수 있습니다.
export class ValidationError extends HttpError {
    constructor(message: string, code?: string, details?: Record<string, any>) {
        super(422, code ?? 'validation_error', message, details);
        this.name = this.constructor.name;
    }
}
