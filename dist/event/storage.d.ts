import { Guid } from "../values";
import { BaseEvent } from "./event";
export declare enum EventStorage {
    DEFAULT = "OUTBOX",
    DEAD_LETTER = "DEAD_LETTER",
    OUTBOX = "OUTBOX"
}
export interface EventRepository<E extends BaseEvent<Guid, any>> {
    save(event: E): Promise<void>;
    save(...events: E[]): Promise<void>;
    toDeadletter(event: E): Promise<void>;
    toDeadletter(eventId: Guid): Promise<void>;
    toDeadletter(...events: E[]): Promise<void>;
    toDeadletter(...eventIds: Guid[]): Promise<void>;
    get(from: EventStorage, ...eventIds: Guid[]): Promise<E[]>;
    get(from: EventStorage, num_events: number): Promise<E[]>;
    delete(from: EventStorage, eventId: Guid): Promise<void>;
    delete(from: EventStorage, ...eventIds: Guid[]): Promise<void>;
}
