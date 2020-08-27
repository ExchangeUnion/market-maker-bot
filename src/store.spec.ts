import { getArbyStore } from './store';
import BigNumber from 'bignumber.js';

describe('ArbyStore', () => {
  it('selectState returns 0 as initial lastOrderUpdatePrice', done => {
    const { selectState } = getArbyStore();
    selectState('lastOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(new BigNumber('0'));
      done();
    });
  });

  it('selectState returns updated last price', done => {
    const { selectState, updateLastOrderUpdatePrice } = getArbyStore();
    const updatedPrice = new BigNumber('123');
    updateLastOrderUpdatePrice(updatedPrice);
    selectState('lastOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(updatedPrice);
      done();
    });
  });

  it('reset lastOrderUpdatePrice', done => {
    const {
      selectState,
      updateLastOrderUpdatePrice,
      resetLastOrderUpdatePrice,
    } = getArbyStore();
    const updatedPrice = new BigNumber('123');
    updateLastOrderUpdatePrice(updatedPrice);
    resetLastOrderUpdatePrice();
    selectState('lastOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(new BigNumber('0'));
      done();
    });
  });
});
