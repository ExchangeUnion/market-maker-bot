import { Exchange, Balances } from 'ccxt';
import { from, Observable } from 'rxjs';

const fetchBalance$ = (exchange: Exchange): Observable<Balances> => {
  return from(exchange.fetchBalance());
};

export { fetchBalance$ };
