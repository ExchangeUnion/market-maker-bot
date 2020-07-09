import { Balances, Exchange } from 'ccxt';
import { defer, from, Observable } from 'rxjs';

const fetchBalance$ = (exchange: Exchange): Observable<Balances> => {
  return defer(() => from(exchange.fetchBalance()));
};

export { fetchBalance$ };
