import { BigNumber } from 'bignumber.js';
import { Exchange } from 'ccxt';
import { Observable } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { getCentralizedExchangeAssets$ } from '../centralized/assets';
import { Config } from '../config';
import { Loggers } from '../logger';
import { ArbyStore } from '../store';
import {
  GetTradeInfoParams,
  TradeInfo,
  tradeInfoArrayToObject,
} from '../trade/info';
import { getOpenDEXassets$ } from './assets';
import { logAssetBalance, parseOpenDEXassets } from './assets-utils';
import { CreateOpenDEXordersParams } from './create-orders';
import { tradeInfoToOpenDEXorders } from './orders';
import { shouldCreateOpenDEXorders } from './should-create-orders';
import { getXudBalance$ } from './xud/balance';
import { getXudClient$ } from './xud/client';
import { createXudOrder$ } from './xud/create-order';
import { getXudTradingLimits$ } from './xud/trading-limits';

type GetOpenDEXcompleteParams = {
  config: Config;
  loggers: Loggers;
  CEX: Exchange;
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
    store,
  }: CreateOpenDEXordersParams) => Observable<boolean>;
  centralizedExchangePrice$: Observable<BigNumber>;
  store: ArbyStore;
};

const getOpenDEXcomplete$ = ({
  config,
  loggers,
  CEX,
  tradeInfo$,
  createOpenDEXorders$,
  centralizedExchangePrice$,
  store,
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
    CEX,
    tradeInfoArrayToObject,
    openDexAssets$: openDEXassetsWithConfig,
    centralizedExchangeAssets$: getCentralizedExchangeAssets$,
    centralizedExchangePrice$,
  }).pipe(
    // ignore new trade information when creating orders
    // is already in progress
    exhaustMap((tradeInfo: TradeInfo) => {
      const getTradeInfo = () => tradeInfo;
      return createOpenDEXorders$({
        config,
        logger: loggers.opendex,
        getTradeInfo,
        getXudClient$,
        createXudOrder$,
        tradeInfoToOpenDEXorders,
        store,
        shouldCreateOpenDEXorders,
      });
    })
  );
};

export { getOpenDEXcomplete$, GetOpenDEXcompleteParams };
