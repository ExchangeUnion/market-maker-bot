import { Config } from '../config';
import { Logger } from '../logger';
import { TradeInfo, GetTradeInfoParams } from '../trade/manager';
import { Observable, of } from 'rxjs';
import {
  logAssetBalance,
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
} from '../opendex/opendex';
import {
  distinctUntilChanged,
  exhaustMap,
  takeUntil,
} from 'rxjs/operators';
import {
  getXudClient$,
  getXudBalance$,
} from '../opendex/xud-client';
import { BigNumber } from 'bignumber.js';

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

export {
  getOpenDEXcomplete$,
  GetOpenDEXcompleteParams,
};
