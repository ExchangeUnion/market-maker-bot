import { Exchange, Order } from 'ccxt';
import { from, Observable } from 'rxjs';

const cancelOrder$ = (exchange: Exchange, orderId: string): Observable<Order> => {
  return from(exchange.cancelOrder(orderId));
};

export { cancelOrder$ };
