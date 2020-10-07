import { Dictionary, Exchange, Market } from 'ccxt';
import { defer, from, Observable } from 'rxjs';

const loadMarkets$ = (exchange: Exchange): Observable<Dictionary<Market>> => {
  return defer(() => from(exchange.loadMarkets()));
};

export { loadMarkets$ };
