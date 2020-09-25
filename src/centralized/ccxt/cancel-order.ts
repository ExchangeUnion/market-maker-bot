import { Exchange, Order } from 'ccxt';
import { from, Observable, defer } from 'rxjs';
import { Config } from '../../config';

const cancelOrder$ = (
  exchange: Exchange,
  config: Config,
  orderId: string
): Observable<Order> => {
  return defer(() =>
    from(
      exchange.cancelOrder(
        orderId,
        `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`
      )
    )
  );
};

export { cancelOrder$ };
