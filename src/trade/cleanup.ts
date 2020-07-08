import { combineLatest, Observable, timer } from 'rxjs';
import {
  ignoreElements,
  take,
  tap,
  catchError,
  mergeMapTo,
} from 'rxjs/operators';
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
  removeCEXorders$: (logger: Logger) => Observable<unknown>;
};

const getCleanup$ = ({
  config,
  loggers,
  removeOpenDEXorders$,
  removeCEXorders$,
}: GetCleanupParams): Observable<unknown> => {
  return combineLatest(
    removeOpenDEXorders$({
      config,
      getXudClient$,
      listXudOrders$,
      removeXudOrder$,
      processListorders,
    }).pipe(
      tap(() => {
        loggers.opendex.info('All OpenDEX orders have been removed');
      })
    ),
    removeCEXorders$(loggers.centralized).pipe(
      catchError((_e, caught) => {
        loggers.centralized.warn(
          'Failed to remove CEX orders. Retrying in 1000ms'
        );
        return timer(1000).pipe(mergeMapTo(caught));
      })
    )
  ).pipe(take(1), ignoreElements());
};

export { getCleanup$, GetCleanupParams };
