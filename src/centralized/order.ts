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

type GetCentralizedExchangeOrderParams = {
  logger: Logger;
  config: Config;
  executeCEXorder$: ({
    logger,
    centralizedExchangePrice$,
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
        logger,
        centralizedExchangePrice$,
        order,
      });
    })
  );
};

export { getCentralizedExchangeOrder$, GetCentralizedExchangeOrderParams };
