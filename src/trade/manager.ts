import { ExchangeBroker } from '../broker/exchange';
import { Logger } from '../logger';
import { ArbitrageTrade } from './arbitrage-trade';
import { ExchangeType } from '../enums';
import { Observable, combineLatest, of, from } from 'rxjs';
import {
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

const getOpenDEXcomplete$ = (
  {
    config,
    tradeInfo$,
    openDEXorders$,
    openDEXorderFilled$,
  }:
  {
    config: Config,
    tradeInfo$: Observable<TradeInfo>
    openDEXorders$: (config: Config, tradeInfo: TradeInfo) => Observable<boolean>
    openDEXorderFilled$: (config: Config) => Observable<boolean>
  },
): Observable<boolean> => {
  return tradeInfo$.pipe(
    // process it in order
    concatMap((tradeInfo: TradeInfo) =>
      // create orders based on latest trade info
      openDEXorders$(config, tradeInfo)
    ),
    // wait for the order to be filled
    mergeMap(() => openDEXorderFilled$(config)),
    take(1),
  );
};

const getNewTrade$ = (
  {
    config,
    centralizedExchangeOrder$,
    openDEXcomplete$,
    shutdown$,
  }: {
    config: Config
    openDEXcomplete$: Observable<boolean>
    centralizedExchangeOrder$: (config: Config) => Observable<boolean>
    shutdown$: Observable<string>
  }
): Observable<boolean> => {
  return openDEXcomplete$.pipe(
    concatMapTo(centralizedExchangeOrder$(config)),
    repeat(),
    takeUntil(shutdown$),
  );
};

const getTradeInfo$ = (
  {
    config,
    openDexAssets$,
    centralizedExchangeAssets$,
    centralizedExchangePrice$,
  }:
  {
    config: Config,
    openDexAssets$: (config: Config) => Observable<ExchangeAssetAllocation>
    centralizedExchangeAssets$: (config: Config) => Observable<ExchangeAssetAllocation>
    centralizedExchangePrice$: (config: Config) => Observable<BigNumber>
  }
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
};
