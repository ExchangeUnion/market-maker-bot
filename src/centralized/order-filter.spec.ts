import { shouldCreateCEXorder, MINIMUM_ORDER_SIZE } from './order-filter';
import BigNumber from 'bignumber.js';

describe('shouldCreateCEXorder', () => {
  it('returns true for minimum BTC quantity', () => {
    expect(shouldCreateCEXorder('BTC')(MINIMUM_ORDER_SIZE.BTC)).toEqual(true);
  });

  it('returns false for less than minimum BTC quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.BTC.minus(new BigNumber('0.00000001'));
    expect(shouldCreateCEXorder('BTC')(quantity)).toEqual(false);
  });

  it('returns true for minimum ETH quantity', () => {
    expect(shouldCreateCEXorder('ETH')(MINIMUM_ORDER_SIZE.ETH)).toEqual(true);
  });

  it('returns false less than minimum ETH quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.ETH.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(shouldCreateCEXorder('ETH')(quantity)).toEqual(false);
  });
});
