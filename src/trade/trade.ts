import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';
import { merge, Observable } from 'rxjs';
import { ignoreElements, mapTo, repeat, takeUntil, tap } from 'rxjs/operators';
import { getExchange } from '../centralized/ccxt/exchange';
import { InitBinanceParams } from '../centralized/ccxt/init';
import { loadMarkets$ } from '../centralized/ccxt/load-markets';
import { CentralizedExchangePriceParams } from '../centralized/exchange-price';
import { executeCEXorder$ } from '../centralized/execute-order';
import { GetCentralizedExchangeOrderParams } from '../centralized/order';
import { getOrderBuilder$ } from '../centralized/order-builder';
import { Config } from '../config';
import { Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
import { getCleanup$, GetCleanupParams } from './cleanup';
import { getTradeInfo$ } from './info';

type GetTradeParams = {
  config: Config;
  loggers: Loggers;
  getOpenDEXcomplete$: ({
    config,
    loggers,
  }: GetOpenDEXcompleteParams) => Observable<boolean>;
  getCentralizedExchangeOrder$: ({
    logger,
    config,
    getOrderBuilder$,
    executeCEXorder$,
  }: GetCentralizedExchangeOrderParams) => Observable<null>;
  shutdown$: Observable<unknown>;
  catchOpenDEXerror: (
    loggers: Loggers,
    config: Config,
    getCleanup$: ({
      config,
      loggers,
      removeOpenDEXorders$,
      removeCEXorders$,
    }: GetCleanupParams) => Observable<unknown>
  ) => (source: Observable<any>) => Observable<any>;
  getCentralizedExchangePrice$: ({
    logger,
    config,
  }: CentralizedExchangePriceParams) => Observable<BigNumber>;
  initBinance$: ({
    getExchange,
    config,
    loadMarkets$,
  }: InitBinanceParams) => Observable<Exchange>;
};

const getNewTrade$ = ({
  config,
  loggers,
  getCentralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
  catchOpenDEXerror,
  getCentralizedExchangePrice$,
  initBinance$,
}: GetTradeParams): Observable<boolean> => {
  const centralizedExchangePrice$ = getCentralizedExchangePrice$({
    config,
    logger: loggers.centralized,
  });
  const CEX = initBinance$({
    config,
    loadMarkets$,
    getExchange,
  });
  return merge(
    getOpenDEXcomplete$({
      config,
      CEX,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
      centralizedExchangePrice$,
    }).pipe(catchOpenDEXerror(loggers, config, getCleanup$), ignoreElements()),
    getCentralizedExchangeOrder$({
      CEX,
      logger: loggers.centralized,
      config,
      getOrderBuilder$,
      executeCEXorder$,
      centralizedExchangePrice$,
    })
  ).pipe(
    tap(() => {
      loggers.global.info('Trade complete');
    }),
    mapTo(true),
    repeat(),
    takeUntil(shutdown$)
  );
};

export { getNewTrade$, GetTradeParams };
