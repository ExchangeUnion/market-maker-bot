import { concat, Observable, throwError, timer } from 'rxjs';
import {
  catchError,
  ignoreElements,
  mergeMapTo,
  repeat,
  takeUntil,
} from 'rxjs/operators';
import { Config } from '../config';
import { RETRY_INTERVAL } from '../constants';
import { Loggers } from '../logger';
import { GetOpenDEXcompleteParams } from '../opendex/complete';
import { createOpenDEXorders$ } from '../opendex/create-orders';
import { errorCodes } from '../opendex/errors';
import { getTradeInfo$ } from './info';

type GetTradeParams = {
  config: Config;
  loggers: Loggers;
  getOpenDEXcomplete$: ({
    config,
    loggers,
  }: GetOpenDEXcompleteParams) => Observable<boolean>;
  centralizedExchangeOrder$: (config: Config) => Observable<boolean>;
  shutdown$: Observable<unknown>;
};

const catchArbyError = (loggers: Loggers) => {
  return (source: Observable<any>) => {
    return source.pipe(
      catchError((e, caught) => {
        const retry = () => {
          // retry after interval
          return timer(RETRY_INTERVAL * 1000).pipe(mergeMapTo(caught));
        };
        // check if we're dealing with an error that
        // can be recovered from
        if (
          e.code === errorCodes.XUD_UNAVAILABLE ||
          e.code === errorCodes.XUD_CLIENT_INVALID_CERT ||
          e.code === errorCodes.BALANCE_MISSING ||
          e.code === errorCodes.TRADING_LIMITS_MISSING ||
          e.code === errorCodes.INVALID_ORDERS_LIST ||
          e.code === errorCodes.XUD_LOCKED ||
          e.code === errorCodes.INSUFFICIENT_OUTBOUND_BALANCE
        ) {
          loggers.opendex.warn(
            `${e.message}. Retrying in ${RETRY_INTERVAL} seconds.`
          );
          return retry();
        } else if (
          e.code === errorCodes.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR
        ) {
          loggers.centralized.warn(
            `${e.message}. Retrying in ${RETRY_INTERVAL} seconds.`
          );
          return retry();
        }
        // unexpected or unrecoverable error should stop
        // the application
        return throwError(e);
      })
    );
  };
};

const getNewTrade$ = ({
  config,
  loggers,
  centralizedExchangeOrder$,
  getOpenDEXcomplete$,
  shutdown$,
}: GetTradeParams): Observable<boolean> => {
  return concat(
    getOpenDEXcomplete$({
      config,
      createOpenDEXorders$,
      loggers,
      tradeInfo$: getTradeInfo$,
    }).pipe(catchArbyError(loggers), ignoreElements()),
    centralizedExchangeOrder$(config)
  ).pipe(repeat(), takeUntil(shutdown$));
};

export { getNewTrade$, GetTradeParams };
