import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { RemoveOrderRequest, RemoveOrderResponse } from '../../proto/xudrpc_pb';
import { processResponse } from './process-response';

type RemoveXudOrderParams = {
  client: XudClient;
  orderId: string;
};

const removeXudOrder$ = ({
  client,
  orderId,
}: RemoveXudOrderParams): Observable<RemoveOrderResponse> => {
  const request = new RemoveOrderRequest();
  request.setOrderId(orderId);
  const removeXudOrder$ = new Observable(subscriber => {
    client.removeOrder(
      request,
      processResponse({
        subscriber,
      })
    );
  }).pipe(take(1));
  return removeXudOrder$ as Observable<RemoveOrderResponse>;
};

export { removeXudOrder$, RemoveXudOrderParams };
