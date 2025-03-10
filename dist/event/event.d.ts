import { Guid } from "../values";
export interface Payload {
    toJSON(): JSON;
}
export declare abstract class BaseEvent<IdType extends Guid, PayloadType extends Payload> {
    private readonly payload;
    protected id: IdType;
    constructor(payload: PayloadType, eventId?: Guid | undefined);
    protected isValidEventId(id: Guid): id is IdType;
    get Payload(): PayloadType;
    get Id(): IdType;
}
