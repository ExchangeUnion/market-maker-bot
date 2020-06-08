import { Observable, of } from 'rxjs';
import { delay, tap, mergeMap, mapTo, take } from 'rxjs/operators';
import {
  PlaceOrderResponse,
  OrderSide,
  RemoveOrderResponse,
} from '../broker/opendex/proto/xudrpc_pb';
import { Config } from '../config';
import { TradeInfo } from '../trade/manager';
import { CreateXudOrderParams } from './xud/create-order';
import { Logger } from 'src/logger';
import { XudClient } from 'src/broker/opendex/proto/xudrpc_grpc_pb';
import { OpenDEXorders } from './orders';
import { RemoveXudOrderParams } from './xud/remove-order';

type CreateOpenDEXordersParams = {
  config: Config;
  logger: Logger;
  getTradeInfo: () => TradeInfo;
  tradeInfoToOpenDEXorders: (tradeInfo: TradeInfo) => OpenDEXorders;
  getXudClient$: (config: Config) => Observable<XudClient>;
  removeXudOrder$: ({
    client,
    orderId,
  }: RemoveXudOrderParams) => Observable<RemoveOrderResponse>;
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
  removeXudOrder$,
  createXudOrder$,
}: CreateOpenDEXordersParams): Observable<boolean> => {
  return getXudClient$(config).pipe(
    mergeMap(client => {
      return removeXudOrder$({
        client,
        orderId: '123-orderid',
      }).pipe(mapTo(client));
    }),
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
