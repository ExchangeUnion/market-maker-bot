import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { Config } from '../config';
import { Loggers } from '../logger';
import {
  GetTradeInfoParams,
  TradeInfo,
  tradeInfoArrayToObject,
} from '../trade/info';
import { getOpenDEXassets$ } from './assets';
import { logAssetBalance, parseOpenDEXassets } from './assets-utils';
import { CreateOpenDEXordersParams } from './create-orders';
import { tradeInfoToOpenDEXorders } from './orders';
import { removeOpenDEXorders$ } from './remove-orders';
import { getXudBalance$ } from './xud/balance';
import { getXudClient$ } from './xud/client';
import { createXudOrder$ } from './xud/create-order';
import { getXudTradingLimits$ } from './xud/trading-limits';
import { getCentralizedExchangeAssets$ } from '../centralized/assets';

type GetOpenDEXcompleteParams = {
  config: Config;
  loggers: Loggers;
  tradeInfo$: ({
    config,
    openDexAssets$,
    centralizedExchangeAssets$,
    centralizedExchangePrice$,
  }: GetTradeInfoParams) => Observable<TradeInfo>;
  createOpenDEXorders$: ({
    config,
    logger,
    getTradeInfo,
    tradeInfoToOpenDEXorders,
    getXudClient$,
    createXudOrder$,
  }: CreateOpenDEXordersParams) => Observable<boolean>;
  centralizedExchangePrice$: Observable<BigNumber>;
};

const getOpenDEXcomplete$ = ({
  config,
  loggers,
  tradeInfo$,
  createOpenDEXorders$,
  centralizedExchangePrice$,
}: GetOpenDEXcompleteParams): Observable<boolean> => {
  const openDEXassetsWithConfig = (config: Config) => {
    return getOpenDEXassets$({
      config,
      logger: loggers.opendex,
      parseOpenDEXassets,
      logBalance: logAssetBalance,
      xudClient$: getXudClient$,
      xudBalance$: getXudBalance$,
      xudTradingLimits$: getXudTradingLimits$,
    });
  };
  return tradeInfo$({
    config,
    loggers,
    tradeInfoArrayToObject,
    openDexAssets$: openDEXassetsWithConfig,
    centralizedExchangeAssets$: getCentralizedExchangeAssets$,
    centralizedExchangePrice$,
  }).pipe(
    // ignore new trade information when creating orders
    // is already in progress
    exhaustMap((tradeInfo: TradeInfo) => {
      const getTradeInfo = () => {
        return tradeInfo;
      };
      // create orders based on latest trade info
      return createOpenDEXorders$({
        config,
        logger: loggers.opendex,
        getTradeInfo,
        getXudClient$,
        createXudOrder$,
        removeOpenDEXorders$,
        tradeInfoToOpenDEXorders,
      });
    })
  );
};

export { getOpenDEXcomplete$, GetOpenDEXcompleteParams };
