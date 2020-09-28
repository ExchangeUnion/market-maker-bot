import { convertBalances } from './convert-balances';
import { testConfig } from '../test-utils';
import { Balances } from 'ccxt';
import BigNumber from 'bignumber.js';

describe('convertBalances', () => {
  it('converts CCXT Balances to ExchangeAssetAllocation', () => {
    const config = testConfig();
    const balances = ({} as unknown) as Balances;
    balances[config.CEX_BASEASSET] = {
      free: 10,
      used: 10,
      total: 20,
    };
    balances[config.CEX_QUOTEASSET] = {
      free: 1,
      used: 1,
      total: 2,
    };
    expect(convertBalances(config, balances)).toEqual({
      baseAssetBalance: new BigNumber('20'),
      quoteAssetBalance: new BigNumber('2'),
    });
  });

  it('returns 0 when CCXT balance does not exist', () => {
    const config = testConfig();
    const balances = ({} as unknown) as Balances;
    expect(convertBalances(config, balances)).toEqual({
      baseAssetBalance: new BigNumber('0'),
      quoteAssetBalance: new BigNumber('0'),
    });
  });
});
