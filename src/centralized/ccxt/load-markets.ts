import { Exchange, Market, Dictionary } from 'ccxt';
import { from, Observable } from 'rxjs';

const loadMarkets$ = (exchange: Exchange): Observable<Dictionary<Market>> => {
  return from(exchange.loadMarkets());
};

export { loadMarkets$ };
