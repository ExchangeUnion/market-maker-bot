import { Logger } from '../logger';
import { ExchangeBroker } from '../broker/exchange';
import uuidv4 from 'uuid/v4';
import { OrderSide, OrderType } from '../enums';
import { OpenDexOrder } from '../broker/opendex/order';
import { Balance } from '../broker/api';
import { satsToCoinsStr } from '../utils';
import { BigNumber } from 'bignumber.js';
import { Subscription } from 'rxjs';

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
    ETH: 'ETH',
  },
  Binance: {
    LTC: 'LTC',
    BTC: 'BTC',
    USD: 'USDT',
    ETH: 'ETH',
  },
};

/** Order size limits */
const limits: { [currency: string]: BigNumber } = {
  BTC: new BigNumber('0.00100000'),
  LTC: new BigNumber('0.15000000'),
  ETH: new BigNumber('0.05'),
  USD: new BigNumber('10'),
};

class ArbitrageTrade {
  private logger: Logger;
  private baseAsset: string;
  private quoteAsset: string;
  private opendex: ExchangeBroker;
  private binance: ExchangeBroker;
  private openDexBuyOrder: OpenDexOrder | undefined;
  private openDexSellOrder: OpenDexOrder | undefined;
  private price: BigNumber | undefined;
  private updateOrdersTimer: ReturnType<typeof setTimeout> | undefined;
  private buyQuantity = new BigNumber('0');
  private sellQuantity = new BigNumber('0');
  private openDexAssets: Balance[] = [];
  private binanceAssets: Balance[] = [];
  private updatingPrice = false;
  private closed = false;
  private binancePriceSubscription: Subscription | undefined;
  private countdown$: Subscription | undefined;

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

    this.binancePriceSubscription = this.binance.getPrice(binanceTradingPair)
      // TODO: cancel all OpenDEX orders if the price stream is silent for too long
      .subscribe({
        next: (price: BigNumber) => {
          this.updateBinancePrice(price);
        },
      });

