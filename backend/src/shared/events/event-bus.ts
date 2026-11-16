export interface IDomainEvent {
  eventName: string;
  occurredOn: Date;
  payload: any;
}

export type EventHandler<T extends IDomainEvent = IDomainEvent> = (event: T) => Promise<void> | void;

export class InMemoryEventBus {
  private static instance: InMemoryEventBus;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryEventBus {
    if (!InMemoryEventBus.instance) {
      InMemoryEventBus.instance = new InMemoryEventBus();
    }
    return InMemoryEventBus.instance;
  }

  public subscribe<T extends IDomainEvent>(eventName: string, handler: EventHandler<T>): void {
    const list = this.handlers.get(eventName) || [];
    list.push(handler as EventHandler);
    this.handlers.set(eventName, list);
  }

  public async publish<T extends IDomainEvent>(event: T): Promise<void> {
    const list = this.handlers.get(event.eventName) || [];
    for (const handler of list) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Error handling event ${event.eventName}:`, error);
      }
    }
  }
}
