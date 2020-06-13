import { Observable } from 'rxjs';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { ListOrdersRequest, ListOrdersResponse } from '../../proto/xudrpc_pb';
import { processResponse } from './client';
import { map } from 'rxjs/operators';
import { parseGrpcError } from './parse-error';

type ListXudOrdersResponse = {
  client: XudClient;
  orders: ListOrdersResponse;
};

const listXudOrders$ = (
  client: XudClient
): Observable<ListXudOrdersResponse> => {
  const request = new ListOrdersRequest();
  const xudOrders$ = new Observable(subscriber => {
    client.listOrders(
      request,
      processResponse({
        subscriber,
        parseGrpcError,
      })
    );
  });
  const orders$ = xudOrders$ as Observable<ListOrdersResponse>;
  return orders$.pipe(
    map(orders => {
      return {
        client,
        orders,
      };
    })
  );
};

export { listXudOrders$, ListXudOrdersResponse };
