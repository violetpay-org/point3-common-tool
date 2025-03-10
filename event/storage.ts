import { Guid } from "../values";
import { BaseEvent } from "./event";

export enum EventStorage {
    DEFAULT = "OUTBOX",
    DEAD_LETTER = "DEAD_LETTER",
    OUTBOX = "OUTBOX",
}

export interface EventRepository<E extends BaseEvent<Guid, any>> {
    /**
     * 이벤트를 아웃박스에 저장합니다.
     * 저장된 이벤트가 이미 존재한다면, 묵음으로 처리하고 넘어갑니다.
     * 여러개 저장시도 시, 하나의 이벤트라도 저장을 실패하면 모두 rollback 합니다.
     * @param event 
     */
    save(event: E): Promise<void>;
    save(...events: E[]): Promise<void>;

    /**
     * 이벤트를 Deadletter에 저장합니다.
     * 만약 저장된 이벤트가 이미 Deadletter 이면 묵음으로 처리합니다.
     * 만약 저장된 이벤트가 Outbox에도 없고 Deadletter에도 없으면 묵음 처리합니다.
     * 여러개 저장 시도 시, 하나의 이벤트라도 저장을 실패하면 모두 rollback 합니다.
     * @param event 
     */
    toDeadletter(event: E): Promise<void>;
    toDeadletter(eventId: Guid): Promise<void>;
    toDeadletter(...events: E[]): Promise<void>;
    toDeadletter(...eventIds: Guid[]): Promise<void>;

    /**
     * 이벤트를 명시된 저장소로부터 가져옵니다.
     * 만약 이벤트가 없다면 예외를 발생시키지 않고 빈 배열을 반환합니다.
     * @param from 
     * @param eventId 
     */
    get(from: EventStorage, ...eventIds: Guid[]): Promise<E[]>;
    get(from: EventStorage, num_events: number): Promise<E[]>;

    /**
     * 이벤트를 명시적으로 삭제합니다.
     * 만약 이벤트가 없다면 예외를 발생시키지 않고 묵음으로 처리합니다.
     * @param from 
     * @param eventId 
     */
    delete(from: EventStorage, eventId: Guid): Promise<void>;
    /**
     * 이벤트를 명시된 저장소에서 삭제합니다.
     * 만약 이벤트가 없다면 예외를 발생시키지 않고 넘어갑니다.
     * 여러개 삭제 시도 시, 하나의 이벤트라도 삭제를 실패하면 모두 rollback 합니다.
     * @param from 삭제할 저장소 위치
     * @param eventIds 삭제할 이벤트 ID 목록
     */
    delete(from: EventStorage, ...eventIds: Guid[]): Promise<void>;
}