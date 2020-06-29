import { Observable, partition } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { Config } from '../config';
import { SubscribeSwapsParams } from './xud/subscribe-swaps';
import { parseGrpcError } from './xud/parse-error';

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
        return subscribeXudSwaps$({ client, config, parseGrpcError });
      })
    ),
    swapSuccess => {
      return swapSuccess.getCurrencyReceived() === config.BASEASSET;
    }
  );
  return {
    receivedBaseAssetSwapSuccess$,
    receivedQuoteAssetSwapSuccess$,
  };
};

export {
  getOpenDEXswapSuccess$,
  GetOpenDEXswapSuccessParams,
  OpenDEXswapSuccess,
};
