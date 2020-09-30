import { empty, Observable, partition } from 'rxjs';
import { catchError, delay, mergeMap, share, repeat } from 'rxjs/operators';
import { Config } from '../config';
import { RETRY_INTERVAL } from '../constants';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { SubscribeSwapsParams } from './xud/subscribe-swaps';

type GetOpenDEXswapSuccessParams = {
  config: Config;
  getXudClient$: (config: Config) => Observable<XudClient>;
  subscribeXudSwaps$: ({
    client,
    config,
  }: SubscribeSwapsParams) => Observable<SwapSuccess>;
};

type OpenDEXswapSuccess = {
  receivedBaseAssetSwapSuccess$: Observable<SwapSuccess>;
  receivedQuoteAssetSwapSuccess$: Observable<SwapSuccess>;
};

const getOpenDEXswapSuccess$ = ({
  config,
  getXudClient$,
  subscribeXudSwaps$,
}: GetOpenDEXswapSuccessParams): OpenDEXswapSuccess => {
  const [
    receivedBaseAssetSwapSuccess$,
    receivedQuoteAssetSwapSuccess$,
  ] = partition(
    getXudClient$(config).pipe(
      mergeMap(client => {
        return subscribeXudSwaps$({ client, config });
      }),
      share()
    ),
    swapSuccess => {
      return swapSuccess.getCurrencyReceived() === config.BASEASSET;
    }
  );
  const catchErrorAndRetry = (source: Observable<SwapSuccess>) => {
    return source.pipe(
      catchError(() => {
        return empty().pipe(delay(RETRY_INTERVAL));
      }),
      repeat()
    );
  };
  return {
    receivedBaseAssetSwapSuccess$: receivedBaseAssetSwapSuccess$.pipe(
      catchErrorAndRetry
    ),
    receivedQuoteAssetSwapSuccess$: receivedQuoteAssetSwapSuccess$.pipe(
      catchErrorAndRetry
    ),
  };
};

export {
  getOpenDEXswapSuccess$,
  GetOpenDEXswapSuccessParams,
  OpenDEXswapSuccess,
};
