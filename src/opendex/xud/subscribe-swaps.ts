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
    swapsSubscription.on('data', swapSuccess => {
      subscriber.next(swapSuccess);
    });
    swapsSubscription.on('error', error => {
      subscriber.error(error);
    });
    swapsSubscription.on('end', () => {
      subscriber.complete();
    });
  });
  return subscribeSwaps$ as Observable<SwapSuccess>;
};

export { subscribeXudSwaps$ };
