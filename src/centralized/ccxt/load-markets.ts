import { Exchange, Market, Dictionary } from 'ccxt';
import { from, Observable, defer } from 'rxjs';

const loadMarkets$ = (exchange: Exchange): Observable<Dictionary<Market>> => {
  return defer(() => from(exchange.loadMarkets()));
};

export { loadMarkets$ };
