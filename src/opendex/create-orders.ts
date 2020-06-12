import { forkJoin, Observable } from 'rxjs';
import { mapTo, mergeMap, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { PlaceOrderResponse } from '../proto/xudrpc_pb';
import { TradeInfo } from '../trade/info';
import { OpenDEXorders, TradeInfoToOpenDEXordersParams } from './orders';
import { processListorders } from './process-listorders';
import { RemoveOpenDEXordersParams } from './remove-orders';
import { CreateXudOrderParams } from './xud/create-order';
import { listXudOrders$ } from './xud/list-orders';
import { removeXudOrder$ } from './xud/remove-order';

type CreateOpenDEXordersParams = {
  config: Config;
  logger: Logger;
  getTradeInfo: () => TradeInfo;
  tradeInfoToOpenDEXorders: ({
    tradeInfo,
    config,
  }: TradeInfoToOpenDEXordersParams) => OpenDEXorders;
  getXudClient$: (config: Config) => Observable<XudClient>;
  removeOpenDEXorders$: ({
    config,
    getXudClient$,
    listXudOrders$,
    removeXudOrder$,
    processListorders,
  }: RemoveOpenDEXordersParams) => Observable<null>;
  createXudOrder$: ({
    client,
    quantity,
    orderSide,
    pairId,
    price,
    orderId,
  }: CreateXudOrderParams) => Observable<PlaceOrderResponse>;
};

const createOpenDEXorders$ = ({
  config,
  logger,
  getTradeInfo,
  tradeInfoToOpenDEXorders,
  getXudClient$,
  removeOpenDEXorders$,
  createXudOrder$,
}: CreateOpenDEXordersParams): Observable<boolean> => {
  return getXudClient$(config).pipe(
    // remove all existing orders
    mergeMap(client => {
      return removeOpenDEXorders$({
        config,
        getXudClient$,
        listXudOrders$,
        removeXudOrder$,
        processListorders,
      }).pipe(mapTo(client));
    }),
    // create new buy and sell orders
    mergeMap(client => {
      const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders({
        config,
        tradeInfo: getTradeInfo(),
      });
      const buyOrder$ = createXudOrder$({
        ...{ client },
        ...buyOrder,
      });
      const sellOrder$ = createXudOrder$({
        ...{ client },
        ...sellOrder,
      });
      const ordersComplete$ = forkJoin(sellOrder$, buyOrder$).pipe(mapTo(true));
      return ordersComplete$;
    }),
    tap(() => logger.trace('OpenDEX orders updated.')),
    take(1)
  );
};

export { createOpenDEXorders$, CreateOpenDEXordersParams, OpenDEXorders };
