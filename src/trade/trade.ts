import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';
import { merge, Observable } from 'rxjs';
import { ignoreElements, mapTo, repeat, takeUntil, tap } from 'rxjs/operators';
import { deriveCEXorderQuantity } from '../centralized/derive-order-quantity';
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
    }: GetCleanupParams) => Observable<unknown>,
    CEX: Exchange
  ) => (source: Observable<any>) => Observable<any>;
  getCentralizedExchangePrice$: ({
    logger,
    config,
  }: CentralizedExchangePriceParams) => Observable<BigNumber>;
  CEX: Exchange;
};

const getNewTrade$ = ({
  config,
  loggers,
  getCentralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
  catchOpenDEXerror,
  getCentralizedExchangePrice$,
  CEX,
}: GetTradeParams): Observable<boolean> => {
  const centralizedExchangePrice$ = getCentralizedExchangePrice$({
    config,
    logger: loggers.centralized,
  });
  return merge(
    getOpenDEXcomplete$({
      config,
      CEX,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
      centralizedExchangePrice$,
    }).pipe(
      catchOpenDEXerror(loggers, config, getCleanup$, CEX),
      ignoreElements()
    ),
    getCentralizedExchangeOrder$({
      CEX,
      logger: loggers.centralized,
      config,
      getOrderBuilder$,
      executeCEXorder$,
      centralizedExchangePrice$,
      deriveCEXorderQuantity,
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
