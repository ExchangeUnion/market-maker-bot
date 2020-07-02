import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { mergeMap, startWith, withLatestFrom } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { getOpenDEXswapSuccess$ } from '../opendex/swap-success';
import { accumulateOrderFillsForAsset } from '../trade/accumulate-fills';
import { ExecuteCEXorderParams } from './execute-order';
import { CEXorder, GetOrderBuilderParams } from './order-builder';
import { shouldCreateCEXorder } from './order-filter';
import { createOrder$ } from './ccxt/create-order';
import { Exchange } from 'ccxt';

type GetCentralizedExchangeOrderParams = {
  CEX: Observable<Exchange>;
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
    accumulateOrderFillsForAsset,
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
  return getOrderBuilder$({
    config,
    logger,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForAsset,
    shouldCreateCEXorder,
  }).pipe(
    withLatestFrom(
      centralizedExchangePrice$.pipe(startWith(new BigNumber('0')))
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
