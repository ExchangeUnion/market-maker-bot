import { convertBalances } from './convert-balances';
import { testConfig } from '../test-utils';
import { Balances } from 'ccxt';
import BigNumber from 'bignumber.js';

describe('convertBalances', () => {
  it('converts CCXT Balances to ExchangeAssetAllocation', () => {
    const config = testConfig();
    const balances = ({} as unknown) as Balances;
    balances[config.BASEASSET] = {
      free: 10,
      used: 10,
      total: 20,
    };
    balances[config.QUOTEASSET] = {
      free: 1,
      used: 1,
      total: 2,
    };
    expect(convertBalances(config, balances)).toEqual({
      baseAssetBalance: new BigNumber('20'),
      quoteAssetBalance: new BigNumber('2'),
    });
  });
});
