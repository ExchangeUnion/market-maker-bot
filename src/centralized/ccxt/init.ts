import { Dictionary, Exchange, Market } from 'ccxt';
import { Observable } from 'rxjs';
import { mapTo, map } from 'rxjs/operators';
import { Config } from '../../config';

type InitBinanceParams = {
  config: Config;
  loadMarkets$: (exchange: Exchange) => Observable<Dictionary<Market>>;
  getExchange: (config: Config) => Exchange;
};

type InitCEXResponse = {
  markets: Dictionary<Market>;
  exchange: Exchange;
};

const initCEX$ = ({
  getExchange,
  config,
  loadMarkets$,
}: InitBinanceParams): Observable<InitCEXResponse> => {
  const exchange = getExchange(config);
  return loadMarkets$(exchange).pipe(
    map(markets => {
      return {
        markets,
        exchange,
      };
    })
  );
};

export { initCEX$, InitBinanceParams, InitCEXResponse };
