import { Dictionary, Market } from 'ccxt';
import { Config } from '../config';
import { errors } from '../opendex/errors';

const verifyMarkets = (config: Config, CEXmarkets: Dictionary<Market>) => {
  const tradingPair = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
  if (CEXmarkets[tradingPair]) {
    return true;
  }
  throw errors.CEX_INVALID_TRADING_PAIR(tradingPair, config.CEX);
};

export { verifyMarkets };
