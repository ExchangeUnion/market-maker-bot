import ccxt from 'ccxt';
import { testConfig } from '../../test-utils';
import { getExchange } from './exchange';

jest.mock('ccxt');

describe('getExchange', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Binance with API key and secret', () => {
    const config = {
      ...testConfig(),
      ...{ CEX: 'Binance' },
    };
    getExchange(config);
    expect(ccxt.binance).toHaveBeenCalledTimes(1);
    expect(ccxt.binance).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: config.CEX_API_KEY,
        secret: config.CEX_API_SECRET,
      })
    );
  });

  it('initializes Kraken with API key and secret', () => {
    const config = {
      ...testConfig(),
      ...{ CEX: 'Kraken' },
    };
    getExchange(config);
    expect(ccxt.kraken).toHaveBeenCalledTimes(1);
    expect(ccxt.kraken).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: config.CEX_API_KEY,
        secret: config.CEX_API_SECRET,
      })
    );
  });

  it('throws for unsupported exchange', () => {
    expect.assertions(1);
    const config = {
      ...testConfig(),
      ...{ CEX: 'Michael' },
    };
    try {
      getExchange(config);
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });
});
