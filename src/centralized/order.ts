import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';
import { Observable, timer } from 'rxjs';
import {
  catchError,
  mergeMap,
  mergeMapTo,
  withLatestFrom,
} from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { getOpenDEXswapSuccess$ } from '../opendex/swap-success';
import {
  accumulateOrderFillsForBaseAssetReceived,
  accumulateOrderFillsForQuoteAssetReceived,
} from '../trade/accumulate-fills';
import { createOrder$ } from './ccxt/create-order';
import { ExecuteCEXorderParams } from './execute-order';
import { quantityAboveMinimum } from './minimum-order-quantity-filter';
import { CEXorder, GetOrderBuilderParams } from './order-builder';

type GetCentralizedExchangeOrderParams = {
  CEX: Exchange;
  logger: Logger;
  config: Config;
  executeCEXorder$: ({
    logger,
    price,
    order,
  }: ExecuteCEXorderParams) => Observable<null>;
  getOrderBuilder$: ({
    config,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForBaseAssetReceived,
    accumulateOrderFillsForQuoteAssetReceived,
    quantityAboveMinimum,
  }: GetOrderBuilderParams) => Observable<CEXorder>;
  centralizedExchangePrice$: Observable<BigNumber>;
  deriveCEXorderQuantity: (
    order: CEXorder,
    price: BigNumber,
    config: Config
  ) => CEXorder;
};

const getCentralizedExchangeOrder$ = ({
  CEX,
  logger,
  config,
  executeCEXorder$,
  getOrderBuilder$,
  centralizedExchangePrice$,
  deriveCEXorderQuantity,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  return getOrderBuilder$({
    config,
    logger,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForBaseAssetReceived,
    accumulateOrderFillsForQuoteAssetReceived,
    quantityAboveMinimum,
  }).pipe(
    withLatestFrom(
      centralizedExchangePrice$.pipe(
        catchError((_e, caught) => {
          return timer(1000).pipe(mergeMapTo(caught));
        })
      )
    ),
    mergeMap(([order, price]) => {
      return executeCEXorder$({
        CEX,
        createOrder$,
        config,
        logger,
        price,
        order: deriveCEXorderQuantity(order, price, config),
      });
    })
  );
};

export { getCentralizedExchangeOrder$, GetCentralizedExchangeOrderParams };
