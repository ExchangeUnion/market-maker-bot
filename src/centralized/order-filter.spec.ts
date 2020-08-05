import { shouldCreateCEXorder, MINIMUM_ORDER_SIZE } from './order-filter';
import BigNumber from 'bignumber.js';

describe('shouldCreateCEXorder', () => {
  it('returns true for minimum ETH quantity', () => {
    expect(shouldCreateCEXorder('ETH')(MINIMUM_ORDER_SIZE.ETH)).toEqual(true);
  });

  it('returns false less than minimum ETH quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.ETH.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(shouldCreateCEXorder('ETH')(quantity)).toEqual(false);
  });

  it('returns true for minimum DAI quantity', () => {
    expect(shouldCreateCEXorder('DAI')(MINIMUM_ORDER_SIZE.DAI)).toEqual(true);
  });

  it('returns false less than minimum DAI quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.DAI.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(shouldCreateCEXorder('DAI')(quantity)).toEqual(false);
  });

  it('returns true for minimum USDT quantity', () => {
    expect(shouldCreateCEXorder('USDT')(MINIMUM_ORDER_SIZE.USDT)).toEqual(true);
  });

  it('returns false less than minimum USDT quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.USDT.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(shouldCreateCEXorder('USDT')(quantity)).toEqual(false);
  });
});