    this.logger.info(`looking for arbitrage trades for ${openDexTradingPair}...`);
  }

  private updateBinancePrice = async (price: BigNumber) => {
    if (this.closed) {
      return;
    }
    // TODO: update order immediately when big price movement happens
    if (!this.updatingPrice) {
      this.updatingPrice = true;
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
      if (this.buyQuantity.isLessThan(new BigNumber('0.00000001')) ||
        this.sellQuantity.isLessThan(new BigNumber('0.00000001'))
      ) {
        this.logger.warn(`buy quantity of ${this.buyQuantity} and sell quantity of ${this.sellQuantity} do not exceed the minimum required amount - please consider manual rebalancing`);
        await this.close();
        return;
      }
      const ARB_MARGIN = new BigNumber(process.env.MARGIN);
      const priceSpread = this.price.multipliedBy(ARB_MARGIN);
      const openDexBuyPrice = this.price.minus(priceSpread);
      this.openDexBuyOrder = this.opendex.newOrder({
        orderId: uuidv4(),
        baseAsset: CURRENCIES.OpenDex[this.baseAsset],
        quoteAsset: CURRENCIES.OpenDex[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Buy,
        quantity: new BigNumber(this.buyQuantity.toFixed(8)).toNumber(), // change the API to accept string instead
        price: openDexBuyPrice.toNumber(), // change the API to accept string instead
      }) as OpenDexOrder;
      this.openDexBuyOrder.on('complete', this.orderComplete.bind(this));
      this.openDexBuyOrder.on('failure', (reason: string) => {
        this.logger.info(`buy order failed: ${reason}`);
      });
      this.openDexBuyOrder.on('fill', () => {
        this.logger.info('buy order partially filled - init trade on Binance');
      });
      const openDexSellPrice = this.price.plus(priceSpread);
      this.openDexSellOrder = this.opendex.newOrder({
        orderId: uuidv4(),
        baseAsset: CURRENCIES.OpenDex[this.baseAsset],
        quoteAsset: CURRENCIES.OpenDex[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Sell,
        quantity: new BigNumber(this.sellQuantity.toFixed(8)).toNumber(), // change the API to accept string instead
        price: openDexSellPrice.toNumber(), // change the API to accept string instead
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
    let openDexBaseAssetMaxSell = new BigNumber('0');
    let openDexQuoteAssetMaxBuy = new BigNumber('0');
    this.openDexAssets = await this.opendex.getAssets();
    this.openDexAssets.forEach((ownedAsset) => {
      if (
        CURRENCIES.OpenDex[this.baseAsset] === ownedAsset.asset
      ) {
        if (ownedAsset.maxsell) {
          openDexBaseAssetMaxSell = new BigNumber(
            satsToCoinsStr(ownedAsset.maxsell),
          );
        }
        this.logger.info(`opendex baseAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked), ${ownedAsset.maxbuy} (maxbuy), ${ownedAsset.maxsell}`);
      } else if (CURRENCIES.OpenDex[this.quoteAsset] === ownedAsset.asset) {
        if (ownedAsset.maxbuy) {
          openDexQuoteAssetMaxBuy = new BigNumber(
            satsToCoinsStr(ownedAsset.maxbuy),
          );
        }
        this.logger.info(`opendex quoteAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked), ${ownedAsset.maxbuy} (maxbuy), ${ownedAsset.maxsell}`);
      }
    });
    let binanceBaseAsset = new BigNumber('0');
    let binanceQuoteAsset = new BigNumber('0');
    if (!this.binanceAssets.length) {
      this.binanceAssets = await this.binance.getAssets();
    }
    this.binanceAssets.forEach((ownedAsset) => {
      if (
        CURRENCIES.Binance[this.baseAsset] === ownedAsset.asset
      ) {
        binanceBaseAsset = new BigNumber(ownedAsset.free);
        this.logger.info(`binance baseAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked)`);
      } else if (CURRENCIES.Binance[this.quoteAsset] === ownedAsset.asset) {
        binanceQuoteAsset = new BigNumber(ownedAsset.free);
        this.logger.info(`binance quoteAsset ${ownedAsset.asset}: ${ownedAsset.free} (free), ${ownedAsset.locked} (locked)`);
      }
    });
    this.sellQuantity = BigNumber.minimum(openDexBaseAssetMaxSell, binanceBaseAsset);
    if (this.sellQuantity.isGreaterThan(limits[this.baseAsset])) {
      this.sellQuantity = limits[this.baseAsset];
    }
    this.logger.info(`setting ${this.baseAsset} sell quantity to ${this.sellQuantity}`);
    this.buyQuantity =
      (BigNumber.minimum(openDexQuoteAssetMaxBuy, binanceQuoteAsset).dividedBy(this.price!));
    if (this.buyQuantity > limits[this.quoteAsset]) {
      this.buyQuantity = limits[this.quoteAsset];
    }
    this.logger.info(`setting ${this.quoteAsset} buy quantity to ${this.buyQuantity}`);
  }

  public close = async () => {
    this.closed = true;
    if (this.countdown$) {
      this.countdown$.unsubscribe();
    }
    if (this.binancePriceSubscription) {
      this.binancePriceSubscription.unsubscribe();
    }
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

  private orderComplete = async (orderId: string, quantity: number) => {
    // TODO: cancel order update interval when executing asymmetric trades
    // TODO: logic to handle when limit order isn't filled within a certain timeframe
    const quantityInCoins = new BigNumber(
      satsToCoinsStr(quantity),
    );
    if (quantityInCoins.isLessThan(limits[this.baseAsset])) {
      this.logger.warn(`skipping asymmetric trade because quantity of ${quantityInCoins} is smaller than minimum allowed ${limits[this.baseAsset]}`);
      return;
    }
    this.logger.info(`order ${orderId} was successfully swapped - init trade on Binance`);
    if (this.openDexBuyOrder && this.openDexBuyOrder.orderId === orderId) {
      const binanceSellOrder = this.binance.newOrder({
        quantity: quantityInCoins.toNumber(), // change the API to accept string instead
        orderId: uuidv4(),
        baseAsset: CURRENCIES.Binance[this.baseAsset],
        quoteAsset: CURRENCIES.Binance[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Sell,
        price: this.price!.toNumber(), // change the API to accept string instead
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
        quantity: quantityInCoins.toNumber(), // change the API to accept string instead
        orderId: uuidv4(),
        baseAsset: CURRENCIES.Binance[this.baseAsset],
        quoteAsset: CURRENCIES.Binance[this.quoteAsset],
        orderType: OrderType.Limit,
        orderSide: OrderSide.Buy,
        price: this.price!.toNumber(), // change the API to accept string instead
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
