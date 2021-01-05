import BigNumber from 'bignumber.js';
import { Dictionary, Market } from 'ccxt';
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

  it('selectState returns empty initial markets', done => {
    const { selectState } = getArbyStore();
    selectState('markets').subscribe(markets => {
      expect(markets).toEqual({});
      done();
    });
  });

  it('selectState returns updated markets', done => {
    const { selectState, setMarkets } = getArbyStore();
    const testMarkets = ({ 'BTC/USDT': true } as unknown) as Dictionary<Market>;
    setMarkets(testMarkets);
    selectState('markets').subscribe(markets => {
      expect(markets).toEqual(testMarkets);
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
