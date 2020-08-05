import BigNumber from 'bignumber.js';
import { merge, Observable } from 'rxjs';
import { filter, map, repeat, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { OrderSide, Asset } from '../constants';
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
  quantityAboveMinimum: (
    asset: Asset
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
  quantityAboveMinimum,
}: GetOrderBuilderParams): Observable<CEXorder> => {
  const {
    receivedBaseAssetSwapSuccess$,
    receivedQuoteAssetSwapSuccess$,
  } = getOpenDEXswapSuccess$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  });
  const assetToTradeOnCEX: Asset =
    config.QUOTEASSET === 'BTC' ? config.BASEASSET : config.QUOTEASSET;
  const receivedQuoteAssetOrder$ = receivedQuoteAssetSwapSuccess$.pipe(
    // accumulate OpenDEX order fills when receiving
    // quote asset
    accumulateOrderFillsForQuoteAssetReceived(config),
    tap((quantity: BigNumber) => {
      logger.info(
        `Swap success. Accumulated ${assetToTradeOnCEX} quantity: ${quantity.toFixed()}`
      );
    }),
    // filter based on minimum CEX order quantity
    filter(quantityAboveMinimum(assetToTradeOnCEX)),
    map(quantity => {
      return { quantity, side: OrderSide.BUY };
    }),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat()
  );
  const receivedBaseAssetOrder$ = receivedBaseAssetSwapSuccess$.pipe(
    // accumulate OpenDEX order fills when receiving
    // quote asset
    accumulateOrderFillsForBaseAssetReceived(config),
    tap((quantity: BigNumber) => {
      logger.info(
        `Swap success. Accumulated ${assetToTradeOnCEX} quantity: ${quantity.toFixed()}`
      );
    }),
    // filter based on minimum CEX order quantity
    filter(quantityAboveMinimum(assetToTradeOnCEX)),
    map(quantity => {
      return { quantity, side: OrderSide.SELL };
    }),
    // reset the filled quantity and start from
    // the beginning
    take(1),
    repeat()
  );
  return merge(receivedQuoteAssetOrder$, receivedBaseAssetOrder$);
};

export { getOrderBuilder$, GetOrderBuilderParams, CEXorder };
