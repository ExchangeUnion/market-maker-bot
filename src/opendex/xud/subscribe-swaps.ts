import { Observable } from 'rxjs';
import { Config } from '../../config';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest, SwapSuccess } from '../../proto/xudrpc_pb';
import { ServiceError } from '@grpc/grpc-js';

type SubscribeSwapsParams = {
  client: XudClient;
  config: Config;
};

const subscribeXudSwaps$ = ({
  client,
  config,
}: SubscribeSwapsParams): Observable<SwapSuccess> => {
  const request = new SubscribeSwapsRequest();
  request.setIncludeTaker(true);
  const subscribeSwaps$ = new Observable(subscriber => {
    const swapsSubscription = client.subscribeSwaps(request);
    const { OPENDEX_BASEASSET, OPENDEX_QUOTEASSET } = config;
    const pairIdToMonitor = `${OPENDEX_BASEASSET}/${OPENDEX_QUOTEASSET}`;
    const onData = (swapSuccess: SwapSuccess) => {
      if (pairIdToMonitor === swapSuccess.getPairId()) {
        subscriber.next(swapSuccess);
      }
    };
    swapsSubscription.on('data', onData);
    const onError = (error: ServiceError) => {
      subscriber.error(error);
    };
    swapsSubscription.on('error', onError);
    const onEnd = () => {
      subscriber.complete();
    };
    swapsSubscription.on('end', onEnd);
    return () => {
      // ignore the error that cancel() will emit
      swapsSubscription.on('error', () => {});
      swapsSubscription.cancel();
      swapsSubscription.off('error', onError);
      swapsSubscription.off('end', onEnd);
      swapsSubscription.off('data', onData);
    };
  });
  return subscribeSwaps$ as Observable<SwapSuccess>;
};

export { subscribeXudSwaps$, SubscribeSwapsParams };
