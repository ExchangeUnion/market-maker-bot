import BigNumber from 'bignumber.js';
import { Exchange, Order } from 'ccxt';
import { Observable, of, timer } from 'rxjs';
import {
  catchError,
  mapTo,
  mergeMap,
  mergeMapTo,
  take,
  tap,
} from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { CreateOrderParams } from './ccxt/create-order';
import { CEXorder } from './order-builder';

type ExecuteCEXorderParams = {
  CEX: Exchange;
  config: Config;
  logger: Logger;
  price: BigNumber;
  order: CEXorder;
  createOrder$: ({
    config,
    exchange,
    side,
    quantity,
  }: CreateOrderParams) => Observable<Order>;
};

const executeCEXorder$ = ({
  CEX,
  config,
  logger,
  price,
  order,
  createOrder$,
}: ExecuteCEXorderParams): Observable<null> => {
  if (config.LIVE_CEX) {
    logger.info(
      `Starting centralized exchange ${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET} market ${order.side} order (quantity: ${order.quantity})`
    );
    return createOrder$({
      exchange: CEX,
      config,
      side: order.side,
      quantity: order.quantity,
    }).pipe(
      tap(order =>
        logger.info(
          `Centralized exchange order finished: ${JSON.stringify(order)}`
        )
      ),
      catchError((e, caught) => {
        logger.warn(`Failed to execute CEX order: ${e}. Retrying in 1000ms`);
        return timer(1000).pipe(mergeMapTo(caught));
      }),
      mapTo(null),
      take(1)
    );
  } else {
    return of(price).pipe(
      mergeMap(price => {
        logger.info(
          `Starting centralized exchange ${config.CEX_BASEASSET}/${
            config.CEX_QUOTEASSET
          } market ${order.side} order (quantity: ${
            order.quantity
          }, price: ${price.toFixed()})`
        );
        return timer(5000).pipe(
          tap(() => logger.info('Centralized exchange order finished.'))
        );
      }),
      mapTo(null)
    );
  }
};

export { executeCEXorder$, ExecuteCEXorderParams };
