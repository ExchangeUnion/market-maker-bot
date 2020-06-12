import { ServiceError } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest, SwapSuccess } from '../../proto/xudrpc_pb';
import { xudErrorCodes, errors } from '../errors';

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
      // remap expected xud unavailable error
      if (error.code == xudErrorCodes.UNAVAILABLE) {
        subscriber.error(errors.XUD_UNAVAILABLE);
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

export { subscribeXudSwaps$ };
