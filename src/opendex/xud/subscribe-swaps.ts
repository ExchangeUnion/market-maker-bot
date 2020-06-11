import { ServiceError } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  SubscribeSwapsRequest,
  SwapSuccess,
} from '../../broker/opendex/proto/xudrpc_pb';

const subscribeXudSwaps$ = (client: XudClient): Observable<SwapSuccess> => {
  const request = new SubscribeSwapsRequest();
  request.setIncludeTaker(true);
  const subscribeSwaps$ = new Observable(subscriber => {
    const swapsSubscription = client.subscribeSwaps(request);
    const onData = (swapSuccess: SwapSuccess) => {
      subscriber.next(swapSuccess);
    };
    swapsSubscription.on('data', onData);
    const onError = (error: ServiceError) => {
      // do not error when client cancels the stream
      if (error.code === 1) {
        return;
      }
      subscriber.error(error);
    };
    swapsSubscription.on('error', onError);
    const onEnd = () => {
      subscriber.complete();
    };
    swapsSubscription.on('end', onEnd);
    return () => {
      swapsSubscription.cancel();
      swapsSubscription.off('data', onData);
      swapsSubscription.off('error', onError);
      swapsSubscription.off('end', onEnd);
    };
  });
  return subscribeSwaps$ as Observable<SwapSuccess>;
};

export { subscribeXudSwaps$ };