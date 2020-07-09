import { Exchange, Order } from 'ccxt';
import { from, Observable, defer } from 'rxjs';

const fetchOpenOrders$ = (exchange: Exchange): Observable<Order[]> => {
  return defer(() => from(exchange.fetchOpenOrders()));
};

export { fetchOpenOrders$ };
