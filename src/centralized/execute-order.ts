import BigNumber from 'bignumber.js';
import { Exchange, Order } from 'ccxt';
import { Observable, of, timer } from 'rxjs';
import {
  catchError,
  concatMap,
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
  CEX: Observable<Exchange>;
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
    return CEX.pipe(
      concatMap(exchange => {
        return createOrder$({
          exchange,
          config,
          side: order.side,
          quantity: order.quantity,
        });
      }),
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
          `Starting centralized exchange ${order.side} order (quantity: ${
            order.quantity
          }, price: ${price.toFixed()})`
        );
        return timer(5000).pipe(
          tap(() =>
            logger.info(
              'Centralized exchange order finished. TODO(karl): order fill quantity, price and side.'
            )
          )
        );
      }),
      mapTo(null)
    );
  }
};

export { executeCEXorder$, ExecuteCEXorderParams };
