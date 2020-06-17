import { Observable } from 'rxjs';
import { Config } from '../../config';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest, SwapSuccess } from '../../proto/xudrpc_pb';
import { ParseGrpcErrorResponse } from './parse-error';
import { ServiceError } from '@grpc/grpc-js';

type SubscribeSwapsParams = {
  client: XudClient;
  config: Config;
  parseGrpcError: (error: ServiceError) => ParseGrpcErrorResponse;
};

const subscribeXudSwaps$ = ({
  client,
  config,
  parseGrpcError,
}: SubscribeSwapsParams): Observable<SwapSuccess> => {
  const request = new SubscribeSwapsRequest();
  request.setIncludeTaker(true);
  const subscribeSwaps$ = new Observable(subscriber => {
    const swapsSubscription = client.subscribeSwaps(request);
    const { BASEASSET, QUOTEASSET } = config;
    const pairIdToMonitor = `${BASEASSET}/${QUOTEASSET}`;
    const onData = (swapSuccess: SwapSuccess) => {
      if (pairIdToMonitor === swapSuccess.getPairId()) {
        subscriber.next(swapSuccess);
      }
    };
    swapsSubscription.on('data', onData);
    const onError = (error: ServiceError) => {
      const parsedError = parseGrpcError(error);
      parsedError && subscriber.error(parsedError);
    };
    swapsSubscription.on('error', onError);
    const onEnd = () => {
      subscriber.complete();
    };
    swapsSubscription.on('end', onEnd);
    return () => {
      const cleanup = () => {
        swapsSubscription.cancel();
        swapsSubscription.off('data', onData);
        swapsSubscription.off('error', onError);
        swapsSubscription.off('end', onEnd);
      };
      // using setImmediate to prevent NodeJS core crashing with:
      // Assertion `(current_nghttp2_memory_) >= (previous_size)' failed
      setImmediate(cleanup);
    };
  });
  return subscribeSwaps$ as Observable<SwapSuccess>;
};

export { subscribeXudSwaps$, SubscribeSwapsParams };
