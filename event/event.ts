import assert from "assert";
import { Guid } from "../values";

export interface Payload {
    toJSON(): JSON;
}

export abstract class BaseEvent<
    IdType extends Guid,
    PayloadType extends Payload,
> {
    protected id: IdType;
    
    constructor(
        private readonly payload: PayloadType,
        eventId?: Guid | undefined
    ) {
        assert("prefix" in this.constructor, "BaseEvent 를 상속받은 클래스는 반드시 static method prefix를 구현해야 합니다")
        if (eventId) {
            assert(this.isValidEventId(eventId), `prefix ${(this.constructor as any).prefix}에 맞는 유효한 형식의 아이디가 아닙니다.`)
        }

        this.id = eventId ? (eventId as IdType) : (Guid.create((this.constructor as any).prefix) as IdType);
    }

    protected isValidEventId(id: Guid): id is IdType {
        return id.Prefix == (this.constructor as any).prefix;
    }
    
    get Payload(): PayloadType {
        return this.payload;
    }

    get Id(): IdType {
        return this.id
    }
}



