import { BigNumber } from 'bignumber.js';
import { equals } from 'ramda';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { CentralizedExchangePriceParams } from 'src/centralized/exchange-price';
import { Loggers } from 'src/logger';
import { Config } from '../config';

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
  baseAssetMaxOutbound: BigNumber;
  baseAssetMaxInbound: BigNumber;
  quoteAssetMaxOutbound: BigNumber;
  quoteAssetMaxInbound: BigNumber;
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
    // ignore duplicate values
    distinctUntilChanged((a, b) => equals(a, b))
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
