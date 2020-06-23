import { empty, Observable, of } from 'rxjs';
import {
  catchError,
  concatMap,
  delay,
  filter,
  repeat,
  scan,
  take,
  tap,
} from 'rxjs/operators';
import { Config } from '../config';
import { RETRY_INTERVAL } from '../constants';
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
  processSwapSuccess: (acc: string, curr: string) => string;
  quantityGreaterThanCEXminimum: (v: string) => boolean;
};

const getCentralizedExchangeOrder$ = ({
  logger,
  config,
  getOpenDEXorderFilled$,
  createCentralizedExchangeOrder$,
  processSwapSuccess,
  quantityGreaterThanCEXminimum,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  const orderFilled$ = getOpenDEXorderFilled$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }).pipe(
    // error and retry silently so that ongoing
    // CEX orders won't be cancelled
    catchError(() => {
      return empty().pipe(delay(RETRY_INTERVAL));
    }),
    repeat()
    // TODO: perhaps this should be done within
    // the context of getOpenDEXorderFilled$?
    // map -> processSwapSuccess
  );
  return orderFilled$.pipe(
    // accumulate OpenDEX order fills
    // until the minimum required CEX quantity
    // has been reached
    // TODO: accept accumulateOrderFills as param
    scan((acc, curr) => {
      return acc + curr;
    }, ''),
    // filter based on minimum CEX order quantity
    filter(quantityGreaterThanCEXminimum),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat(),
    // queue up CEX orders and process them 1 by 1
    concatMap(() => {
      return createCentralizedExchangeOrder$(logger);
    })
  );
};

export {
  getCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
  createCentralizedExchangeOrder$,
};
