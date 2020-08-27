import { getArbyStore } from './store';
import BigNumber from 'bignumber.js';

describe('ArbyStore', () => {
  it('selectState returns 0 as initial lastPriceUpdate', done => {
    const { selectState } = getArbyStore();
    selectState('lastPriceUpdate').subscribe(price => {
      expect(price).toEqual(new BigNumber('0'));
      done();
    });
  });

  it('selectState returns updated last price', done => {
    const { selectState, updateLastPrice } = getArbyStore();
    const updatedPrice = new BigNumber('123');
    updateLastPrice(updatedPrice);
    selectState('lastPriceUpdate').subscribe(price => {
      expect(price).toEqual(updatedPrice);
      done();
    });
  });
});
