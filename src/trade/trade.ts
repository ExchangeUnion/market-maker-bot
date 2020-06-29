import { merge, Observable } from 'rxjs';
import { ignoreElements, mapTo, repeat, takeUntil, tap } from 'rxjs/operators';
import {
  createCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
} from '../centralized/order';
import { Config } from '../config';
import { Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
import { getOpenDEXswapSuccess$ } from '../opendex/swap-success';
import { getTradeInfo$ } from './info';
import { accumulateOrderFillsForAsset } from './accumulate-fills';
import { shouldCreateCEXorder } from '../centralized/order-filter';

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
    getOpenDEXswapSuccess$,
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
      getOpenDEXswapSuccess$,
      createCentralizedExchangeOrder$,
      accumulateOrderFillsForAsset,
      shouldCreateCEXorder,
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
