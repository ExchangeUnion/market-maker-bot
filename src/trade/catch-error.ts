import { Observable, throwError, timer } from 'rxjs';
import { catchError, mergeMapTo } from 'rxjs/operators';
import { RETRY_INTERVAL } from '../constants';
import { Loggers } from '../logger';
import { errorCodes } from '../opendex/errors';

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
          e.code === errorCodes.XUD_CLIENT_INVALID_CERT ||
          e.code === errorCodes.BALANCE_MISSING ||
          e.code === errorCodes.TRADING_LIMITS_MISSING ||
          e.code === errorCodes.INVALID_ORDERS_LIST
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

export { catchArbyError };
