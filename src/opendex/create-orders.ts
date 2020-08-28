import { status } from '@grpc/grpc-js';
import BigNumber from 'bignumber.js';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, mapTo, mergeMap, take, tap } from 'rxjs/operators';
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
    tap(() => logger.trace('Starting to update OpenDEX orders')),
    // create new buy and sell orders
    mergeMap(client => {
      const tradeInfo = getTradeInfo();
      return store.selectState('lastOrderUpdatePrice').pipe(
        take(1),
        mergeMap(lastOrderUpdatePrice => {
          /*
          console.log(
            'tradeinfo price and last price',
            tradeInfo.price.toFixed(),
            lastOrderUpdatePrice.toFixed()
          );
          */
          if (
            shouldCreateOpenDEXorders(tradeInfo.price, lastOrderUpdatePrice)
          ) {
            // build orders based on all the available trade info
            const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders({
              config,
              tradeInfo,
            });
            // try replacing existing buy order
            const buyOrder$ = createXudOrder$({
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
                  store.updateLastOrderUpdatePrice(tradeInfo.price);
                return of(orderResponse);
              })
            );
            // try replacing existing sell order
            const sellOrder$ = createXudOrder$({
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
                  store.updateLastOrderUpdatePrice(tradeInfo.price);
                return of(orderResponse);
              })
            );
            const ordersComplete$ = forkJoin(sellOrder$, buyOrder$).pipe(
              mapTo(true)
            );
            return ordersComplete$;
          } else {
            return of(true);
          }
        })
      );
    }),
    tap(() => logger.trace('OpenDEX orders updated')),
    take(1)
  );
};

export { createOpenDEXorders$, CreateOpenDEXordersParams, OpenDEXorders };
