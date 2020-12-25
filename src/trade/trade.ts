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
import { ArbyStore } from '../store';
import { getCleanup$, GetCleanupParams } from './cleanup';
import { getTradeInfo$ } from './info';
import { getKrakenPrice$ } from '../centralized/kraken-price';
import { getBinancePrice$ } from '../centralized/binance-price';
import { SaveOrderParams } from '../db/order-repository';
import { OrderInstance } from '../db/order';

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
    CEX: Exchange,
    store: ArbyStore
  ) => (source: Observable<any>) => Observable<any>;
  getCentralizedExchangePrice$: ({
    logger,
    config,
  }: CentralizedExchangePriceParams) => Observable<BigNumber>;
  CEX: Exchange;
  store: ArbyStore;
  saveOrder$: ({ order }: SaveOrderParams) => Observable<OrderInstance>;
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
  store,
  saveOrder$,
}: GetTradeParams): Observable<boolean> => {
  const centralizedExchangePrice$ = getCentralizedExchangePrice$({
    config,
    logger: loggers.centralized,
    getBinancePrice$,
    getKrakenPrice$,
  });
  return merge(
    getOpenDEXcomplete$({
      config,
      CEX,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
      centralizedExchangePrice$,
      store,
    }).pipe(
      catchOpenDEXerror(loggers, config, getCleanup$, CEX, store),
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
      store,
      saveOrder$,
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
