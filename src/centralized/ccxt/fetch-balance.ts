import { Exchange, Balances } from 'ccxt';
import { from, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

const fetchBalance$ = (
  exchange: Observable<Exchange>
): Observable<Balances> => {
  return exchange.pipe(
    mergeMap(exchange => {
      return from(exchange.fetchBalance());
    })
  );
};

export { fetchBalance$ };
