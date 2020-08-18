import { shouldCreateOpenDEXorders } from './should-create-orders';
import BigNumber from 'bignumber.js';

describe('shouldCreateOpenDEXorders', () => {
  it('returns true when price increases by 0.1%', () => {
    const newPrice = new BigNumber('10000');
    const lastPriceUpdate = new BigNumber('10010.1');
    expect(shouldCreateOpenDEXorders(newPrice, lastPriceUpdate)).toEqual(true);
  });

  it('returns true when price decreases by 0.1%', () => {
    const newPrice = new BigNumber('10000');
    const lastPriceUpdate = new BigNumber('9989.9');
    expect(shouldCreateOpenDEXorders(newPrice, lastPriceUpdate)).toEqual(true);
  });

  it('returns false when price increases less than 0.1%', () => {
    const newPrice = new BigNumber('10000');
    const lastPriceUpdate = new BigNumber('10009.9');
    expect(shouldCreateOpenDEXorders(newPrice, lastPriceUpdate)).toEqual(false);
  });

  it('returns false when price decreases less than 0.1%', () => {
    const newPrice = new BigNumber('10000');
    const lastPriceUpdate = new BigNumber('9990.1');
    expect(shouldCreateOpenDEXorders(newPrice, lastPriceUpdate)).toEqual(false);
  });
});
