import { of, Observable } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
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
  return of('a').pipe(
    tap(() => logger.info('Removing CEX orders - TODO(karl)')),
    delay(1000),
    tap(() => logger.info('Finished removing CEX orders - TODO(karl)'))
  );
};

export { removeCEXorders$ };
