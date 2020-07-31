import BigNumber from 'bignumber.js';
import { merge, Observable } from 'rxjs';
import { filter, map, repeat, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { OrderSide } from '../constants';
import { Logger } from '../logger';
import {
  GetOpenDEXswapSuccessParams,
  OpenDEXswapSuccess,
} from '../opendex/swap-success';
import { getXudClient$ } from '../opendex/xud/client';
import { subscribeXudSwaps$ } from '../opendex/xud/subscribe-swaps';
import { SwapSuccess } from '../proto/xudrpc_pb';

type GetOrderBuilderParams = {
  config: Config;
  logger: Logger;
  getOpenDEXswapSuccess$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXswapSuccessParams) => OpenDEXswapSuccess;
  accumulateOrderFillsForBaseAssetReceived: (
    config: Config
  ) => (source: Observable<SwapSuccess>) => Observable<BigNumber>;
  accumulateOrderFillsForQuoteAssetReceived: (
    config: Config
  ) => (source: Observable<SwapSuccess>) => Observable<BigNumber>;
  shouldCreateCEXorder: (
    config: Config
  ) => (filledQuantity: BigNumber) => boolean;
};

type CEXorder = {
  quantity: BigNumber;
  side: OrderSide;
};

const getOrderBuilder$ = ({
  config,
  logger,
  getOpenDEXswapSuccess$,
  accumulateOrderFillsForBaseAssetReceived,
  accumulateOrderFillsForQuoteAssetReceived,
  shouldCreateCEXorder,
}: GetOrderBuilderParams): Observable<CEXorder> => {
  const {
    receivedBaseAssetSwapSuccess$,
    receivedQuoteAssetSwapSuccess$,
  } = getOpenDEXswapSuccess$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  });
  const buyQuoteAsset$ = receivedQuoteAssetSwapSuccess$.pipe(
    // accumulate OpenDEX order fills when receiving
    // quote asset
    accumulateOrderFillsForQuoteAssetReceived(config),
    tap((quantity: BigNumber) => {
      logger.trace(
        `Swap success. Accumulated ${
          config.BASEASSET
        } quantity to BUY: ${quantity.toFixed()}`
      );
    }),
    // filter based on minimum CEX order quantity
    filter(shouldCreateCEXorder(config)),
    map(quantity => {
      return { quantity, side: OrderSide.BUY };
    }),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat()
  );
  const sellQuoteAsset$ = receivedBaseAssetSwapSuccess$.pipe(
    // accumulate OpenDEX order fills when receiving
    // quote asset
    accumulateOrderFillsForBaseAssetReceived(config),
    tap((quantity: BigNumber) => {
      logger.trace(
        `Swap success. Accumulated ${
          config.BASEASSET
        } quantity to SELL: ${quantity.toFixed()}`
      );
    }),
    // filter based on minimum CEX order quantity
    filter(shouldCreateCEXorder(config)),
    map(quantity => {
      return { quantity, side: OrderSide.SELL };
    }),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat()
  );
  return merge(buyQuoteAsset$, sellQuoteAsset$);
};

export { getOrderBuilder$, GetOrderBuilderParams, CEXorder };
