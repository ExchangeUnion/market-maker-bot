import { Observable, combineLatest } from 'rxjs';
import { map, filter, publishBehavior, refCount, tap } from 'rxjs/operators';
import { Config } from '../config';
import { BigNumber } from 'bignumber.js';
import { CentralizedExchangePriceParams } from 'src/centralized/exchange-price';
import { Loggers } from 'src/logger';

type GetTradeInfoParams = {
  config: Config;
  loggers: Loggers;
  openDexAssets$: (config: Config) => Observable<OpenDEXassetAllocation>;
  centralizedExchangeAssets$: (
    config: Config
  ) => Observable<ExchangeAssetAllocation>;
  centralizedExchangePrice$: ({
    config: Config,
  }: CentralizedExchangePriceParams) => Observable<BigNumber>;
  tradeInfoArrayToObject: ([
    openDexAssets,
    centralizedExchangeAssets,
    centralizedExchangePrice,
  ]: TradeInfoArrayToObjectParams) => TradeInfo;
};

type TradeInfo = {
  price: BigNumber;
  assets: AssetAllocation;
};

type AssetAllocation = {
  openDEX: OpenDEXassetAllocation;
  centralizedExchange: ExchangeAssetAllocation;
};

type OpenDEXassetAllocation = ExchangeAssetAllocation & {
  baseAssetMaxsell: BigNumber;
  baseAssetMaxbuy: BigNumber;
  quoteAssetMaxbuy: BigNumber;
  quoteAssetMaxsell: BigNumber;
};

type ExchangeAssetAllocation = {
  baseAssetBalance: BigNumber;
  quoteAssetBalance: BigNumber;
};

type TradeInfoArrayToObjectParams = [
  OpenDEXassetAllocation,
  ExchangeAssetAllocation,
  BigNumber
];

const tradeInfoArrayToObject = ([
  openDEXassets,
  centralizedExchangeAssets,
  centralizedExchangePrice,
]: TradeInfoArrayToObjectParams): TradeInfo => {
  return {
    price: centralizedExchangePrice,
    assets: {
      openDEX: openDEXassets,
      centralizedExchange: centralizedExchangeAssets,
    },
  };
};

const getTradeInfo$ = ({
  config,
  loggers,
  openDexAssets$,
  centralizedExchangeAssets$,
  centralizedExchangePrice$,
  tradeInfoArrayToObject,
}: GetTradeInfoParams): Observable<TradeInfo> => {
  return combineLatest(
    // wait for all the necessary tradeInfo
    openDexAssets$(config),
    centralizedExchangeAssets$(config),
    centralizedExchangePrice$({
      config,
      logger: loggers.centralized,
    }).pipe(tap(price => loggers.centralized.trace(`New price: ${price}`)))
  ).pipe(
    // map it to an object
    map(tradeInfoArrayToObject),
    // emit the last value when subscribed
    publishBehavior((null as unknown) as TradeInfo),
    // make a ConnectableObservable behave like a ordinary observable
    refCount(),
    // ignore initial null value
    filter(v => !!v)
  );
};

export {
  getTradeInfo$,
  tradeInfoArrayToObject,
  GetTradeInfoParams,
  TradeInfo,
  ExchangeAssetAllocation,
  OpenDEXassetAllocation,
};
