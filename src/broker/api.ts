import { OrderSide, OrderType, OrderStatus } from '../enums';
import {
  MarketOrderRequest,
  LimitOrderRequest,
  StopLimitOrderRequest,
} from './exchange';
import { BinanceOrder } from './binance/order';
import { OpenDexOrder } from './opendex/order';

export type BalanceProperties = {
  free: number;
  locked: number;
  maxsell?: number;
  maxbuy?: number;
};

export type Balance = BalanceProperties & {
  asset: string;
};

export type OrderRequest = {
  baseAsset: string;
  quoteAsset: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
};

export type QueryOrderResponse = {
  tradingPair: string;
  status: OrderStatus;
};

export type QueryOrderRequest = {
  tradingPair: string;
  orderId: string;
};

export type TradingLimits = {
  asset: string;
  maxsell: number;
  maxbuy: number;
};

export type CancelOrderRequest = QueryOrderRequest;

abstract class ExchangeAPI {
  public abstract start(): Promise<void>;
  public abstract stop(): Promise<void>;
  public abstract getAssets(): Promise<Balance[]>;
  public abstract newOrder(
    orderRequest: MarketOrderRequest | LimitOrderRequest | StopLimitOrderRequest
  ): BinanceOrder | OpenDexOrder;
  public abstract queryOrder(
    queryOrderRequest: QueryOrderRequest
  ): Promise<QueryOrderResponse>;
  public abstract cancelOrder(
    cancelOrderRequest: CancelOrderRequest
  ): Promise<boolean>;
}

export { ExchangeAPI };
