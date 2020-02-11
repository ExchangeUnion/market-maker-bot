import { EventEmitter } from 'events';

interface Stream {
  on(event: 'price', listener: (tradingPair: string, price: number) => void): this;
  emit(event: 'price', tradingPair: string, price: number): boolean;
}

abstract class Stream extends EventEmitter {
  public abstract start(): Promise<void>;
  public abstract close(): Promise<void>;
}

export { Stream };
