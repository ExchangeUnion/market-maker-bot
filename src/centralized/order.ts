import BigNumber from 'bignumber.js';
import { Dictionary, Exchange, Market } from 'ccxt';
import { combineLatest, Observable, timer } from 'rxjs';
import {
  catchError,
  mergeMap,
  mergeMapTo,
  withLatestFrom,
  map,
} from 'rxjs/operators';
import { ArbyStore } from 'src/store';
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
  executeCEXorder$: (...args: ExecuteCEXorderParams) => Observable<null>;
  getOrderBuilder$: (...args: GetOrderBuilderParams) => Observable<CEXorder>;
  centralizedExchangePrice$: Observable<BigNumber>;
  deriveCEXorderQuantity: (
    order: CEXorder,
    price: BigNumber,
    config: Config
  ) => CEXorder;
  store: ArbyStore;
};

const getCentralizedExchangeOrder$ = ({
  CEX,
  logger,
  config,
  executeCEXorder$,
  getOrderBuilder$,
  centralizedExchangePrice$,
  deriveCEXorderQuantity,
  store,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  const minimumBaseAssetQuantity$ = (store.selectState('markets') as Observable<
    Dictionary<Market>
  >).pipe(
    map(markets => {
      const tradingPair = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
      const market = markets[tradingPair];
      return new BigNumber(market.limits.amount.min);
    })
  );
  const minimumQuantity$ = combineLatest([
    minimumBaseAssetQuantity$,
    centralizedExchangePrice$,
  ]).pipe(
    map(([minimumQuantity, price]) =>
      config.BASEASSET === 'BTC'
        ? minimumQuantity.multipliedBy(price)
        : minimumQuantity
    )
  );
  const assetToTradeOnCEX: string =
    config.CEX_QUOTEASSET === 'BTC'
      ? config.CEX_BASEASSET
      : config.CEX_QUOTEASSET;
  const filterMinimumQuantity = quantityAboveMinimum(
    store,
    logger,
    assetToTradeOnCEX,
    minimumQuantity$
  );
  return getOrderBuilder$(
    config,
    getOpenDEXswapSuccess$,
    accumulateOrderFillsForBaseAssetReceived(config),
    accumulateOrderFillsForQuoteAssetReceived(config),
    filterMinimumQuantity
  ).pipe(
    withLatestFrom(
      centralizedExchangePrice$.pipe(
        catchError((_e, caught) => {
          return timer(1000).pipe(mergeMapTo(caught));
        })
      )
    ),
    mergeMap(([order, price]) => {
      return executeCEXorder$(
        CEX,
        config,
        logger,
        price,
        deriveCEXorderQuantity(order, price, config),
        createOrder$
      );
    })
  );
};

export { getCentralizedExchangeOrder$, GetCentralizedExchangeOrderParams };
