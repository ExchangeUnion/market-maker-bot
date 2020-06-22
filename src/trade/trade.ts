import { merge, Observable, throwError, timer } from 'rxjs';
import { ignoreElements, mapTo, repeat, takeUntil, catchError, mergeMap, delay } from 'rxjs/operators';
import {
  createCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
} from '../centralized/order';
import { Config } from '../config';
import { Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
import { getOpenDEXorderFilled$ } from '../opendex/order-filled';
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
    getOpenDEXorderFilled$,
    createCentralizedExchangeOrder$,
  }: GetCentralizedExchangeOrderParams) => Observable<null>;
  shutdown$: Observable<unknown>;
  catchArbyError: (
    loggers: Loggers
  ) => (source: Observable<any>) => Observable<any>;
};

const getNewTrade$ = ({
  config,
  loggers,
  getCentralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
  catchArbyError,
}: GetTradeParams): Observable<boolean> => {
  return merge(
    getOpenDEXcomplete$({
      config,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
    }).pipe(
      catchError(catchArbyError(loggers)),
      ignoreElements()
    ),
    getCentralizedExchangeOrder$({
      logger: loggers.centralized,
      config,
      getOpenDEXorderFilled$,
      createCentralizedExchangeOrder$,
    })
  ).pipe(mapTo(true), repeat(), takeUntil(shutdown$));
};

export { getNewTrade$, GetTradeParams };
