import BigNumber from 'bignumber.js';
import { getArbyStore } from './store';

describe('ArbyStore', () => {
  it('selectState returns 0 as initial lastSellOrderUpdatePrice', done => {
    const { selectState } = getArbyStore();
    selectState('lastSellOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(new BigNumber('0'));
      done();
    });
  });

  it('selectState returns 0 as initial lastBuyOrderUpdatePrice', done => {
    const { selectState } = getArbyStore();
    selectState('lastBuyOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(new BigNumber('0'));
      done();
    });
  });

  it('selectState returns updated last sell order price', done => {
    const { selectState, updateLastSellOrderUpdatePrice } = getArbyStore();
    const updatedPrice = new BigNumber('123');
    updateLastSellOrderUpdatePrice(updatedPrice);
    selectState('lastSellOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(updatedPrice);
      done();
    });
  });

  it('selectState returns updated last buy order price', done => {
    const { selectState, updateLastBuyOrderUpdatePrice } = getArbyStore();
    const updatedPrice = new BigNumber('123');
    updateLastBuyOrderUpdatePrice(updatedPrice);
    selectState('lastBuyOrderUpdatePrice').subscribe(price => {
      expect(price).toEqual(updatedPrice);
      done();
    });
  });

  it('reset lastOrderUpdatePrice', done => {
    const {
      stateChanges,
      updateLastSellOrderUpdatePrice,
      updateLastBuyOrderUpdatePrice,
      resetLastOrderUpdatePrice,
    } = getArbyStore();
    const updatedPrice = new BigNumber('123');
    updateLastSellOrderUpdatePrice(updatedPrice);
    updateLastBuyOrderUpdatePrice(updatedPrice);
    resetLastOrderUpdatePrice();
    stateChanges().subscribe(state => {
      expect(state.lastSellOrderUpdatePrice).toEqual(new BigNumber('0'));
      expect(state.lastBuyOrderUpdatePrice).toEqual(new BigNumber('0'));
      done();
    });
  });
});
