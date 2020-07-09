import { Exchange, Order } from 'ccxt';
import { empty, forkJoin, Observable, of } from 'rxjs';
import { delay, map, mergeMap, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';

const removeCEXorders$ = (
  logger: Logger,
  config: Config,
  exchange: Exchange,
  fetchOpenOrders$: (exchange: Exchange, config: Config) => Observable<Order[]>,
  cancelOrder$: (
    exchange: Exchange,
    config: Config,
    orderId: string
  ) => Observable<Order>
): Observable<unknown> => {
  if (config.LIVE_CEX) {
    const getOrderIds = (orders: Order[]) => orders.map(order => order.id);
    return fetchOpenOrders$(exchange, config).pipe(
      map(getOrderIds),
      mergeMap(orderIds => {
        const cancelOrders$ = orderIds.map(orderId =>
          cancelOrder$(exchange, config, orderId)
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
