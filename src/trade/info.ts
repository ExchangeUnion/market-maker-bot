import { Observable, combineLatest } from 'rxjs';
import {
  map,
  filter,
  publishBehavior,
  refCount,
} from 'rxjs/operators';
import { Config } from '../config';
import { BigNumber } from 'bignumber.js';

type GetTradeInfoParams = {
  config: Config,
  openDexAssets$: (config: Config) => Observable<ExchangeAssetAllocation>
  centralizedExchangeAssets$: (config: Config) => Observable<ExchangeAssetAllocation>
  centralizedExchangePrice$: (config: Config) => Observable<BigNumber>
  tradeInfoArrayToObject: ([
    openDexAssets,
    centralizedExchangeAssets,
    centralizedExchangePrice,
  ]: TradeInfoArrayToObjectParams) => TradeInfo
};

type TradeInfo = {
  price: BigNumber;
  assets: AssetAllocation,
};

type AssetAllocation = {
  openDex: ExchangeAssetAllocation,
  centralizedExchange: ExchangeAssetAllocation,
};

type ExchangeAssetAllocation = {
  baseAssetBalance: BigNumber;
  quoteAssetBalance: BigNumber;
};

type TradeInfoArrayToObjectParams = [
  ExchangeAssetAllocation,
  ExchangeAssetAllocation,
  BigNumber
];

const tradeInfoArrayToObject = ([
  openDexAssets,
  centralizedExchangeAssets,
  centralizedExchangePrice,
]: TradeInfoArrayToObjectParams
): TradeInfo => {
  return {
    price: centralizedExchangePrice,
    assets: {
      openDex: openDexAssets,
      centralizedExchange: centralizedExchangeAssets,
    }
  };
};

const getTradeInfo$ = (
  {
    config,
    openDexAssets$,
    centralizedExchangeAssets$,
    centralizedExchangePrice$,
    tradeInfoArrayToObject,
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
  getTradeInfo$,
  GetTradeInfoParams,
  TradeInfo,
  ExchangeAssetAllocation,
};
