import BigNumber from 'bignumber.js';
import { Observable, of } from 'rxjs';
import {
  mergeMap,
  startWith,
  withLatestFrom,
  catchError,
} from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { getOpenDEXswapSuccess$ } from '../opendex/swap-success';
import {
  accumulateOrderFillsForBaseAssetReceived,
  accumulateOrderFillsForQuoteAssetReceived,
} from '../trade/accumulate-fills';
import { ExecuteCEXorderParams } from './execute-order';
import { CEXorder, GetOrderBuilderParams } from './order-builder';
import { shouldCreateCEXorder } from './order-filter';
import { createOrder$ } from './ccxt/create-order';
import { Exchange } from 'ccxt';

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
    shouldCreateCEXorder,
  }: GetOrderBuilderParams) => Observable<CEXorder>;
  centralizedExchangePrice$: Observable<BigNumber>;
};

const getCentralizedExchangeOrder$ = ({
  CEX,
  logger,
  config,
  executeCEXorder$,
  getOrderBuilder$,
  centralizedExchangePrice$,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  const ZERO_PRICE = new BigNumber('0');
  return getOrderBuilder$({
    config,
    logger,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForBaseAssetReceived,
    accumulateOrderFillsForQuoteAssetReceived,
    shouldCreateCEXorder,
  }).pipe(
    withLatestFrom(
      centralizedExchangePrice$.pipe(
        startWith(ZERO_PRICE),
        catchError(() => of(ZERO_PRICE))
      )
    ),
    mergeMap(([order, price]) => {
      return executeCEXorder$({
        CEX,
        createOrder$,
        config,
        logger,
        price,
        order,
      });
    })
  );
};

export { getCentralizedExchangeOrder$, GetCentralizedExchangeOrderParams };
