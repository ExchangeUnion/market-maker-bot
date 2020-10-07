import {
  quantityAboveMinimum,
  MINIMUM_ORDER_SIZE,
} from './minimum-order-quantity-filter';
import BigNumber from 'bignumber.js';

describe('quantityAboveMinimum', () => {
  it('returns true for minimum ETH quantity', () => {
    expect(quantityAboveMinimum('ETH')(MINIMUM_ORDER_SIZE.ETH)).toEqual(true);
  });

  it('returns false less than minimum ETH quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.ETH.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(quantityAboveMinimum('ETH')(quantity)).toEqual(false);
  });

  it('returns true for minimum DAI quantity', () => {
    expect(quantityAboveMinimum('DAI')(MINIMUM_ORDER_SIZE.DAI)).toEqual(true);
  });

  it('returns false less than minimum DAI quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.DAI.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(quantityAboveMinimum('DAI')(quantity)).toEqual(false);
  });

  it('returns true for minimum USDT quantity', () => {
    expect(quantityAboveMinimum('USDT')(MINIMUM_ORDER_SIZE.USDT)).toEqual(true);
  });

  it('returns false less than minimum USDT quantity', () => {
    const quantity = MINIMUM_ORDER_SIZE.USDT.minus(
      new BigNumber('0.000000000000000001')
    );
    expect(quantityAboveMinimum('USDT')(quantity)).toEqual(false);
  });

  it('throws for unknown asset KILRAU', () => {
    expect.assertions(1);
    const quantity = new BigNumber('1');
    expect(() => {
      quantityAboveMinimum('KILRAU')(quantity);
    }).toThrowErrorMatchingSnapshot();
  });
});
