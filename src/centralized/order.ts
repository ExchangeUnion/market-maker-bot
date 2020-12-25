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
import { ArbyStore } from 'src/store';
import { SaveOrderParams } from '../db/order-repository';
import { OrderInstance } from '../db/order';

type GetCentralizedExchangeOrderParams = {
  CEX: Exchange;
  logger: Logger;
  config: Config;
  executeCEXorder$: ({
    logger,
    price,
    order,
    saveOrder$,
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
  store: ArbyStore;
  saveOrder$: ({ order }: SaveOrderParams) => Observable<OrderInstance>;
};

const getCentralizedExchangeOrder$ = ({
  CEX,
  logger,
  config,
  saveOrder$,
  executeCEXorder$,
  getOrderBuilder$,
  centralizedExchangePrice$,
  deriveCEXorderQuantity,
  store,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  return getOrderBuilder$({
    config,
    logger,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForBaseAssetReceived,
    accumulateOrderFillsForQuoteAssetReceived,
    quantityAboveMinimum,
    store,
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
        saveOrder$,
      });
    })
  );
};

export { getCentralizedExchangeOrder$, GetCentralizedExchangeOrderParams };
