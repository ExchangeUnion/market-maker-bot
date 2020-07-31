import { shouldCreateCEXorder, MINIMUM_ORDER_SIZE } from './order-filter';
import BigNumber from 'bignumber.js';
import { testConfig } from '../test-utils';

describe('shouldCreateCEXorder', () => {
  let config = testConfig();

  describe('ETHBTC', () => {
    beforeEach(() => {
      config = {
        ...config,
        BASEASSET: 'ETH',
        QUOTEASSET: 'BTC',
      };
    });

    it('returns true for minimum ETH quantity', () => {
      expect(shouldCreateCEXorder(config)(MINIMUM_ORDER_SIZE.ETH)).toEqual(
        true
      );
    });

    it('returns false less than minimum ETH quantity', () => {
      const quantity = MINIMUM_ORDER_SIZE.ETH.minus(
        new BigNumber('0.000000000000000001')
      );
      expect(shouldCreateCEXorder(config)(quantity)).toEqual(false);
    });
  });

  describe('DAIBTC', () => {
    beforeEach(() => {
      config = {
        ...config,
        BASEASSET: 'DAI',
        QUOTEASSET: 'BTC',
      };
    });

    it('returns true for minimum DAI quantity', () => {
      expect(shouldCreateCEXorder(config)(MINIMUM_ORDER_SIZE.DAI)).toEqual(
        true
      );
    });

    it('returns false less than minimum DAI quantity', () => {
      const quantity = MINIMUM_ORDER_SIZE.DAI.minus(
        new BigNumber('0.000000000000000001')
      );
      expect(shouldCreateCEXorder(config)(quantity)).toEqual(false);
    });
  });

  describe('BTCUSDT', () => {
    beforeEach(() => {
      config = {
        ...config,
        BASEASSET: 'BTC',
        QUOTEASSET: 'USDT',
      };
    });

    it('returns true for minimum USDT quantity', () => {
      expect(shouldCreateCEXorder(config)(MINIMUM_ORDER_SIZE.USDT)).toEqual(
        true
      );
    });

    it('returns false less than minimum USDT quantity', () => {
      const quantity = MINIMUM_ORDER_SIZE.USDT.minus(
        new BigNumber('0.000000000000000001')
      );
      expect(shouldCreateCEXorder(config)(quantity)).toEqual(false);
    });
  });
});
