/**
 * 프로미스(Promise) 반환 여부에 따른 제네릭 함수 타입 정의
 * @template isPromise true이면 Promise를 반환하는 비동기 함수, false이면 일반적인 값을 반환하는 동기 함수
 */
export type GenericFunction<isPromise extends boolean>
    = (...args: any[])
        => isPromise extends true ?
        Promise<any> :
        any;

/**
 * 아무 동작도 수행하지 않는 비동기 함수 (no-op)
 */
export const DoNothingAsync = async () => { };

/**
 * 아무 동작도 수행하지 않는 동기 함수 (no-op)
 */
export const DoNothing = () => { };

/**
 * 비동기 함수를 실행하되 예외가 발생하면 무시(silence)하는 래퍼 함수를 반환합니다.
 * @param func 실행할 비동기 함수
 * @param shouldLog 에러 발생 시 콘솔에 에러 로그를 출력할지 여부 (기본값: false)
 * @returns 예외 처리가 포함된 비동기 함수
 */
export function SilentlyRunAsync<F extends GenericFunction<true>>(func: F, shouldLog: boolean = false):
    (...args: Parameters<F>) => Promise<void | Awaited<ReturnType<F>>> {
    return async (...args: Parameters<F>) => {
        try {
            return await func(...args);
        } catch (error) {
            if (shouldLog) console.error(error);
        }
    }
}

/**
 * 동기 함수를 실행하되 예외가 발생하면 무시(silence)하는 래퍼 함수를 반환합니다.
 * @param func 실행할 동기 함수
 * @param shouldLog 에러 발생 시 콘솔에 에러 로그를 출력할지 여부 (기본값: false)
 * @returns 예외 처리가 포함된 동기 함수
 */
export function SilentlyRun<F extends GenericFunction<false>>(func: F, shouldLog: boolean = false):
    (...args: Parameters<F>) => void | ReturnType<F> {
    return (...args: Parameters<F>) => {
        try {
            return func(...args);
        } catch (error) {
            if (shouldLog) console.error(error);
        }
    }
}

/**
 * 인자로 전달된 비동기 함수가 존재하면 해당 함수를 반환하고,
 * undefined인 경우 아무 동작도 하지 않는 비동기 함수(DoNothingAsync)를 반환합니다.
 *
 * @param func 실행하고자 하는 비동기 함수 (undefined일 수 있음)
 * @returns 실행 가능한 비동기 함수
 */
export function OptionallyRunAsync(): typeof DoNothingAsync;
export function OptionallyRunAsync(func: undefined): typeof DoNothingAsync;
export function OptionallyRunAsync<F extends GenericFunction<true>>(func: F): F;
export function OptionallyRunAsync<F extends GenericFunction<true>>(func: F | undefined): F | typeof DoNothingAsync;
export function OptionallyRunAsync<F extends GenericFunction<true>>(func?: F) {
    return (func ?? DoNothingAsync) as any;
}

/**
 * 인자로 전달된 동기 함수가 존재하면 해당 함수를 반환하고,
 * undefined인 경우 아무 동작도 하지 않는 동기 함수(DoNothing)를 반환합니다.
 *
 * @param func 실행하고자 하는 동기 함수 (undefined일 수 있음)
 * @returns 실행 가능한 동기 함수
 */
export function OptionallyRun(): typeof DoNothing;
export function OptionallyRun(func: undefined): typeof DoNothing;
export function OptionallyRun<F extends GenericFunction<false>>(func: F): F;
export function OptionallyRun<F extends GenericFunction<false>>(func: F | undefined): F | typeof DoNothing;
export function OptionallyRun<F extends GenericFunction<false>>(func?: F) {
    return (func ?? DoNothing) as any;
}
