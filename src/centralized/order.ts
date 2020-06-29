import { Observable, of } from 'rxjs';
import { delay, mergeMap, tap } from 'rxjs/operators';
import { accumulateOrderFillsForAsset } from '../trade/accumulate-fills';
import { Config } from '../config';
import { Logger } from '../logger';
import { getOpenDEXswapSuccess$ } from '../opendex/swap-success';
import { CEXorder, GetOrderBuilderParams } from './order-builder';
import { shouldCreateCEXorder } from './order-filter';

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
  createCentralizedExchangeOrder$: (logger: Logger) => Observable<null>;
  getOrderBuilder$: ({
    config,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForAsset,
    shouldCreateCEXorder,
  }: GetOrderBuilderParams) => Observable<CEXorder>;
};

const getCentralizedExchangeOrder$ = ({
  logger,
  config,
  createCentralizedExchangeOrder$,
  getOrderBuilder$,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  return getOrderBuilder$({
    config,
    logger,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForAsset,
    shouldCreateCEXorder,
  }).pipe(
    mergeMap(order => {
      logger.info(`Building CEX order: ${JSON.stringify(order)}`);
      return createCentralizedExchangeOrder$(logger);
    })
  );
};

export {
  getCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
  createCentralizedExchangeOrder$,
};
