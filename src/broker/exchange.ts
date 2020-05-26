import {
  ExchangeType,
  OrderType,
  OrderSide,
} from '../enums';
import { getBinancePriceStream } from './binance/stream';
import { OpenDexStream } from './opendex/stream';
import { OpenDexOrder } from './opendex/order';
import { Logger } from '../logger';
import { BinanceAPI } from './binance/api';
import { OpenDexAPI } from './opendex/api';
import { ExchangeAPI, Balance } from './api';
import { BinanceOrder } from './binance/order';
import { Observable } from 'rxjs';
import { BigNumber } from 'bignumber.js';

export type OrderRequest = {
  orderId: string,
  baseAsset: string,
  quoteAsset: string,
  orderType: OrderType,
  orderSide: OrderSide,
  quantity: number,
};

export type StopLimitOrderRequest = LimitOrderRequest & {
  stopPrice: number,
};

export type MarketOrderRequest = OrderRequest & {
  price: string,
};

export type LimitOrderRequest = OrderRequest & {
  price: number,
};

class ExchangeBroker {
  private exchange: ExchangeType;
  private priceStreams = new Map<string, Observable<BigNumber>>();
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private certPath: string | undefined;
  private rpchost: string | undefined;
  private rpcport: number | undefined;
  private logger: Logger;
  private api!: ExchangeAPI;

  constructor(
    {
      exchange,
      apiKey,
      apiSecret,
      certPath,
      logger,
      rpchost,
      rpcport,
    }:
    {
      exchange: ExchangeType,
      logger: Logger,
      apiKey?: string,
      apiSecret?: string,
      certPath?: string,
      rpchost?: string,
      rpcport?: number,
    },
  ) {
    this.exchange = exchange;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.certPath = certPath;
    this.logger = logger;
    this.rpchost = rpchost;
    this.rpcport = rpcport;
  }

  public start = async () => {
    this.checkConfig();
    if (this.exchange === ExchangeType.Binance) {
      this.api = new BinanceAPI({
        logger: this.logger,
        apiKey: this.apiKey!,
        apiSecret: this.apiSecret!,
      });
    } else if (this.exchange === ExchangeType.OpenDEX) {
      this.api = new OpenDexAPI({
        logger: this.logger,
        certPath: this.certPath!,
        rpchost: this.rpchost!,
        rpcport: this.rpcport!,
      });
    }
    await this.api.start();
  }

  public getAssets = async (): Promise<Balance[]> => {
    const ownedAssets = await this.api.getAssets();
    return ownedAssets;
  }

  public getPrice = (
    tradingPair: string,
  ): Observable<BigNumber> => {
    const priceStream = this.priceStreams.get(tradingPair);
    if (priceStream) {
      return priceStream;
    } else {
      if (this.exchange === ExchangeType.Binance) {
        const binancePrice$ = getBinancePriceStream(tradingPair, this.logger);
        this.priceStreams.set(tradingPair, binancePrice$);
      } else if (this.exchange === ExchangeType.OpenDEX) {
        const openDexStream = new OpenDexStream();
        this.priceStreams.set(tradingPair, openDexStream.getObservable());
      }
    }
    return this.priceStreams.get(tradingPair)!;
  }

  public newOrder = (
    orderRequest: MarketOrderRequest | LimitOrderRequest | StopLimitOrderRequest,
  ): BinanceOrder | OpenDexOrder => {
    return this.api.newOrder(orderRequest);
  }

  public close = async () => {
    if (this.api) {
      await this.api.stop();
    }
  }

  private checkConfig = () => {
    if (
      this.exchange === ExchangeType.Binance &&
      (!this.apiKey || !this.apiSecret)
    ) {
      throw new Error('Binance exchange type requires you to specify the apiKey and apiSecret');
    } else if (
      this.exchange === ExchangeType.OpenDEX &&
      (!this.certPath || !this.rpchost || !this.rpcport)
    ) {
      throw new Error('OpenDEX exchange type requires you to specify the certPath, rpchost and rpcport');
    }
  }
}

export { ExchangeBroker };
