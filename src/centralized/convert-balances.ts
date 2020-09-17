import { Balances } from 'ccxt';
import { ExchangeAssetAllocation } from '../trade/info';
import { Config } from '../config';
import BigNumber from 'bignumber.js';

const convertBalances = (
  config: Config,
  balances: Balances
): ExchangeAssetAllocation => {
  const baseAssetTotal =
    (balances[config.BASEASSET] && balances[config.BASEASSET].total) || '0';
  const baseAssetBalance = new BigNumber(baseAssetTotal);
  const quoteAssetTotal =
    (balances[config.QUOTEASSET] && balances[config.QUOTEASSET].total) || '0';
  const quoteAssetBalance = new BigNumber(quoteAssetTotal);
  return {
    baseAssetBalance,
    quoteAssetBalance,
  };
};

export { convertBalances };
