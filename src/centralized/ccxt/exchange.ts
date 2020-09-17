import ccxt, { Exchange } from 'ccxt';
import { Config } from '../../config';

const getExchange = (config: Config): Exchange => {
  switch (config.CEX) {
    case 'Binance':
      return new ccxt.binance({
        apiKey: config.CEX_API_KEY,
        secret: config.CEX_API_SECRET,
      });
    case 'Kraken':
      return new ccxt.kraken({
        apiKey: config.CEX_API_KEY,
        secret: config.CEX_API_SECRET,
      });
    default:
      throw new Error(
        'Could not get centralized exchange. Invalide CEX configuration option'
      );
  }
};

export { getExchange };
