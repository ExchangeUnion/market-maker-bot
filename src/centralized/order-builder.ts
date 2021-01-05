import BigNumber from 'bignumber.js';
import { merge, Observable } from 'rxjs';
import { map, mergeMap, repeat, take } from 'rxjs/operators';
import { Config } from '../config';
import { OrderSide } from '../constants';
import {
  GetOpenDEXswapSuccessParams,
  OpenDEXswapSuccess,
} from '../opendex/swap-success';
import { getXudClient$ } from '../opendex/xud/client';
import { subscribeXudSwaps$ } from '../opendex/xud/subscribe-swaps';
import { SwapSuccess } from '../proto/xudrpc_pb';

type CEXorder = {
  quantity: BigNumber;
  side: OrderSide;
};

const getOrderBuilder$ = (
  config: Config,
  getOpenDEXswapSuccess$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXswapSuccessParams) => OpenDEXswapSuccess,
  accumulateOrderFillsForBaseAssetReceived: (
    source: Observable<SwapSuccess>
  ) => Observable<BigNumber>,
  accumulateOrderFillsForQuoteAssetReceived: (
    source: Observable<SwapSuccess>
  ) => Observable<BigNumber>,
  filterMinimumQuantity: (quantity: BigNumber) => Observable<BigNumber>
): Observable<CEXorder> => {
  const {
    receivedBaseAssetSwapSuccess$,
    receivedQuoteAssetSwapSuccess$,
  } = getOpenDEXswapSuccess$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  });
  const assetReceived = (
    swapSuccess: Observable<SwapSuccess>,
    side: OrderSide,
    accumulator: (source: Observable<SwapSuccess>) => Observable<BigNumber>
  ) => {
    return swapSuccess.pipe(
      // accumulate OpenDEX order fills
      accumulator,
      mergeMap(filterMinimumQuantity),
      map(quantity => {
        return { quantity, side };
      }),
      // reset the filled quantity and start from
      // the beginning
      take(1),
      repeat()
    );
  };
  const receivedQuoteAssetOrder$ = assetReceived(
    receivedQuoteAssetSwapSuccess$,
    OrderSide.BUY,
    accumulateOrderFillsForQuoteAssetReceived
  );
  const receivedBaseAssetOrder$ = assetReceived(
    receivedBaseAssetSwapSuccess$,
    OrderSide.SELL,
    accumulateOrderFillsForBaseAssetReceived
  );
  return merge(receivedQuoteAssetOrder$, receivedBaseAssetOrder$);
};

type GetOrderBuilderParams = Parameters<typeof getOrderBuilder$>;

export { getOrderBuilder$, GetOrderBuilderParams, CEXorder };
