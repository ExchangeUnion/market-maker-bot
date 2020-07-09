import { Exchange, Order } from 'ccxt';
import { curry } from 'ramda';
import { combineLatest, Observable, timer } from 'rxjs';
import {
  catchError,
  ignoreElements,
  mergeMapTo,
  take,
  tap,
} from 'rxjs/operators';
import { cancelOrder$ } from '../centralized/ccxt/cancel-order';
import { fetchOpenOrders$ } from '../centralized/ccxt/fetch-open-orders';
import { Config } from '../config';
import { Logger, Loggers } from '../logger';
import { processListorders } from '../opendex/process-listorders';
import { RemoveOpenDEXordersParams } from '../opendex/remove-orders';
import { getXudClient$ } from '../opendex/xud/client';
import { listXudOrders$ } from '../opendex/xud/list-orders';
import { removeXudOrder$ } from '../opendex/xud/remove-order';

type GetCleanupParams = {
  loggers: Loggers;
  config: Config;
  removeOpenDEXorders$: ({
    config,
    getXudClient$,
    listXudOrders$,
    removeXudOrder$,
    processListorders,
  }: RemoveOpenDEXordersParams) => Observable<null>;
  removeCEXorders$: (
    logger: Logger,
    config: Config,
    exchange: Exchange,
    fetchOpenOrders$: (exchange: Exchange) => Observable<Order[]>,
    cancelOrder$: (exchange: Exchange, orderId: string) => Observable<Order>
  ) => Observable<unknown>;
  CEX: Exchange;
};

const getCleanup$ = ({
  config,
  loggers,
  removeOpenDEXorders$,
  removeCEXorders$,
  CEX,
}: GetCleanupParams): Observable<unknown> => {
  const retryOnError = (logger: Logger, source: Observable<any>) => {
    return source.pipe(
      catchError((e, caught) => {
        const msg = e.message || e;
        logger.warn(`Failed to remove orders: ${msg} - retrying in 1000ms`);
        return timer(1000).pipe(mergeMapTo(caught));
      })
    );
  };
  const curriedRetryOnError = curry(retryOnError);
  const retryOnErrorOpenDEX = curriedRetryOnError(loggers.opendex);
  const retryonErrorCEX = curriedRetryOnError(loggers.centralized);
  return combineLatest(
    removeOpenDEXorders$({
      config,
      getXudClient$,
      listXudOrders$,
      removeXudOrder$,
      processListorders,
    }).pipe(
      retryOnErrorOpenDEX,
      tap(() => {
        loggers.opendex.info('All OpenDEX orders have been removed');
      })
    ),
    removeCEXorders$(
      loggers.centralized,
      config,
      CEX,
      fetchOpenOrders$,
      cancelOrder$
    ).pipe(retryonErrorCEX)
  ).pipe(take(1), ignoreElements());
};

export { getCleanup$, GetCleanupParams };
