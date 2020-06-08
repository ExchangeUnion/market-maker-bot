import { Observable } from 'rxjs';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  ListOrdersRequest,
  ListOrdersResponse,
} from '../../broker/opendex/proto/xudrpc_pb';
import { processResponse } from './client';

const listXudOrders$ = (client: XudClient): Observable<ListOrdersResponse> => {
  const request = new ListOrdersRequest();
  const xudOrders$ = new Observable(subscriber => {
    client.listOrders(request, processResponse(subscriber));
  });
  return xudOrders$ as Observable<ListOrdersResponse>;
};

export { listXudOrders$ };
