"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryEventBus = void 0;
class InMemoryEventBus {
    static instance;
    handlers = new Map();
    constructor() { }
    static getInstance() {
        if (!InMemoryEventBus.instance) {
            InMemoryEventBus.instance = new InMemoryEventBus();
        }
        return InMemoryEventBus.instance;
    }
    subscribe(eventName, handler) {
        const list = this.handlers.get(eventName) || [];
        list.push(handler);
        this.handlers.set(eventName, list);
    }
    async publish(event) {
        const list = this.handlers.get(event.eventName) || [];
        for (const handler of list) {
            try {
                await handler(event);
            }
            catch (error) {
                console.error(`[EventBus] Error handling event ${event.eventName}:`, error);
            }
        }
    }
}
exports.InMemoryEventBus = InMemoryEventBus;
