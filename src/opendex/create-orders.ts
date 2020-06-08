import { Observable } from 'rxjs';
import { mapTo, mergeMap, take, tap } from 'rxjs/operators';
import { XudClient } from 'src/broker/opendex/proto/xudrpc_grpc_pb';
import { Logger } from 'src/logger';
import { PlaceOrderResponse } from '../broker/opendex/proto/xudrpc_pb';
import { Config } from '../config';
import { TradeInfo } from '../trade/manager';
import { OpenDEXorders } from './orders';
import { processListorders } from './process-listorders';
import { RemoveOpenDEXordersParams } from './remove-orders';
import { CreateXudOrderParams } from './xud/create-order';
import { listXudOrders$ } from './xud/list-orders';
import { removeXudOrder$ } from './xud/remove-order';

type CreateOpenDEXordersParams = {
  config: Config;
  logger: Logger;
  getTradeInfo: () => TradeInfo;
  tradeInfoToOpenDEXorders: (tradeInfo: TradeInfo) => OpenDEXorders;
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
      const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders(getTradeInfo());
      return createXudOrder$({
        ...{ client },
        ...buyOrder,
      }).pipe(mapTo(true));
    }),
    tap(() => logger.trace('OpenDEX orders created.')),
    take(1)
  );
};

export { createOpenDEXorders$, CreateOpenDEXordersParams, OpenDEXorders };
