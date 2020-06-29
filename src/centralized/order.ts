import BigNumber from 'bignumber.js';
import { empty, merge, Observable, of } from 'rxjs';
import {
  catchError,
  concatMap,
  delay,
  filter,
  repeat,
  take,
  tap,
} from 'rxjs/operators';
import { Config } from '../config';
import { Asset, RETRY_INTERVAL } from '../constants';
import { Logger } from '../logger';
import {
  GetOpenDEXswapSuccessParams,
  OpenDEXswapSuccess,
} from '../opendex/swap-success';
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
  getOpenDEXswapSuccess$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXswapSuccessParams) => OpenDEXswapSuccess;
  createCentralizedExchangeOrder$: (logger: Logger) => Observable<null>;
  accumulateOrderFillsForAsset: (
    asset: Asset
  ) => (source: Observable<SwapSuccess>) => Observable<BigNumber>;
  shouldCreateCEXorder: (
    asset: Asset
  ) => (filledQuantity: BigNumber) => boolean;
};

const getCentralizedExchangeOrder$ = ({
  logger,
  config,
  getOpenDEXswapSuccess$,
  createCentralizedExchangeOrder$,
  accumulateOrderFillsForAsset,
  shouldCreateCEXorder,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  const {
    receivedBaseAssetSwapSuccess$,
    receivedQuoteAssetSwapSuccess$,
  } = getOpenDEXswapSuccess$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  });
  const receivedQuoteAsset$ = receivedQuoteAssetSwapSuccess$.pipe(
    // error and retry silently so that ongoing
    // CEX orders won't be cancelled
    catchError(() => {
      return empty().pipe(delay(RETRY_INTERVAL));
    }),
    repeat()
  );
  const receivedBaseAsset$ = receivedBaseAssetSwapSuccess$.pipe(
    // error and retry silently so that ongoing
    // CEX orders won't be cancelled
    catchError(() => {
      return empty().pipe(delay(RETRY_INTERVAL));
    }),
    repeat()
  );
  const buyQuoteAsset$ = receivedQuoteAsset$.pipe(
    // accumulate OpenDEX order fills
    // until the minimum required CEX quantity
    // has been reached
    accumulateOrderFillsForAsset(config.QUOTEASSET),
    // filter based on minimum CEX order quantity
    filter(shouldCreateCEXorder(config.BASEASSET)),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat(),
    // queue up CEX orders and process them 1 by 1
    concatMap(buyQuantity => {
      logger.info(
        `CREATING A BUY ETH ORDER FOR AMOUNT: ${buyQuantity.toFixed()}`
      );
      return createCentralizedExchangeOrder$(logger);
    })
  );
  const sellQuoteAsset$ = receivedBaseAsset$.pipe(
    // accumulate OpenDEX order fills
    // until the minimum required CEX quantity
    // has been reached
    accumulateOrderFillsForAsset(config.BASEASSET),
    tap(quantity => {
      logger.info(`quantity before filter ${quantity.toFixed()}`);
    }),
    // filter based on minimum CEX order quantity
    filter(shouldCreateCEXorder(config.QUOTEASSET)),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat(),
    // queue up CEX orders and process them 1 by 1
    concatMap(buyQuantity => {
      logger.info(
        `CREATING A SELL ETH ORDER FOR AMOUNT: ${buyQuantity.toFixed()}`
      );
      return createCentralizedExchangeOrder$(logger);
    })
  );
  return merge(buyQuoteAsset$, sellQuoteAsset$);
};

export {
  getCentralizedExchangeOrder$,
  GetCentralizedExchangeOrderParams,
  createCentralizedExchangeOrder$,
};
