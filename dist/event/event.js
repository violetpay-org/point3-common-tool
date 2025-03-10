"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEvent = void 0;
const assert_1 = __importDefault(require("assert"));
const values_1 = require("../values");
class BaseEvent {
    constructor(payload, eventId) {
        this.payload = payload;
        (0, assert_1.default)("prefix" in this.constructor, "BaseEvent 를 상속받은 클래스는 반드시 static method prefix를 구현해야 합니다");
        if (eventId) {
            (0, assert_1.default)(this.isValidEventId(eventId), `prefix ${this.constructor.prefix}에 맞는 유효한 형식의 아이디가 아닙니다.`);
        }
        this.id = eventId ? eventId : values_1.Guid.create(this.constructor.prefix);
    }
    isValidEventId(id) {
        return id.Prefix == this.constructor.prefix;
    }
    get Payload() {
        return this.payload;
    }
    get Id() {
        return this.id;
    }
}
exports.BaseEvent = BaseEvent;
//# sourceMappingURL=event.js.map