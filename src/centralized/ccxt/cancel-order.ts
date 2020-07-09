import { Exchange, Order } from 'ccxt';
import { from, Observable, defer } from 'rxjs';

const cancelOrder$ = (
  exchange: Exchange,
  orderId: string
): Observable<Order> => {
  return defer(() => from(exchange.cancelOrder(orderId)));
};

export { cancelOrder$ };
