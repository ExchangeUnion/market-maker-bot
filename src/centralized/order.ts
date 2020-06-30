import BigNumber from 'bignumber.js';
import { Observable, timer } from 'rxjs';
import { mapTo, mergeMap, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { getOpenDEXswapSuccess$ } from '../opendex/swap-success';
import { accumulateOrderFillsForAsset } from '../trade/accumulate-fills';
import { CEXorder, GetOrderBuilderParams } from './order-builder';
import { shouldCreateCEXorder } from './order-filter';

type CreateCEXorderParams = {
  logger: Logger;
  centralizedExchangePrice$: Observable<BigNumber>;
  order: CEXorder;
};
const createCentralizedExchangeOrder$ = ({
  logger,
  centralizedExchangePrice$,
  order,
}: CreateCEXorderParams): Observable<null> => {
  return centralizedExchangePrice$.pipe(
    take(1),
    mergeMap(price => {
      logger.info(
        `Starting centralized exchange ${order.side} order (quantity: ${
          order.quantity
        }, price: ${price.toFixed()})`
      );
      return timer(5000).pipe(
        tap(() =>
          logger.info(
            'Centralized exchange order finished. TODO(karl): order fill quantity, price and side.'
          )
        )
      );
    }),
    mapTo(null)
  );
};

type GetCentralizedExchangeOrderParams = {
  logger: Logger;
  config: Config;
  createCentralizedExchangeOrder$: ({
    logger,
    centralizedExchangePrice$,
    order,
  }: CreateCEXorderParams) => Observable<null>;
  getOrderBuilder$: ({
    config,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForAsset,
    shouldCreateCEXorder,
  }: GetOrderBuilderParams) => Observable<CEXorder>;
  centralizedExchangePrice$: Observable<BigNumber>;
};

const getCentralizedExchangeOrder$ = ({
  logger,
  config,
  createCentralizedExchangeOrder$,
  getOrderBuilder$,
  centralizedExchangePrice$,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  return getOrderBuilder$({
    config,
    logger,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForAsset,
    shouldCreateCEXorder,
  }).pipe(
    mergeMap(order => {
      return createCentralizedExchangeOrder$({
        logger,
        centralizedExchangePrice$,
        order,
      });
    })
  );
};

export {
  getCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
  createCentralizedExchangeOrder$,
};
