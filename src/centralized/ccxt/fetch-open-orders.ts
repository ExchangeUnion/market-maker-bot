import { Exchange, Order } from 'ccxt';
import { defer, from, Observable } from 'rxjs';
import { Config } from '../../config';

const fetchOpenOrders$ = (
  exchange: Exchange,
  config: Config
): Observable<Order[]> => {
  return defer(() =>
    from(
      exchange.fetchOpenOrders(
        `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`
      )
    )
  );
};

export { fetchOpenOrders$ };
