import { BigNumber } from 'bignumber.js';
import { interval, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  exhaustMap,
  map,
  mapTo,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import {
  getOpenDEXassets$,
  logAssetBalance,
  xudBalanceToExchangeAssetAllocation,
} from '../opendex/opendex';
import { getXudBalance$, getXudClient$ } from './xud/client';
import { GetTradeInfoParams, tradeInfoArrayToObject } from '../trade/info';
import { TradeInfo } from '../trade/manager';

type GetOpenDEXcompleteParams = {
  config: Config;
  logger: Logger;
  tradeInfo$: ({
    config,
    openDexAssets$,
    centralizedExchangeAssets$,
    centralizedExchangePrice$,
  }: GetTradeInfoParams) => Observable<TradeInfo>;
  openDEXorders$: (config: Config, tradeInfo: TradeInfo) => Observable<boolean>;
  openDEXorderFilled$: (config: Config) => Observable<boolean>;
};

const getOpenDEXcomplete$ = ({
  config,
  logger,
  tradeInfo$,
  openDEXorders$,
  openDEXorderFilled$,
}: GetOpenDEXcompleteParams): Observable<boolean> => {
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
    return interval(1000).pipe(
      mapTo({
        baseAssetBalance: new BigNumber('123'),
        quoteAssetBalance: new BigNumber('321'),
      })
    );
  };
  const getCentralizedExchangePrice$ = (config: Config) => {
    return interval(100).pipe(
      map((v: number) => new BigNumber(`${v + 1}0000`)),
      tap(v => console.log(`New price ${v}`))
    );
  };
  return tradeInfo$({
    config,
    tradeInfoArrayToObject,
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
    takeUntil(openDEXorderFilled$(config))
  );
};

export { getOpenDEXcomplete$, GetOpenDEXcompleteParams };
