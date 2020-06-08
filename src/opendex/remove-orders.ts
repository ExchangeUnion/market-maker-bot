import { forkJoin, Observable } from 'rxjs';
import { map, mapTo, mergeMap, take } from 'rxjs/operators';
import { RemoveOrderResponse } from 'src/broker/opendex/proto/xudrpc_pb';
import { Config } from 'src/config';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { ProcessListOrdersParams } from './process-listorders';
import { ListXudOrdersResponse } from './xud/list-orders';
import { RemoveXudOrderParams } from './xud/remove-order';

type RemoveOpenDEXordersParams = {
  config: Config;
  getXudClient$: (config: Config) => Observable<XudClient>;
  listXudOrders$: (client: XudClient) => Observable<ListXudOrdersResponse>;
  processListorders: ({
    config,
    listOrdersResponse,
  }: ProcessListOrdersParams) => string[];
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
  processListorders,
}: RemoveOpenDEXordersParams): Observable<null> => {
  return getXudClient$(config).pipe(
    mergeMap(client => {
      return listXudOrders$(client).pipe(
        map(({ client, orders }) => {
          const orderIds = processListorders({
            config,
            listOrdersResponse: orders,
          });
          return { client, orderIds };
        })
      );
    }),
    mergeMap(({ client, orderIds }) => {
      const removeOrders$ = orderIds.map(orderId => {
        return removeXudOrder$({
          client,
          orderId,
        }).pipe(
          // move to removeXudOrder$
          take(1)
        );
      });
      return forkJoin(removeOrders$).pipe(mapTo(null));
    })
  );
};

export { removeOpenDEXorders$, RemoveOpenDEXordersParams };
