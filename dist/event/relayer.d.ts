import { EventRepository, EventStorage } from "./storage";
import { BaseEvent, Payload } from "./event";
import { Guid } from "../values";
import { Logger } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
export declare class From {
    private readonly repository;
    private readonly type;
    constructor(repository: EventRepository<BaseEvent<Guid, Payload>>, type: EventStorage);
    get Repository(): EventRepository<BaseEvent<Guid, Payload>>;
    get Type(): EventStorage;
}
export declare class EventRelayableApplication {
    private readonly moduleRef;
    isRegistered: boolean;
    constructor(moduleRef: ModuleRef);
    registerEvents(): void;
}
export declare function RegisterableEventRepository(topic: symbol, repositoryToken: symbol): ParameterDecorator;
export declare const EventRelayerToken: unique symbol;
export declare abstract class BaseEventRelayer {
    private readonly logger;
    constructor(logger: Logger);
    execute(): Promise<void>;
    private collectEvents;
    private get BatchSize();
    private relay;
    protected abstract produce(message: BaseEvent<Guid, Payload>, from: From, to: Symbol): Promise<void>;
    private commitToDeadletter;
    private commitCompleted;
    private trySilently;
}
