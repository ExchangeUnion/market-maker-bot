import { testConfig, getLoggers } from '../test-utils';
import { getCentralizedExchangePrice$ } from './exchange-price';

describe('getCentralizedExchangePrice$', () => {
  it('returns Binance price stream', () => {
    const config = {
      ...testConfig(),
      ...{ CEX: 'BINANCE' },
    };
    const getBinancePrice$ = jest.fn();
    const getKrakenPrice$ = jest.fn();
    const logger = getLoggers().global;
    getCentralizedExchangePrice$({
      config,
      logger,
      getBinancePrice$,
      getKrakenPrice$,
    });
    expect(getBinancePrice$).toHaveBeenCalledTimes(1);
  });

  it('returns Kraken price stream', () => {
    const config = {
      ...testConfig(),
      ...{ CEX: 'KRAKEN' },
    };
    const getBinancePrice$ = jest.fn();
    const getKrakenPrice$ = jest.fn();
    const logger = getLoggers().global;
    getCentralizedExchangePrice$({
      config,
      logger,
      getBinancePrice$,
      getKrakenPrice$,
    });
    expect(getKrakenPrice$).toHaveBeenCalledTimes(1);
  });

  it('errors for unknown exchange', () => {
    const config = {
      ...testConfig(),
      ...{ CEX: 'ASDF' },
    };
    const getBinancePrice$ = jest.fn();
    const getKrakenPrice$ = jest.fn();
    const logger = getLoggers().global;
    expect(() => {
      getCentralizedExchangePrice$({
        config,
        logger,
        getBinancePrice$,
        getKrakenPrice$,
      });
    }).toThrowErrorMatchingSnapshot();
  });
});
