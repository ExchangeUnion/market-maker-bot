import { ExchangeBroker } from '../broker/exchange';
import { Logger, Loggers } from '../logger';
import { ArbitrageTrade } from './arbitrage-trade';
import { ExchangeType } from '../enums';
import { Observable, combineLatest, of, from } from 'rxjs';
import {
  distinctUntilChanged,
  tap,
  map,
  mergeMap,
  concatMap,
  concatMapTo,
  switchMap,
  exhaustMap,
  filter,
  publishBehavior,
  refCount,
  // concatMapTo,
  takeUntil,
  repeat,
  take,
} from 'rxjs/operators';
import { Config } from '../config';
import { BigNumber } from 'bignumber.js';
import {
  logAssetBalance,
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
  getOpenDEXorders$,
  getOpenDEXorderFilled$,
} from '../opendex/opendex';
import {
  getXudClient$,
  getXudBalance$,
} from '../opendex/xud-client';

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

const getTrade$ = (config: Config): Observable<string> => {
  return new Observable(subscriber => {
    const loggers = Logger.createLoggers(
      config.LOG_LEVEL,
      `${config.DATA_DIR}/arby.log`,
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

type ExchangeAssetAllocation = {
  baseAssetBalance: BigNumber;
  quoteAssetBalance: BigNumber;
};

type AssetAllocation = {
  openDex: ExchangeAssetAllocation,
  centralizedExchange: ExchangeAssetAllocation,
};

type TradeInfo = {
  price: BigNumber;
  assets: AssetAllocation,
};

const tradeInfoArrayToObject = ([
  openDexAssets,
  centralizedExchangeAssets,
  centralizedExchangePrice,
]: [
  ExchangeAssetAllocation,
  ExchangeAssetAllocation,
  BigNumber
]): TradeInfo => {
  return {
    price: centralizedExchangePrice,
    assets: {
      openDex: openDexAssets,
      centralizedExchange: centralizedExchangeAssets,
    }
  };
};

type GetOpenDEXcompleteParams = {
  config: Config,
  logger: Logger,
  tradeInfo$: (
    {
      config,
      openDexAssets$,
      centralizedExchangeAssets$,
      centralizedExchangePrice$,
    }: GetTradeInfoParams
  ) => Observable<TradeInfo>
  openDEXorders$: (config: Config, tradeInfo: TradeInfo) => Observable<boolean>
  openDEXorderFilled$: (config: Config) => Observable<boolean>
};

const getOpenDEXcomplete$ = (
  {
    config,
    logger,
    tradeInfo$,
    openDEXorders$,
    openDEXorderFilled$,
  }: GetOpenDEXcompleteParams
): Observable<boolean> => {
  const openDEXassetsWithConfig = (config: Config) => {
    return getOpenDEXassets$({
      config,
      logger,
      logBalance: logAssetBalance,
      xudClient$: getXudClient$,
      xudBalance$: getXudBalance$,
      xudBalanceToExchangeAssetAllocation,
    });
  };
  const getCentralizedExchangeAssets$ = (config: Config) => {
    return of({
      baseAssetBalance: new BigNumber('123'),
      quoteAssetBalance: new BigNumber('321'),
    });
  };
  const getCentralizedExchangePrice$ = (config: Config) => {
    return of(new BigNumber('10000'));
  };
  return tradeInfo$({
    config,
    openDexAssets$: openDEXassetsWithConfig,
    centralizedExchangeAssets$: getCentralizedExchangeAssets$,
    centralizedExchangePrice$: getCentralizedExchangePrice$,
  }).pipe(
    // only continue processing if trade information
    // has changed
    distinctUntilChanged(),
    // ignore new trade information when creating orders
    // is already in progress
    exhaustMap((tradeInfo: TradeInfo) =>
      // create orders based on latest trade info
      openDEXorders$(config, tradeInfo)
    ),
    // wait for the order to be filled
    takeUntil(openDEXorderFilled$(config)),
  );
};

type GetTradeParams = {
  config: Config
  loggers: Loggers,
  getOpenDEXcomplete$: (
    { config, logger }: GetOpenDEXcompleteParams
  ) => Observable<boolean>
  centralizedExchangeOrder$: (config: Config) => Observable<boolean>
  shutdown$: Observable<unknown>
}

const getNewTrade$ = (
  {
    config,
    loggers,
    centralizedExchangeOrder$,
    getOpenDEXcomplete$,
    shutdown$,
  }: GetTradeParams
): Observable<boolean> => {
  return getOpenDEXcomplete$({
    config,
    logger: loggers.opendex,
    tradeInfo$: getTradeInfo$,
    openDEXorders$: getOpenDEXorders$,
    openDEXorderFilled$: getOpenDEXorderFilled$,
  }).pipe(
    concatMapTo(centralizedExchangeOrder$(config)),
    repeat(),
    takeUntil(shutdown$),
  );
};

type GetTradeInfoParams = {
  config: Config,
  openDexAssets$: (config: Config) => Observable<ExchangeAssetAllocation>
  centralizedExchangeAssets$: (config: Config) => Observable<ExchangeAssetAllocation>
  centralizedExchangePrice$: (config: Config) => Observable<BigNumber>
};

const getTradeInfo$ = (
  {
    config,
    openDexAssets$,
    centralizedExchangeAssets$,
    centralizedExchangePrice$,
  }: GetTradeInfoParams
): Observable<TradeInfo> => {
  return combineLatest(
    // wait for all the necessary tradeInfo
    openDexAssets$(config),
    centralizedExchangeAssets$(config),
    centralizedExchangePrice$(config)
  ).pipe(
    // map it to an object
    map(tradeInfoArrayToObject),
    // emit the last value when subscribed
    publishBehavior(null as unknown as TradeInfo),
    // make a ConnectableObservable behave like a ordinary observable
    refCount(),
    // ignore initial null value
    filter(v => !!v),
  );
};

export {
  getNewTrade$,
  getTrade$,
  getTradeInfo$,
  getOpenDEXcomplete$,
  TradeManager,
  TradeInfo,
  ExchangeAssetAllocation,
  GetTradeParams,
};
