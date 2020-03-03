import { Logger } from '../logger';
import { ExchangeBroker } from '../broker/exchange';
import uuidv4 from 'uuid/v4';
import { OrderSide, OrderType } from '../enums';
import { OpenDexOrder } from '../broker/opendex/order';
import { Balance } from '../broker/api';

const ORDER_UPDATE_INTERVAL = 60000;

type CurrencyMap = {
  [key: string]: string;
};

type Currencies = {
  [key: string]: CurrencyMap;
};

const CURRENCIES: Currencies = {
  OpenDex: {
    LTC: 'LTC',
    BTC: 'BTC',
    USD: 'DAI',
    ETH: 'WETH',
  },
  Binance: {
    LTC: 'LTC',
    BTC: 'BTC',
    USD: 'USDT',
    ETH: 'ETH',
  },
};

/** Order size limits */
const limits: { [currency: string]: number } = {
  BTC: 0.00100000,
  LTC: 0.15000000,
  ETH: 0.05,
  USD: 10,
};

class ArbitrageTrade {
  private logger: Logger;
  private baseAsset: string;
  private quoteAsset: string;
  private opendex: ExchangeBroker;
  private binance: ExchangeBroker;
  private openDexBuyOrder: OpenDexOrder | undefined;
  private openDexSellOrder: OpenDexOrder | undefined;
  private price: number | undefined;
  private updateOrdersTimer: ReturnType<typeof setTimeout> | undefined;
  private buyQuantity = 0;
  private sellQuantity = 0;
  private openDexAssets: Balance[] = [];
  private binanceAssets: Balance[] = [];
  private updatingPrice = false;
  private closed = false;

  constructor(
    { logger, binance, opendex, baseAsset, quoteAsset }:
    {
      logger: Logger,
      opendex: ExchangeBroker,
      binance: ExchangeBroker,
      baseAsset: string,
      quoteAsset: string,
    },
  ) {
    this.logger = logger;
    this.opendex = opendex;
    this.binance = binance;
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
  }

  public start = async () => {
    const binanceTradingPair = `${CURRENCIES.Binance[this.baseAsset]}${CURRENCIES.Binance[this.quoteAsset]}`;
    const openDexTradingPair = `${CURRENCIES.OpenDex[this.baseAsset]}${CURRENCIES.OpenDex[this.quoteAsset]}`;
    await this.binance.getPrice(binanceTradingPair, this.updateBinancePrice.bind(this));
    this.logger.info(`looking for arbitrage trades for ${openDexTradingPair}...`);
  }

  private updateBinancePrice = async (_tradingPair: string, price: number) => {
    if (this.closed) {
      return;
    }
    if (!this.updatingPrice) {
      this.updatingPrice = true;
      // TODO: update order immediately when big price movement happens
      this.price = price;
      if (!this.openDexBuyOrder || !this.openDexSellOrder) {
        await this.createOpenDexOrders();
      }
      this.updatingPrice = false;
    }
  }

