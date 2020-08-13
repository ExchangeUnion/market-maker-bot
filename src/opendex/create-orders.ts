import { status } from '@grpc/grpc-js';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, mapTo, mergeMap, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { PlaceOrderResponse } from '../proto/xudrpc_pb';
import { TradeInfo } from '../trade/info';
import {
  OpenDEXorders,
  TradeInfoToOpenDEXordersParams,
  createOrderID,
} from './orders';
import { CreateXudOrderParams } from './xud/create-order';
import { OrderSide } from '../proto/xudrpc_pb';

type CreateOpenDEXordersParams = {
  config: Config;
  logger: Logger;
  getTradeInfo: () => TradeInfo;
  tradeInfoToOpenDEXorders: ({
    tradeInfo,
    config,
  }: TradeInfoToOpenDEXordersParams) => OpenDEXorders;
  getXudClient$: (config: Config) => Observable<XudClient>;
  createXudOrder$: ({
    client,
    logger,
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
  createXudOrder$,
}: CreateOpenDEXordersParams): Observable<boolean> => {
  return getXudClient$(config).pipe(
    tap(() => logger.trace('Starting to update OpenDEX orders')),
    // create new buy and sell orders
    mergeMap(client => {
      const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders({
        config,
        tradeInfo: getTradeInfo(),
      });
      const buyOrder$ = createXudOrder$({
        ...{ client, logger },
        ...buyOrder,
        ...{
          replaceOrderId: createOrderID(config, OrderSide.BUY),
        },
      }).pipe(
        catchError(e => {
          if (e.code === status.NOT_FOUND) {
            return createXudOrder$({
              ...{ client, logger },
              ...buyOrder,
            });
          }
          return throwError(e);
        })
      );
      const sellOrder$ = createXudOrder$({
        ...{ client, logger },
        ...sellOrder,
        ...{
          replaceOrderId: createOrderID(config, OrderSide.SELL),
        },
      }).pipe(
        catchError(e => {
          if (e.code === status.NOT_FOUND) {
            return createXudOrder$({
              ...{ client, logger },
              ...sellOrder,
            });
          }
          return throwError(e);
        })
      );
      const ordersComplete$ = forkJoin(sellOrder$, buyOrder$).pipe(mapTo(true));
      return ordersComplete$;
    }),
    tap(() => logger.trace('OpenDEX orders updated')),
    take(1)
  );
};

export { createOpenDEXorders$, CreateOpenDEXordersParams, OpenDEXorders };
