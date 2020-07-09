import { of, Observable, forkJoin, empty } from 'rxjs';
import { delay, tap, mergeMap, map, take } from 'rxjs/operators';
import { Logger } from '../logger';
import { Config } from '../config';
import { Exchange, Order } from 'ccxt';

const removeCEXorders$ = (
  logger: Logger,
  config: Config,
  exchange: Exchange,
  fetchOpenOrders$: (exchange: Exchange) => Observable<Order[]>,
  cancelOrder$: (exchange: Exchange, orderId: string) => Observable<Order>
): Observable<unknown> => {
  if (config.LIVE_CEX) {
    const getOrderIds = (orders: Order[]) => orders.map(order => order.id);
    return fetchOpenOrders$(exchange).pipe(
      map(getOrderIds),
      mergeMap(orderIds => {
        const cancelOrders$ = orderIds.map(orderId =>
          cancelOrder$(exchange, orderId)
        );
        if (cancelOrders$.length) {
          return forkJoin(cancelOrders$);
        }
        return empty();
      })
    );
  } else {
    return of(['a']).pipe(
      tap(() => logger.info('Removing CEX orders')),
      delay(1000),
      tap(() => logger.info('Finished removing CEX orders'))
    );
  }
};

export { removeCEXorders$ };
