import { ExchangeBroker } from '../broker/exchange';
import { Logger } from '../logger';
import { ArbitrageTrade } from './arbitrage-trade';
import { ExchangeType } from '../enums';
import { Observable } from 'rxjs';
import { Config } from '../config';

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

const startTradeManager = (config: Config): Observable<string> => {
  return new Observable(subscriber => {
    const loggers = Logger.createLoggers(
      config.LOG_LEVEL,
      config.LOG_PATH,
    );
    loggers.global.info('Starting. Hello, Arby.');
    const openDexBroker = new ExchangeBroker({
      exchange: ExchangeType.OpenDEX,
      logger: loggers.opendex,
      certPath: process.env.OPENDEX_CERT_PATH,
      rpchost: process.env.OPENDEX_RPC_HOST,
      rpcport: parseInt(process.env.OPENDEX_RPC_PORT!, 10),
    });
    const binanceBroker = new ExchangeBroker({
      exchange: ExchangeType.Binance,
      logger: loggers.binance,
      apiKey: process.env.BINANCE_API_KEY,
      apiSecret: process.env.BINANCE_API_SECRET,
    });
    const tradeManager = new TradeManager({
      logger: loggers.trademanager,
      opendex: openDexBroker,
      binance: binanceBroker,
    });
    tradeManager.start();
    subscriber.next('Arby boot sequence complete.');
    return async () => {
      await tradeManager.close();
      loggers.global.info('Shutdown complete. Goodbye, Arby.');
    };
  }) as Observable<string>;
};


export { startTradeManager, TradeManager };
