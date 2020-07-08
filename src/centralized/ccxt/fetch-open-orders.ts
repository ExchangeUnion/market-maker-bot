import { Exchange, Order } from 'ccxt';
import { from, Observable } from 'rxjs';

const fetchOpenOrders$ = (exchange: Exchange): Observable<Order[]> => {
  return from(exchange.fetchOpenOrders());
};

export { fetchOpenOrders$ };
