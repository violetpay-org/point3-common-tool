import { EventRepository, EventStorage } from "./storage";
import { BaseEvent, Payload } from "./event";
import { Guid } from "../values";

// import { Producer } from "node-rdkafka";
import { Inject, Logger } from "@nestjs/common";
import { RelayerError } from "./errors";
// import { KafkaProducerToken } from "src/infrastructure/kafka/kafka.config";
import { ModuleRef } from "@nestjs/core";

const RELAY_MAP = new Map<Symbol, EventRepository<BaseEvent<Guid, Payload>>>();

class From {
    constructor(
        private readonly repository: EventRepository<BaseEvent<Guid, Payload>>,
        private readonly type: EventStorage,
    ) {}

    get Repository(): EventRepository<BaseEvent<Guid, Payload>> {
        return this.repository;
    }

    get Type(): EventStorage {
        return this.type;
    }
}

const REPOSITORY_REGISTRATIONS = new Map<symbol, symbol>();
/**
 * 이벤트를 등록하고 처리하는 애플리케이션을 위한 기본 클래스
 * 
 * @example
 * ```typescript
 * export class ClientApplication extends EventRelayableApplication {
 *   constructor(
 *     \@RegisterableEventRepository(ClientEventTopic, ClientEventRepositoryToken)
 *     private readonly clientEventRepository: IClientEventRepository,
 *     moduleRef: ModuleRef
 *   ) {
 *     super(moduleRef);
 *     this.registerEvents();
 *   }
 * }
 * ```
 * 
 * @remarks
 * - 생성자에서 반드시 {@link EventRelayableApplication.registerEvents}를 호출하여 이벤트 저장소를 등록해야 합니다
 * - {@link RegisterableEventRepository} 데코레이터와 함께 사용하여 저장소를 등록합니다
 * - 등록된 저장소는 이벤트 릴레이를 위해 전역 맵에 저장됩니다
 * - 이벤트 저장소가 등록되지 않으면 이벤트 릴레이가 동작하지 않습니다
 */
export class EventRelayableApplication {
    public isRegistered = false;

    constructor(
        private readonly moduleRef: ModuleRef,
    ) {}

    /**
     * 이벤트 저장소를 등록합니다.
     */
    registerEvents() {
        REPOSITORY_REGISTRATIONS.forEach((topic, repositoryToken) => {
            const repository = this.moduleRef.get(repositoryToken);
            if (!repository) return;
            RELAY_MAP.set(topic, repository);
        });

        this.isRegistered = true;
    }
}

/**
 * 매개변수로 전달된 이벤트 리포지토리를 이벤트 릴레이어에서 사용할 수 있도록 등록하는 데코레이터.
 * 이 데코레이터를 사용하는 클래스는 반드시 EventRelayableApplication 클래스를 상속받아야 한다.
 * @param topic 
 * @returns 
 */
export function RegisterableEventRepository(topic: symbol, repositoryToken: symbol): ParameterDecorator {
    return function(
        target: Object, 
        propertyKey: string | symbol,
        parameterIndex: number
    ): void {
        // Get parameter type metadata
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
        const paramType = paramTypes?.[parameterIndex];

        // Type checking at decoration time - modified to be more robust
        if (!paramType) {
            throw new RelayerError(
                `Failed to get parameter type for ${target.constructor.name}'s parameter at index ${parameterIndex}`
            );
        }
        REPOSITORY_REGISTRATIONS.set(repositoryToken, topic);
    };
}

export const EventRelayerToken = Symbol.for("EventRelayer");
export abstract class BaseEventRelayer {
    constructor(
        @Inject(Logger)
        private readonly logger: Logger
    ) {}

    async execute(): Promise<void> {
        for (const [key, eventRepository] of RELAY_MAP.entries()) {
            const outbox = new From(eventRepository, EventStorage.OUTBOX);
            const deadLetter = new From(eventRepository, EventStorage.DEAD_LETTER);

            const outBoxEvents = await this.collectEvents(outbox);
            const deadLetterEvents = await this.collectEvents(deadLetter);

            for await (const event of outBoxEvents) {
                await this.relay(event, outbox, key);
            }
            for await (const event of deadLetterEvents) {
                await this.relay(event, deadLetter, key);
            }
        }
    }

    private async collectEvents(from: From): Promise<BaseEvent<Guid, Payload>[]> {
        try {
            const events = await from.Repository.get(
                from.Type, 
                this.BatchSize
            );
            return events;
        } catch (error) {
            this.logger.error(`레파지토리에서 이벤트 수집 중 오류가 발생했습니다. 오류 내용: ${error}, 오류 타입: ${error.constructor.name}, 스택 트레이스: ${error.stack}`);
            return [];
        }
    }

    /**
     * @todo - 이후, 릴레이 맵에 관련하여 dynamic 하게 처리할 수 있도록 수정 필요
     * 배치 처리 시 한번에 처리할 이벤트 수
     */
    private get BatchSize(): number {
        return 1000;
    }
    
    private async relay(message: BaseEvent<Guid, Payload>, from: From, to: Symbol): Promise<void> {
        try {
            await this.produce(message, from, to);
            await this.commitCompleted(message, from);
        } catch (error) {
            this.logger.warn(`메시지 ${message.Id.toString()}를 ${to.toString()}로 커밋하는데 실패했습니다: ${error}`);
            await this.commitToDeadletter(message, from);
        }
    }

    protected abstract produce(
        message: BaseEvent<Guid, Payload>,
        from: From,
        to: Symbol,
    ): Promise<void>;

    private async commitToDeadletter(message: BaseEvent<Guid, Payload>, from: From): Promise<void> {
        switch (from.Type) {
            case EventStorage.DEFAULT:
            case EventStorage.OUTBOX:
                await this.trySilently(from.Repository.toDeadletter(message));
                break;
            case EventStorage.DEAD_LETTER:
                break;
            default:
                const _exhaustiveCheck: never = from.Type;
                throw new Error(`알 수 없는 이벤트 저장소 타입입니다: ${_exhaustiveCheck}`);
        }    
    }

    private async commitCompleted(message: BaseEvent<Guid, Payload>, from: From): Promise<void> {
        await this.trySilently(from.Repository.delete(from.Type, message.Id));
    }

    private async trySilently(func: Promise<void>): Promise<void> {
        try {
            await func;
        } catch (error) {
            this.logger.warn(`실행 중 오류가 발생했습니다. 오류 내용: ${error}, 오류 타입: ${error.constructor.name}, 스택 트레이스: ${error.stack}`);
        }
    }
}