import { merge, Observable } from 'rxjs';
import { ignoreElements, mapTo, repeat, takeUntil, tap } from 'rxjs/operators';
import {
  createCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
} from '../centralized/order';
import { getOrderBuilder$ } from '../centralized/order-builder';
import { Config } from '../config';
import { Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
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
    createCentralizedExchangeOrder$,
  }: GetCentralizedExchangeOrderParams) => Observable<null>;
  shutdown$: Observable<unknown>;
  catchOpenDEXerror: (
    loggers: Loggers
  ) => (source: Observable<any>) => Observable<any>;
};

const getNewTrade$ = ({
  config,
  loggers,
  getCentralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
  catchOpenDEXerror,
}: GetTradeParams): Observable<boolean> => {
  return merge(
    getOpenDEXcomplete$({
      config,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
    }).pipe(catchOpenDEXerror(loggers), ignoreElements()),
    getCentralizedExchangeOrder$({
      logger: loggers.centralized,
      config,
      getOrderBuilder$,
      createCentralizedExchangeOrder$,
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
