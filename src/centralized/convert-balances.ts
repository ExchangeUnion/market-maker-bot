import { Balances } from 'ccxt';
import { ExchangeAssetAllocation } from '../trade/info';
import { Config } from '../config';
import BigNumber from 'bignumber.js';

const convertBalances = (
  config: Config,
  balances: Balances
): ExchangeAssetAllocation => {
  const baseAssetTotal =
    (balances[config.CEX_BASEASSET] && balances[config.CEX_BASEASSET].total) ||
    '0';
  const baseAssetBalance = new BigNumber(baseAssetTotal);
  const quoteAssetTotal =
    (balances[config.CEX_QUOTEASSET] &&
      balances[config.CEX_QUOTEASSET].total) ||
    '0';
  const quoteAssetBalance = new BigNumber(quoteAssetTotal);
  return {
    baseAssetBalance,
    quoteAssetBalance,
  };
};

export { convertBalances };
