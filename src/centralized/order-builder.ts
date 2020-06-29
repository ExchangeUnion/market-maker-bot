import BigNumber from 'bignumber.js';
import { Observable, merge } from 'rxjs';
import { filter, repeat, take, map } from 'rxjs/operators';
import { Config } from '../config';
import { Asset, OrderSide } from '../constants';
import {
  GetOpenDEXswapSuccessParams,
  OpenDEXswapSuccess,
} from '../opendex/swap-success';
import { getXudClient$ } from '../opendex/xud/client';
import { subscribeXudSwaps$ } from '../opendex/xud/subscribe-swaps';
import { SwapSuccess } from '../proto/xudrpc_pb';

type GetOrderBuilderParams = {
  config: Config;
  getOpenDEXswapSuccess$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXswapSuccessParams) => OpenDEXswapSuccess;
  accumulateOrderFillsForAsset: (
    asset: Asset
  ) => (source: Observable<SwapSuccess>) => Observable<BigNumber>;
  shouldCreateCEXorder: (
    asset: Asset
  ) => (filledQuantity: BigNumber) => boolean;
};

type CEXorder = {
  quantity: BigNumber;
  side: OrderSide;
};

const getOrderBuilder$ = ({
  config,
  getOpenDEXswapSuccess$,
  accumulateOrderFillsForAsset,
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
  const buyQuoteAsset$ = receivedBaseAssetSwapSuccess$.pipe(
    // accumulate OpenDEX order fills when receiving
    // quote asset
    accumulateOrderFillsForAsset(config.QUOTEASSET),
    // filter based on minimum CEX order quantity
    filter(shouldCreateCEXorder(config.BASEASSET)),
    map(quantity => {
      return { quantity, side: OrderSide.BUY };
    }),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat()
  );
  const sellQuoteAsset$ = receivedQuoteAssetSwapSuccess$.pipe(
    // accumulate OpenDEX order fills when receiving
    // quote asset
    accumulateOrderFillsForAsset(config.BASEASSET),
    // filter based on minimum CEX order quantity
    filter(shouldCreateCEXorder(config.QUOTEASSET)),
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
