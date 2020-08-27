import { status } from '@grpc/grpc-js';
import { AuthenticationError, Exchange } from 'ccxt';
import { concat, Observable, throwError, timer } from 'rxjs';
import { ignoreElements, mergeMap, retryWhen } from 'rxjs/operators';
import { ArbyStore } from 'src/store';
import { removeCEXorders$ } from '../centralized/remove-orders';
import { Config } from '../config';
import { MAX_RETRY_ATTEMPS, RETRY_INTERVAL } from '../constants';
import { Logger, Loggers } from '../logger';
import { errorCodes, errors } from '../opendex/errors';
import { GetCleanupParams } from '../trade/cleanup';
import { removeOpenDEXorders$ } from './remove-orders';

const catchOpenDEXerror = (
  loggers: Loggers,
  config: Config,
  getCleanup$: ({
    config,
    loggers,
    removeOpenDEXorders$,
    removeCEXorders$,
  }: GetCleanupParams) => Observable<unknown>,
  CEX: Exchange,
  store: ArbyStore
) => {
  return (source: Observable<any>) => {
    return source.pipe(
      retryWhen(attempts => {
        let UNAVAILABLE_ERROR_COUNT = 0;
        return attempts.pipe(
          mergeMap(e => {
            if (e.code === status.UNAVAILABLE) {
              if (UNAVAILABLE_ERROR_COUNT >= MAX_RETRY_ATTEMPS) {
                loggers.global.error(
                  `UNAVAILABLE error count ${UNAVAILABLE_ERROR_COUNT} has reached threshold.`
                );
                return throwError(e);
              }
              UNAVAILABLE_ERROR_COUNT++;
            }
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
              return timer(RETRY_INTERVAL);
            } else if (
              e.code === errorCodes.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR
            ) {
              logMessage(loggers.centralized);
              store.resetLastOrderUpdatePrice();
              return concat(
                getCleanup$({
                  config,
                  loggers,
                  removeOpenDEXorders$,
                  removeCEXorders$,
                  CEX,
                }).pipe(ignoreElements()),
                timer(RETRY_INTERVAL)
              );
            }
            // unexpected or unrecoverable error should stop
            // the application
            if (e instanceof AuthenticationError) {
              return throwError(errors.CEX_INVALID_CREDENTIALS);
            }
            return throwError(e);
          })
        );
      })
    );
  };
};

export { catchOpenDEXerror };
