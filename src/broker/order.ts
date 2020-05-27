import { EventEmitter } from 'events';
import {
  OrderType,
  OrderSide,
  OrderStatus,
} from '../enums';
import {
  ExchangeAPI,
} from './api';
import { Logger } from '../logger';

interface Order { on(event: 'failure', listener: (failure: string) => void): this;
  on(event: 'fill', listener: (fill: string) => void): this;
  on(event: 'status', listener: (status: string) => void): this;
  on(event: 'complete', listener: (orderId: string, quantity: number) => void): this;
  emit(event: 'failure', failure: string): boolean;
  emit(event: 'fill', fill: string): boolean;
  emit(event: 'status', status: string): boolean;
  emit(event: 'complete', orderId: string, quantity: number): boolean;
}

abstract class Order extends EventEmitter {
  public orderId: string;
  protected baseAsset: string;
  protected quoteAsset: string;
  protected orderType: OrderType;
  protected orderSide: OrderSide;
  protected quantity: number;
  protected price: number | string;
  protected stopPrice: number | undefined;
  protected api: ExchangeAPI;
  protected logger: Logger;
  protected status: OrderStatus | undefined;

  constructor(
    {
      orderId,
      baseAsset,
      quoteAsset,
      orderType,
      orderSide,
      quantity,
      price,
      stopPrice,
      api,
      logger,
    }:
    {
      orderId: string,
      baseAsset: string,
      quoteAsset: string,
      orderType: OrderType,
      orderSide: OrderSide,
      quantity: number,
      price: number | string,
      stopPrice?: number,
      api: ExchangeAPI,
      logger: Logger,
    },
  ) {
    super();
    this.orderId = orderId;
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.orderType = orderType;
    this.orderSide = orderSide;
    this.quantity = quantity;
    this.price = price;
    if (orderType === OrderType.StopLimit) {
      if (!stopPrice) {
        throw new Error('stop-limit order requires a stopPrice');
      }
      this.stopPrice = stopPrice;
    }
    this.api = api;
    this.logger = logger;
  }

  get tradingPair(): string {
    return `${this.baseAsset}${this.quoteAsset}`;
  }

  public abstract start(): Promise<void>;
  public abstract cancel(): Promise<void>;
}

export { Order };
