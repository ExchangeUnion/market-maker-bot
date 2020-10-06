import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { Config } from '../config';
import { Logger } from '../logger';

type GetPriceParams = {
  config: Config;
  logger: Logger;
};

type CentralizedExchangePriceParams = {
  config: Config;
  logger: Logger;
  getKrakenPrice$: ({
    config,
    logger,
  }: GetPriceParams) => Observable<BigNumber>;
  getBinancePrice$: ({
    config,
    logger,
  }: GetPriceParams) => Observable<BigNumber>;
};

const getCentralizedExchangePrice$ = ({
  config,
  logger,
  getKrakenPrice$,
  getBinancePrice$,
}: CentralizedExchangePriceParams): Observable<BigNumber> => {
  switch (config.CEX) {
    case 'BINANCE':
      return getBinancePrice$({ config, logger });
    case 'KRAKEN':
      return getKrakenPrice$({ config, logger });
    default:
      throw new Error(
        `Could not get price feed for unknown exchange: ${config.CEX}`
      );
  }
};

export {
  getCentralizedExchangePrice$,
  CentralizedExchangePriceParams,
  GetPriceParams,
};
