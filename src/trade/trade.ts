import BigNumber from 'bignumber.js';
import { merge, Observable } from 'rxjs';
import { ignoreElements, mapTo, repeat, takeUntil, tap } from 'rxjs/operators';
import { initBinance$ } from '../centralized/ccxt/init';
import { loadMarkets$ } from '../centralized/ccxt/load-markets';
import { CentralizedExchangePriceParams } from '../centralized/exchange-price';
import { GetCentralizedExchangeOrderParams } from '../centralized/order';
import { executeCEXorder$ } from '../centralized/execute-order';
import { getOrderBuilder$ } from '../centralized/order-builder';
import { Config } from '../config';
import { Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
import { getTradeInfo$ } from './info';
import { getExchange } from '../centralized/ccxt/exchange';

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
    loggers: Loggers
  ) => (source: Observable<any>) => Observable<any>;
  getCentralizedExchangePrice$: ({
    logger,
    config,
  }: CentralizedExchangePriceParams) => Observable<BigNumber>;
};

const getNewTrade$ = ({
  config,
  loggers,
  getCentralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
  catchOpenDEXerror,
  getCentralizedExchangePrice$,
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
    }).pipe(catchOpenDEXerror(loggers), ignoreElements()),
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
