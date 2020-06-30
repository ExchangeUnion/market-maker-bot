import { Config } from '../../config';
import ccxt from 'ccxt';

const initBinance = (config: Config) => {
  return new ccxt.binance({
    apiKey: config.BINANCE_API_KEY,
    secret: config.BINANCE_API_SECRET,
  });
};

export { initBinance };
