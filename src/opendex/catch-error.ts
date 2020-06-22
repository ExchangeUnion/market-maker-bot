import { Observable, throwError, timer } from 'rxjs';
import { catchError, mergeMapTo } from 'rxjs/operators';
import { RETRY_INTERVAL } from '../constants';
import { Loggers, Logger } from '../logger';
import { errorCodes } from '../opendex/errors';
import { status } from '@grpc/grpc-js';

const catchOpenDEXerror = (loggers: Loggers) => {
  return (source: Observable<any>) => {
    return source.pipe(
      catchError((e, caught) => {
        const retry = () => {
          // retry after interval
          return timer(RETRY_INTERVAL).pipe(mergeMapTo(caught));
        };
        const logMessage = (logger: Logger) => {
          logger.warn(`${e.message}. Retrying in ${RETRY_INTERVAL}ms.`);
        };
        // check if we're dealing with an error that
        // can be recovered from
        if (
          e.code === errorCodes.BALANCE_MISSING ||
          e.code === errorCodes.XUD_CLIENT_INVALID_CERT ||
          e.code === errorCodes.TRADING_LIMITS_MISSING ||
          e.code === errorCodes.INVALID_ORDERS_LIST ||
          e.code === status.UNAVAILABLE ||
          e.code === status.UNKNOWN ||
          e.code === status.NOT_FOUND ||
          e.code === status.ALREADY_EXISTS ||
          e.code === status.FAILED_PRECONDITION ||
          e.code === status.RESOURCE_EXHAUSTED ||
          e.code === status.UNIMPLEMENTED ||
          e.code === status.ABORTED ||
          e.code === status.DEADLINE_EXCEEDED ||
          e.code === status.INTERNAL
        ) {
          logMessage(loggers.opendex);
          return retry();
        } else if (
          e.code === errorCodes.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR
        ) {
          logMessage(loggers.centralized);
          return retry();
        }
        // unexpected or unrecoverable error should stop
        // the application
        return throwError(e);
      })
    );
  };
};

export { catchOpenDEXerror };
