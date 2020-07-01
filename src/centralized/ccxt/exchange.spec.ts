import ccxt from 'ccxt';
import { testConfig } from '../../test-utils';
import { getExchange } from './exchange';

jest.mock('ccxt');

describe('getExchange', () => {
  it('initializes exchange with API key and secret', () => {
    const config = testConfig();
    getExchange(config);
    expect(ccxt.binance).toHaveBeenCalledTimes(1);
    expect(ccxt.binance).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: config.BINANCE_API_KEY,
        secret: config.BINANCE_API_SECRET,
      })
    );
  });
});
