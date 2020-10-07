import { testConfig } from '../test-utils';
import { verifyMarkets } from './verify-markets';
import { Dictionary, Market } from 'ccxt';

describe('verifyMarkets', () => {
  const CEXmarkets: Dictionary<Market> = {
    'BTC/USD': {
      active: true,
    } as Market,
  };

  it('throws when BTC/USD trading pair not exist', () => {
    expect.assertions(1);
    const markets = {
      ...CEXmarkets,
    };
    delete markets['BTC/USD'];
    const config = {
      ...testConfig(),
      ...{ CEX_BASEASSET: 'BTC', CEX_QUOTEASSET: 'USD' },
    };
    expect(() => {
      verifyMarkets(config, markets);
    }).toThrowErrorMatchingSnapshot();
  });

  it.only('throws when BTC/USD trading pair is inactive', () => {
    expect.assertions(1);
    const markets = {
      ...CEXmarkets,
    };
    delete markets['BTC/USD'].active;
    const config = {
      ...testConfig(),
      ...{ CEX_BASEASSET: 'BTC', CEX_QUOTEASSET: 'USD' },
    };
    expect(() => {
      verifyMarkets(config, markets);
    }).toThrowErrorMatchingSnapshot();
  });

  it('returns true when BTC/USD trading pair exist', () => {
    expect.assertions(1);
    const config = {
      ...testConfig(),
      ...{ CEX_BASEASSET: 'BTC', CEX_QUOTEASSET: 'USD' },
    };
    expect(verifyMarkets(config, CEXmarkets)).toEqual(true);
  });
});
