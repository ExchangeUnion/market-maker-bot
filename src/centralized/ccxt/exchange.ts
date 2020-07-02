import ccxt, { Exchange } from 'ccxt';
import { Config } from '../../config';

const getExchange = (config: Config): Exchange => {
  return new ccxt.binance({
    apiKey: config.BINANCE_API_KEY,
    secret: config.BINANCE_API_SECRET,
  });
};

export { getExchange };
