import { Balances } from 'ccxt';
import { ExchangeAssetAllocation } from '../trade/info';
import { Config } from '../config';
import BigNumber from 'bignumber.js';

const convertBalances = (
  config: Config,
  balances: Balances
): ExchangeAssetAllocation => {
  const baseAssetBalance = new BigNumber(balances[config.BASEASSET].total);
  const quoteAssetBalance = new BigNumber(balances[config.QUOTEASSET].total);
  return {
    baseAssetBalance,
    quoteAssetBalance,
  };
};

export { convertBalances };
