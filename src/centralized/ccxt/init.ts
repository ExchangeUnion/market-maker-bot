import { Dictionary, Exchange, Market } from 'ccxt';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Config } from '../../config';

type InitCEXparams = {
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
}: InitCEXparams): Observable<InitCEXResponse> => {
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

export { initCEX$, InitCEXparams, InitCEXResponse };
