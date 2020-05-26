import { ExchangeBroker } from '../broker/exchange';
import { Logger } from '../logger';
import { ArbitrageTrade } from './arbitrage-trade';

class TradeManager {
  private logger: Logger;
  private opendex: ExchangeBroker;
  private binance: ExchangeBroker;
  private trades = new Map<string, ArbitrageTrade>();

  constructor(
    { logger, binance, opendex }:
    {
      logger: Logger,
      opendex: ExchangeBroker,
      binance: ExchangeBroker,
    },
  ) {
    this.logger = logger;
    this.opendex = opendex;
    this.binance = binance;
  }

  public start = async () => {
    this.logger.info('starting broker manager...');
    await this.opendex.start();
    await this.binance.start();
    await this.addTrade('ETH', 'BTC');
  }

  public close = async () => {
    const tradeClosePromises: Promise<any>[] = [];
    this.trades.forEach((trade) => {
      tradeClosePromises.push(trade.close());
    });
    await Promise.all(tradeClosePromises);
    await Promise.all([
      this.opendex.close(),
      this.binance.close(),
    ]);
  }

  private addTrade = async (baseAsset: string, quoteAsset: string) => {
    const trade = new ArbitrageTrade({
      baseAsset,
      quoteAsset,
      binance: this.binance,
      opendex: this.opendex,
      logger: this.logger,
    });
    this.trades.set(`${baseAsset}${quoteAsset}`, trade);
    await trade.start();
  }

}

export { TradeManager };
