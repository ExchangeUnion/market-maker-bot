import { Logger } from '../logger';
import { Balance } from '../broker/api';
import { ExchangeBroker } from '../broker/exchange';
import { BalancerTrade, BalancerOrder } from '../trade/balancer-trade';
import { v4 as uuidv4 } from 'uuid';
import { OrderType } from '../enums';
import { OpenDexOrder } from '../broker/opendex/order';

class BalancerTradeManager {
  private logger: Logger;
  private opendex: ExchangeBroker;
  private assets: Balance[] | undefined;
  private trades = new Map<string, BalancerTrade>();
  private updateAssetsTimer: ReturnType<typeof setTimeout> | undefined;
  private orderTimeout: ReturnType<typeof setTimeout> | undefined;
  private activeOrder?: OpenDexOrder;
  private static UPDATE_ASSETS_INTERVAL = 10000;

  constructor(
    { logger, opendex }:
    {
      logger: Logger,
      opendex: ExchangeBroker,
    },
  ) {
    this.logger = logger;
    this.opendex = opendex;
  }

  public start = async () => {
    await this.opendex.start();
    this.assets = await this.opendex.getAssets();
    this.updateAssetsTimer = setTimeout(this.updateAssets, BalancerTradeManager.UPDATE_ASSETS_INTERVAL);
    await this.addTrade('LTC', 'BTC');
    this.logger.info('Balancer Trade Manager started.');
  }

  private updateAssets = async () => {
    this.assets = await this.opendex.getAssets();
    this.trades.forEach((trade) => {
      const baseAssetBalance = this.getBalanceForAsset(trade.baseAsset);
      trade.setAssets(baseAssetBalance);
    });
    this.updateAssetsTimer = setTimeout(this.updateAssets, BalancerTradeManager.UPDATE_ASSETS_INTERVAL);
  }

  private getBalanceForAsset = (asset: string): Balance => {
    if (!this.assets) {
      throw new Error('cannot get balance for asset before asset balances have been fetched');
    }
    const assetBalance = this.assets
      .filter((balance) => {
        return balance.asset === asset;
      });
    if (assetBalance.length !== 1) {
      throw new Error('cannot add a trade with unknown baseAssetBalanace');
    }
    return assetBalance[0];
  }

  private addTrade = async (baseAsset: string, quoteAsset: string) => {
    const trade = new BalancerTrade({
      baseAsset,
      quoteAsset,
      baseAssetBalance: this.getBalanceForAsset(baseAsset),
      logger: this.logger,
    });
    this.trades.set(`${baseAsset}${quoteAsset}`, trade);
    trade.on('order', this.handleOrder);
    await trade.start();
  }

  private handleOrder = async (balancerOrder: BalancerOrder) => {
    this.logger.info(`need to rebalance, received order ${JSON.stringify(balancerOrder)}`);
    if (this.activeOrder) {
      this.logger.warn('ignoring rebalance request because active order exists');
      return;
    }
    const openDexOrder = {
      orderId: uuidv4(),
      baseAsset: balancerOrder.baseAsset,
      quoteAsset: balancerOrder.quoteAsset,
      orderType: OrderType.Market,
      orderSide: balancerOrder.orderSide,
      quantity: balancerOrder.quantity,
      price: 'mkt',
    };
    this.activeOrder = this.opendex.newOrder(openDexOrder) as OpenDexOrder;
    this.orderTimeout = setTimeout(() => {
      this.logger.info('order timed out - resetting active order');
      this.activeOrder = undefined;
    }, 30000);
    this.activeOrder.on('complete', () => {
      this.logger.info('order complete');
      this.orderTimeout && clearTimeout(this.orderTimeout);
      this.activeOrder = undefined;
    });
    this.activeOrder.on('failure', (reason: string) => {
      this.logger.info(`order failed: ${reason}`);
      this.orderTimeout && clearTimeout(this.orderTimeout);
      this.activeOrder = undefined;
    });
    this.activeOrder.on('fill', () => {
      this.logger.info('order partially filled');
      this.orderTimeout && clearTimeout(this.orderTimeout);
      this.activeOrder = undefined;
    });
    this.activeOrder.start();
  }

  public close = async () => {
    if (this.updateAssetsTimer) {
      clearTimeout(this.updateAssetsTimer);
    }
    if (this.orderTimeout) {
      clearTimeout(this.orderTimeout);
    }
    const tradeClosePromises: Promise<any>[] = [];
    this.trades.forEach((trade) => {
      tradeClosePromises.push(trade.close());
    });
    await Promise.all(tradeClosePromises);
    await this.opendex.close();
    this.logger.info('Balancer Trade Manager closed.');
  }
}

export { BalancerTradeManager };
