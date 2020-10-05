import { Dictionary, Exchange, Market } from 'ccxt';
import { Observable } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { Config } from '../../config';

type InitBinanceParams = {
  config: Config;
  loadMarkets$: (exchange: Exchange) => Observable<Dictionary<Market>>;
  getExchange: (config: Config) => Exchange;
};

const initCEX$ = ({
  getExchange,
  config,
  loadMarkets$,
}: InitBinanceParams): Observable<Exchange> => {
  const exchange = getExchange(config);
  return loadMarkets$(exchange).pipe(mapTo(exchange));
};

export { initCEX$, InitBinanceParams };
