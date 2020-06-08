import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Config } from 'src/config';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { ListXudOrdersResponse } from './xud/list-orders';
import { RemoveXudOrderParams } from './xud/remove-order';
import { RemoveOrderResponse } from 'src/broker/opendex/proto/xudrpc_pb';

type RemoveOpenDEXordersParams = {
  config: Config;
  getXudClient$: (config: Config) => Observable<XudClient>;
  listXudOrders$: (client: XudClient) => Observable<ListXudOrdersResponse>;
  removeXudOrder$: ({
    client,
    orderId,
  }: RemoveXudOrderParams) => Observable<RemoveOrderResponse>;
};

const removeOpenDEXorders$ = ({
  config,
  getXudClient$,
  listXudOrders$,
  removeXudOrder$,
}: RemoveOpenDEXordersParams): Observable<ListXudOrdersResponse> => {
  return getXudClient$(config).pipe(
    mergeMap(client => {
      return listXudOrders$(client);
    })
  );
};

export { removeOpenDEXorders$ };
