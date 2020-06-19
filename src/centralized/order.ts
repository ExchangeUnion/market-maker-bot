import { empty, Observable, of } from 'rxjs';
import { catchError, delay, mergeMap, repeat, tap } from 'rxjs/operators';
import { RETRY_INTERVAL } from '../constants';
import { Config } from '../config';
import { Logger } from '../logger';
import { GetOpenDEXorderFilledParams } from '../opendex/order-filled';
import { getXudClient$ } from '../opendex/xud/client';
import { subscribeXudSwaps$ } from '../opendex/xud/subscribe-swaps';
import { SwapSuccess } from '../proto/xudrpc_pb';

const createCentralizedExchangeOrder$ = (logger: Logger): Observable<null> => {
  return of(null).pipe(
    tap(() =>
      logger.info(
        'Starting centralized exchange order. TODO(karl): order quantity and side.'
      )
    ),
    delay(5000),
    tap(() =>
      logger.info(
        'Centralized exchange order finished. TODO(karl): order fill quantity, price and side.'
      )
    )
  );
};

type GetCentralizedExchangeOrderParams = {
  logger: Logger;
  config: Config;
  getOpenDEXorderFilled$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXorderFilledParams) => Observable<SwapSuccess>;
  createCentralizedExchangeOrder$: (logger: Logger) => Observable<null>;
};

const getCentralizedExchangeOrder$ = ({
  logger,
  config,
  getOpenDEXorderFilled$,
  createCentralizedExchangeOrder$,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  return getOpenDEXorderFilled$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }).pipe(
    catchError(() => {
      return empty().pipe(delay(RETRY_INTERVAL));
    }),
    repeat(),
    mergeMap(() => {
      return createCentralizedExchangeOrder$(logger);
    })
  );
};

export {
  getCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
  createCentralizedExchangeOrder$,
};
