import { concat, Observable, throwError, timer } from 'rxjs';
import {
  catchError,
  ignoreElements,
  mergeMapTo,
  repeat,
  takeUntil,
} from 'rxjs/operators';
import { ExchangeBroker } from '../broker/exchange';
import { Config } from '../config';
import { XUD_RECONNECT_INTERVAL } from '../constants';
import { ExchangeType } from '../enums';
import { Logger, Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
import { errorCodes } from '../opendex/errors';
import { getOpenDEXorderFilled$ } from '../opendex/order-filled';
import { ArbitrageTrade } from './arbitrage-trade';
import { getTradeInfo$, TradeInfo } from './info';

class TradeManager {
  private logger: Logger;
  private opendex: ExchangeBroker;
  private binance: ExchangeBroker;
  private trades = new Map<string, ArbitrageTrade>();

  constructor({
    logger,
    binance,
    opendex,
  }: {
    logger: Logger;
    opendex: ExchangeBroker;
    binance: ExchangeBroker;
  }) {
    this.logger = logger;
    this.opendex = opendex;
    this.binance = binance;
  }

  public start = async () => {
    this.logger.info('starting broker manager...');
    await this.opendex.start();
    await this.binance.start();
    await this.addTrade('ETH', 'BTC');
  };

  public close = async () => {
    const tradeClosePromises: Promise<any>[] = [];
    this.trades.forEach(trade => {
      tradeClosePromises.push(trade.close());
    });
    await Promise.all(tradeClosePromises);
    await Promise.all([this.opendex.close(), this.binance.close()]);
  };

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
  };
}

const getTrade$ = (config: Config): Observable<string> => {
  return new Observable(subscriber => {
    const loggers = Logger.createLoggers(
      config.LOG_LEVEL,
      `${config.DATA_DIR}/arby.log`
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

type GetTradeParams = {
  config: Config;
  loggers: Loggers;
  getOpenDEXcomplete$: ({
    config,
    loggers,
  }: GetOpenDEXcompleteParams) => Observable<boolean>;
  centralizedExchangeOrder$: (config: Config) => Observable<boolean>;
  shutdown$: Observable<unknown>;
};

const getNewTrade$ = ({
  config,
  loggers,
  centralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
}: GetTradeParams): Observable<boolean> => {
  return concat(
    getOpenDEXcomplete$({
      config,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
      openDEXorderFilled$: getOpenDEXorderFilled$,
    }).pipe(ignoreElements()),
    centralizedExchangeOrder$(config)
  ).pipe(
    catchError((e, caught) => {
      // check if we're dealing with an error that
      // can be recovered from
      if (
        e.code === errorCodes.XUD_UNAVAILABLE ||
        e.code === errorCodes.XUD_CLIENT_INVALID_CERT ||
        e.code === errorCodes.BALANCE_MISSING ||
        e.code === errorCodes.TRADING_LIMITS_MISSING ||
        e.code === errorCodes.INVALID_ORDERS_LIST
      ) {
        loggers.opendex.warn(
          `${e.message}. Retrying in ${XUD_RECONNECT_INTERVAL} seconds.`
        );
        // retry after interval
        return timer(XUD_RECONNECT_INTERVAL * 1000).pipe(mergeMapTo(caught));
      }
      // unexpected or unrecoverable error should stop
      // the application
      return throwError(e);
    }),
    repeat(),
    takeUntil(shutdown$)
  );
};

export { getNewTrade$, getTrade$, TradeManager, TradeInfo, GetTradeParams };
