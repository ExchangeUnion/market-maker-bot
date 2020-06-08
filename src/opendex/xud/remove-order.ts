import { Observable } from 'rxjs';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  RemoveOrderRequest,
  RemoveOrderResponse,
} from '../../broker/opendex/proto/xudrpc_pb';
import { processResponse } from './client';

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
    client.removeOrder(request, processResponse(subscriber));
  });
  return removeXudOrder$ as Observable<RemoveOrderResponse>;
};

export { removeXudOrder$, RemoveXudOrderParams };
