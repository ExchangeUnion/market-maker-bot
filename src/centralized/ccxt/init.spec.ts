import ccxt from 'ccxt';
import { initBinance } from './init';
import { testConfig } from '../../test-utils';

jest.mock('ccxt');

describe('CCXT', () => {
  it('initializes binance with api key and secret', () => {
    const config = testConfig();
    initBinance(config);
    expect(ccxt.binance).toHaveBeenCalledTimes(1);
    expect(ccxt.binance).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: config.BINANCE_API_KEY,
        secret: config.BINANCE_API_SECRET,
      })
    );
  });
});
