import { Exchange, Order } from 'ccxt';
import { curry } from 'ramda';
import { combineLatest, Observable, of, throwError, timer } from 'rxjs';
import {
  ignoreElements,
  mergeMap,
  mergeMapTo,
  retryWhen,
  take,
  tap,
} from 'rxjs/operators';
import { cancelOrder$ } from '../centralized/ccxt/cancel-order';
import { fetchOpenOrders$ } from '../centralized/ccxt/fetch-open-orders';
import { Config } from '../config';
import { CLEANUP_RETRY_INTERVAL, MAX_RETRY_ATTEMPS_CLEANUP } from '../constants';
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
    fetchOpenOrders$: (
      exchange: Exchange,
      config: Config
    ) => Observable<Order[]>,
    cancelOrder$: (
      exchange: Exchange,
      config: Config,
      orderId: string
    ) => Observable<Order>
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
      retryWhen(attempts => {
        return attempts.pipe(
          mergeMap((e, index) => {
            if (index + 1 > MAX_RETRY_ATTEMPS_CLEANUP) {
              return throwError(e);
            }
            const msg = e.message || e;
            logger.warn(`Failed to remove orders: ${msg} - retrying in 1000ms`);
            return timer(CLEANUP_RETRY_INTERVAL).pipe(mergeMapTo(of(e)));
          })
        );
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
    ).pipe(
      retryonErrorCEX,
      tap({
        complete: () => {
          loggers.centralized.info('All CEX orders have been removed');
        },
      })
    )
  ).pipe(take(1), ignoreElements());
};

export { getCleanup$, GetCleanupParams };
