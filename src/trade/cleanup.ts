import { combineLatest, Observable } from 'rxjs';
import { ignoreElements, take, tap } from 'rxjs/operators';
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
  loggers.global.info('Cleaning up all orders before shutting down');
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
    removeCEXorders$(loggers.centralized)
  ).pipe(take(1), ignoreElements());
};

export { getCleanup$, GetCleanupParams };