  private createOpenDexOrders = async () => {
    const openDexTradingPair = `${CURRENCIES.OpenDex[this.baseAsset]}${CURRENCIES.OpenDex[this.quoteAsset]}`;
    this.logger.info(`creating new orders for ${openDexTradingPair} using price of ${this.price}`);
    if (this.openDexBuyOrder) {
      await this.openDexBuyOrder.cancel();
    }
    if (this.openDexSellOrder) {
      await this.openDexSellOrder.cancel();
    }
    if (this.price) {
      await this.getAssets();
      if (!process.env.MARGIN) {
        throw new Error('environment variable MARGIN is required');
      }
      if (this.buyQuantity < 0.00000001 || this.sellQuantity < 0.00000001) {
        this.logger.warn(`buy quantity of ${this.buyQuantity} and sell quantity of ${this.sellQuantity} do not exceed the minimum required amount - please consider manual rebalancing`);
        await this.close();
        return;
      }
      const ARB_MARGIN = parseFloat(process.env.MARGIN);
      const openDexBuyPrice = parseFloat((this.price - (this.price * ARB_MARGIN)).toFixed(8));
      this.openDexBuyOrder = this.opendex.newOrder({
        orderId: uuidv4(),
        baseAsset: CURRENCIES.OpenDex[this.baseAsset],
        quoteAsset: CURRENCIES.OpenDex[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Buy,
        quantity: this.buyQuantity,
        price: openDexBuyPrice,
      }) as OpenDexOrder;
      this.openDexBuyOrder.on('complete', this.orderComplete.bind(this));
      this.openDexBuyOrder.on('failure', (reason: string) => {
        this.logger.info(`buy order failed: ${reason}`);
      });
      this.openDexBuyOrder.on('fill', () => {
        this.logger.info('buy order partially filled - init trade on Binance');
      });
      const openDexSellPrice = parseFloat((this.price + this.price * ARB_MARGIN).toFixed(8));
      this.openDexSellOrder = this.opendex.newOrder({
        orderId: uuidv4(),
        baseAsset: CURRENCIES.OpenDex[this.baseAsset],
        quoteAsset: CURRENCIES.OpenDex[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Sell,
        quantity: this.sellQuantity,
        price: openDexSellPrice,
      }) as OpenDexOrder;
      this.openDexSellOrder.on('complete', this.orderComplete.bind(this));
      this.openDexSellOrder.on('failure', (reason: string) => {
        this.logger.info(`sell order failed: ${reason}`);
      });
      this.openDexSellOrder.on('fill', () => {
        this.logger.info('sell order partially filled - init trade on Binance');
      });
      this.updateOrdersTimer = setTimeout(this.createOpenDexOrders, ORDER_UPDATE_INTERVAL);
      await Promise.all([
        this.openDexBuyOrder.start(),
        this.openDexSellOrder.start(),
      ]);
    }
  }

  private getAssets = async () => {
    let openDexBaseAssetMaxSell = 0;
    let openDexQuoteAssetMaxBuy = 0;
    if (!this.openDexAssets.length) {
      this.openDexAssets = await this.opendex.getAssets();
    }
    this.openDexAssets.forEach((ownedAsset) => {
      if (
        CURRENCIES.OpenDex[this.baseAsset] === ownedAsset.asset
      ) {
        if (ownedAsset.maxsell) {
          openDexBaseAssetMaxSell = ownedAsset.maxsell;
        }
        this.logger.info(`opendex baseAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked), ${ownedAsset.maxbuy} (maxbuy), ${ownedAsset.maxsell}`);
      } else if (CURRENCIES.OpenDex[this.quoteAsset] === ownedAsset.asset) {
        if (ownedAsset.maxbuy) {
          openDexQuoteAssetMaxBuy = ownedAsset.maxbuy;
        }
        this.logger.info(`opendex quoteAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked), ${ownedAsset.maxbuy} (maxbuy), ${ownedAsset.maxsell}`);
      }
    });
    let binanceBaseAsset = 0;
    let binanceQuoteAsset = 0;
    if (!this.binanceAssets.length) {
      this.binanceAssets = await this.binance.getAssets();
    }
    this.binanceAssets.forEach((ownedAsset) => {
      if (
        CURRENCIES.Binance[this.baseAsset] === ownedAsset.asset
      ) {
        binanceBaseAsset = ownedAsset.free;
        this.logger.info(`binance baseAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked)`);
      } else if (CURRENCIES.Binance[this.quoteAsset] === ownedAsset.asset) {
        binanceQuoteAsset = ownedAsset.free;
        this.logger.info(`binance quoteAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked)`);
      }
    });
    this.sellQuantity = Math.min(openDexBaseAssetMaxSell, binanceBaseAsset);
    if (this.sellQuantity > limits[this.baseAsset]) {
      this.sellQuantity = limits[this.baseAsset];
    }
    this.logger.info(`setting ${this.baseAsset} sell quantity to ${this.sellQuantity}`);
    this.buyQuantity = parseFloat(
      (Math.min(openDexQuoteAssetMaxBuy, binanceQuoteAsset) / this.price!)
        .toFixed(8),
    );
    if (this.buyQuantity > limits[this.quoteAsset]) {
      this.buyQuantity = limits[this.quoteAsset];
    }
    this.logger.info(`setting ${this.quoteAsset} buy quantity to ${this.buyQuantity}`);
  }

  public close = async () => {
    this.closed = true;
    if (this.updateOrdersTimer) {
      clearTimeout(this.updateOrdersTimer);
    }
    const orderCancelPromises: Promise<any>[] = [];
    if (this.openDexBuyOrder) {
      orderCancelPromises.push(this.openDexBuyOrder.cancel());
    }
    if (this.openDexSellOrder) {
      orderCancelPromises.push(this.openDexSellOrder.cancel());
    }
    await Promise.all(orderCancelPromises);
  }

  private orderComplete = async (orderId: string) => {
    // TODO: cancel order update interval when executing asymmetric trades
    this.logger.info(`order ${orderId} was successfully swapped - init trade on Binance`);
    // TODO: update asset allocation cache
    // TODO: logic to handle when limit order isn't filled within a certain timeframe
    if (this.openDexBuyOrder && this.openDexBuyOrder.orderId === orderId) {
      const binanceSellOrder = this.binance.newOrder({
        orderId: uuidv4(),
        baseAsset: CURRENCIES.Binance[this.baseAsset],
        quoteAsset: CURRENCIES.Binance[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Sell,
        quantity: this.openDexBuyOrder['quantity'],
        price: this.price!,
      });
      binanceSellOrder.on('complete', (orderId: string) => {
        this.logger.info(`binance sell order ${orderId} complete - arbitrage trade finished`);
      });
      binanceSellOrder.on('failure', (reason: string) => {
        this.logger.info(`sell order failed: ${reason}`);
      });
      binanceSellOrder.on('fill', () => {
        this.logger.info('sell order partially filled - arbitrage trade complete');
      });
      await binanceSellOrder.start();
    }
    if (this.openDexSellOrder && this.openDexSellOrder.orderId === orderId) {
      const binanceBuyOrder = this.binance.newOrder({
        orderId: uuidv4(),
        baseAsset: CURRENCIES.Binance[this.baseAsset],
        quoteAsset: CURRENCIES.Binance[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Buy,
        quantity: this.openDexSellOrder['quantity'],
        price: this.price!,
      });
      binanceBuyOrder.on('complete', (orderId: string) => {
        this.logger.info(`binance sell order ${orderId} complete - arbitrage trade finished`);
      });
      binanceBuyOrder.on('failure', (reason: string) => {
        this.logger.info(`sell order failed: ${reason}`);
      });
      binanceBuyOrder.on('fill', () => {
        this.logger.info('sell order partially filled - arbitrage trade complete');
      });
      await binanceBuyOrder.start();
    }
  }

}

export { ArbitrageTrade };
