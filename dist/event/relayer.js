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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEventRelayer = exports.EventRelayerToken = exports.EventRelayableApplication = exports.From = void 0;
exports.RegisterableEventRepository = RegisterableEventRepository;
const storage_1 = require("./storage");
const common_1 = require("@nestjs/common");
const errors_1 = require("./errors");
const async_mutex_1 = require("async-mutex");
const RELAY_MAP = new Map();
class From {
    constructor(repository, type) {
        this.repository = repository;
        this.type = type;
    }
    get Repository() {
        return this.repository;
    }
    get Type() {
        return this.type;
    }
}
exports.From = From;
const REPOSITORY_REGISTRATIONS = new Map();
class EventRelayableApplication {
    constructor(moduleRef) {
        this.moduleRef = moduleRef;
        this.isRegistered = false;
    }
    registerEvents() {
        REPOSITORY_REGISTRATIONS.forEach((topic, repositoryToken) => {
            this.trySilently(() => {
                const repository = this.moduleRef.get(repositoryToken);
                RELAY_MAP.set(topic, repository);
            });
        });
        this.isRegistered = true;
    }
    trySilently(fn) {
        try {
            fn();
        }
        catch (e) { }
    }
}
exports.EventRelayableApplication = EventRelayableApplication;
function RegisterableEventRepository(topic, repositoryToken) {
    return function (target, propertyKey, parameterIndex) {
        const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
        const paramType = paramTypes?.[parameterIndex];
        if (!paramType) {
            throw new errors_1.RelayerError(`Failed to get parameter type for ${target.constructor.name}'s parameter at index ${parameterIndex}`);
        }
        REPOSITORY_REGISTRATIONS.set(repositoryToken, topic);
    };
}
exports.EventRelayerToken = Symbol.for("EventRelayer");
let BaseEventRelayer = class BaseEventRelayer {
    constructor(logger) {
        this.logger = logger;
        this.mutex = new async_mutex_1.Mutex;
    }
    async execute() {
        try {
            await this.mutex.acquire();
            for (const [key, eventRepository] of RELAY_MAP.entries()) {
                const outbox = new From(eventRepository, storage_1.EventStorage.OUTBOX);
                const deadLetter = new From(eventRepository, storage_1.EventStorage.DEAD_LETTER);
                const outBoxEvents = await this.collectEvents(outbox);
                const deadLetterEvents = await this.collectEvents(deadLetter);
                await Promise.all(outBoxEvents.map(event => this.relay(event, outbox, key)));
                await Promise.all(deadLetterEvents.map(event => this.relay(event, deadLetter, key)));
            }
        }
        finally {
            this.mutex.release();
        }
    }
    async collectEvents(from) {
        try {
            const events = await from.Repository.get(from.Type, this.BatchSize);
            return events;
        }
        catch (error) {
            this.logger.error(`레파지토리에서 이벤트 수집 중 오류가 발생했습니다. 오류 내용: ${error}, 오류 타입: ${error.constructor.name}, 스택 트레이스: ${error.stack}`);
            return [];
        }
    }
    get BatchSize() {
        return 1000;
    }
    async relay(message, from, to) {
        try {
            await this.produce(message, from, to);
            await this.commitCompleted(message, from);
        }
        catch (error) {
            this.logger.warn(`메시지 ${message.Id.toString()}를 ${to.description}로 커밋하는데 실패했습니다: ${error}`);
            await this.commitToDeadletter(message, from);
        }
    }
    async commitToDeadletter(message, from) {
        switch (from.Type) {
            case storage_1.EventStorage.DEFAULT:
            case storage_1.EventStorage.OUTBOX:
                await this.trySilently(from.Repository.toDeadletter(message));
                break;
            case storage_1.EventStorage.DEAD_LETTER:
                break;
            default:
                const _exhaustiveCheck = from.Type;
                throw new Error(`알 수 없는 이벤트 저장소 타입입니다: ${_exhaustiveCheck}`);
        }
    }
    async commitCompleted(message, from) {
        await this.trySilently(from.Repository.delete(from.Type, message.Id));
    }
    async trySilently(func) {
        try {
            await func;
        }
        catch (error) {
            this.logger.warn(`실행 중 오류가 발생했습니다. 오류 내용: ${error}, 오류 타입: ${error.constructor.name}, 스택 트레이스: ${error.stack}`);
        }
    }
};
exports.BaseEventRelayer = BaseEventRelayer;
exports.BaseEventRelayer = BaseEventRelayer = __decorate([
    __param(0, (0, common_1.Inject)(common_1.Logger)),
    __metadata("design:paramtypes", [common_1.Logger])
], BaseEventRelayer);
//# sourceMappingURL=relayer.js.map