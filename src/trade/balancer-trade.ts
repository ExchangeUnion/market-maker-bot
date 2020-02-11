import { Logger } from '../logger';
import { Balance } from '../broker/api';
import { OrderSide } from '../enums';
import { EventEmitter } from 'events';
import { satsToCoinsStr } from '../utils';

export type BalancerOrder = {
  baseAsset: string;
  quoteAsset: string;
  orderSide: OrderSide;
  quantity: number;
};

interface BalancerTrade {
  on(event: 'order', listener: (order: BalancerOrder) => void): this;
  emit(event: 'order', order: BalancerOrder): boolean;
}

class BalancerTrade extends EventEmitter {
  private logger: Logger;
  private _baseAsset: string;
  private _quoteAsset: string;
  private baseAssetBalance: Balance;

  constructor(
    {
      logger,
      baseAsset,
      quoteAsset,
      baseAssetBalance,
    }:
    {
      logger: Logger,
      baseAsset: string,
      quoteAsset: string,
      baseAssetBalance: Balance,
    },
  ) {
    super();
    this.logger = logger;
    this._baseAsset = baseAsset;
    this._quoteAsset = quoteAsset;
    this.baseAssetBalance = baseAssetBalance;
  }

  public get baseAsset() {
    return this._baseAsset;
  }

  public get quoteAsset() {
    return this._quoteAsset;
  }

  public get totalBaseAsset() {
    return this.baseAssetBalance.free + this.baseAssetBalance.locked;
  }

  public get maxSellCapacity() {
    return parseFloat(
      satsToCoinsStr(
        this.baseAssetBalance.maxsell || 0,
      ),
    );
  }

  public get maxBuyCapacity() {
    return parseFloat(
      satsToCoinsStr(
        this.baseAssetBalance.maxbuy || 0,
      ),
    );
  }

  public start = async () => {
    this.logger.info(`Balancer Trade started for ${this.baseAsset}${this.quoteAsset}`);
    await this.checkLimits();
  }

  public setAssets = async (baseAssetBalance: Balance) => {
    this.baseAssetBalance = baseAssetBalance;
    this.checkLimits();
  }

  public close = async () => {
    this.logger.info(`Balancer Trade stopped for ${this.baseAsset}${this.quoteAsset}`);
  }

  private checkLimits = async () => {
    const maxBaseAsset = parseFloat(
      process.env[`MAX${this.baseAsset}`] || '0',
    );
    if (!maxBaseAsset) {
      throw new Error(`configuration option MAX${this.baseAsset} is not set`);
    }
    const minBaseAsset = parseFloat(
      process.env[`MIN${this.baseAsset}`] || '0',
    );
    if (!minBaseAsset) {
      throw new Error(`configuration option MIN${this.baseAsset} is not set`);
    }
    if (this.totalBaseAsset > maxBaseAsset) {
      this.logger.info(`${this.baseAsset} is above ${maxBaseAsset}`);
      let quantity = this.totalBaseAsset - maxBaseAsset;
      if (quantity > this.maxSellCapacity) {
        this.logger.warn(`lacking enough outbound capacity to sell ${quantity} ${this.baseAsset} - maximum sell capacity is ${this.maxSellCapacity}`);
        quantity = this.maxSellCapacity;
      }
      this.emit('order', {
        quantity,
        baseAsset: this.baseAsset,
        quoteAsset: this.quoteAsset,
        orderSide: OrderSide.Sell,
      });
    }
    if (this.totalBaseAsset < minBaseAsset) {
      this.logger.info(`${this.baseAsset} is below ${minBaseAsset}`);
      const averageMinMax = (maxBaseAsset + minBaseAsset) / 2;
      let quantity = averageMinMax - this.totalBaseAsset;
      if (quantity > this.maxBuyCapacity) {
        this.logger.warn(`lacking enough inbound capacity to buy ${quantity} ${this.baseAsset} - maximum buy capacity is ${this.maxBuyCapacity}`);
        quantity = this.maxBuyCapacity;
      }
      this.emit('order', {
        quantity,
        baseAsset: this.baseAsset,
        quoteAsset: this.quoteAsset,
        orderSide: OrderSide.Buy,
      });
    }
  }
}

export { BalancerTrade };
