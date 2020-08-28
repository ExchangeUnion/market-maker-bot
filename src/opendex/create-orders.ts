import { status } from '@grpc/grpc-js';
import BigNumber from 'bignumber.js';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, mapTo, mergeMap, take } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { OrderSide, PlaceOrderResponse } from '../proto/xudrpc_pb';
import { ArbyStore } from '../store';
import { TradeInfo } from '../trade/info';
import {
  createOrderID,
  OpenDEXorders,
  TradeInfoToOpenDEXordersParams,
} from './orders';
import { CreateXudOrderParams } from './xud/create-order';

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
  store: ArbyStore;
  shouldCreateOpenDEXorders: (
    newPrice: BigNumber,
    lastPriceUpdate: BigNumber
  ) => boolean;
};

const createOpenDEXorders$ = ({
  config,
  logger,
  getTradeInfo,
  tradeInfoToOpenDEXorders,
  getXudClient$,
  createXudOrder$,
  store,
  shouldCreateOpenDEXorders,
}: CreateOpenDEXordersParams): Observable<boolean> => {
  return getXudClient$(config).pipe(
    // create new buy and sell orders
    mergeMap(client => {
      const tradeInfo = getTradeInfo();
      return store.stateChanges().pipe(
        take(1),
        mergeMap(storeState => {
          // build orders based on all the available trade info
          const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders({
            config,
            tradeInfo,
          });
          let buyOrder$ = (of(null) as unknown) as Observable<
            PlaceOrderResponse
          >;
          let sellOrder$ = (of(null) as unknown) as Observable<
            PlaceOrderResponse
          >;
          if (
            shouldCreateOpenDEXorders(
              tradeInfo.price,
              storeState.lastBuyOrderUpdatePrice
            )
          ) {
            // try replacing existing buy order
            buyOrder$ = createXudOrder$({
              ...{ client, logger },
              ...buyOrder,
              ...{
                replaceOrderId: createOrderID(config, OrderSide.BUY),
              },
            }).pipe(
              catchError(e => {
                if (e.code === status.NOT_FOUND) {
                  // place order if existing one does not exist
                  return createXudOrder$({
                    ...{ client, logger },
                    ...buyOrder,
                  });
                }
                return throwError(e);
              }),
              mergeMap(orderResponse => {
                orderResponse &&
                  store.updateLastBuyOrderUpdatePrice(tradeInfo.price);
                return of(orderResponse);
              })
            );
          }
          if (
            shouldCreateOpenDEXorders(
              tradeInfo.price,
              storeState.lastSellOrderUpdatePrice
            )
          ) {
            // try replacing existing sell order
            sellOrder$ = createXudOrder$({
              ...{ client, logger },
              ...sellOrder,
              ...{
                replaceOrderId: createOrderID(config, OrderSide.SELL),
              },
            }).pipe(
              catchError(e => {
                if (e.code === status.NOT_FOUND) {
                  // place order if existing one does not exist
                  return createXudOrder$({
                    ...{ client, logger },
                    ...sellOrder,
                  });
                }
                return throwError(e);
              }),
              mergeMap(orderResponse => {
                orderResponse &&
                  store.updateLastSellOrderUpdatePrice(tradeInfo.price);
                return of(orderResponse);
              })
            );
          }
          const ordersComplete$ = forkJoin(sellOrder$, buyOrder$).pipe(
            mapTo(true)
          );
          return ordersComplete$;
        })
      );
    }),
    take(1)
  );
};

export { createOpenDEXorders$, CreateOpenDEXordersParams, OpenDEXorders };
