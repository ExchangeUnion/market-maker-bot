import BigNumber from 'bignumber.js';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { scan, pluck, distinctUntilKeyChanged } from 'rxjs/operators';
import { Dictionary, Market } from 'ccxt';

type ArbyStore = {
  updateLastSellOrderUpdatePrice: (price: BigNumber) => void;
  updateLastBuyOrderUpdatePrice: (price: BigNumber) => void;
  resetLastOrderUpdatePrice: () => void;
  setMarkets: (markets: Dictionary<Market>) => void;
  selectState: (
    stateKey: ArbyStoreDataKeys
  ) => Observable<BigNumber | Dictionary<Market>>;
  stateChanges: () => Observable<ArbyStoreData>;
};

type ArbyStoreData = {
  lastSellOrderUpdatePrice: BigNumber;
  lastBuyOrderUpdatePrice: BigNumber;
  markets: Dictionary<Market>;
};

type ArbyStoreDataKeys = keyof ArbyStoreData;

const getArbyStore = (): ArbyStore => {
  const initialState: ArbyStoreData = {
    lastSellOrderUpdatePrice: new BigNumber('0'),
    lastBuyOrderUpdatePrice: new BigNumber('0'),
    markets: {},
  };
  const store = new BehaviorSubject(initialState);
  const stateUpdates = new Subject() as Subject<Partial<ArbyStoreData>>;
  stateUpdates
    .pipe(
      scan((acc, curr) => {
        return { ...acc, ...curr };
      }, initialState)
    )
    .subscribe(store);
  const updateLastSellOrderUpdatePrice = (price: BigNumber) => {
    stateUpdates.next({
      lastSellOrderUpdatePrice: price,
    });
  };
  const updateLastBuyOrderUpdatePrice = (price: BigNumber) => {
    stateUpdates.next({
      lastBuyOrderUpdatePrice: price,
    });
  };
  const resetLastOrderUpdatePrice = () => {
    stateUpdates.next({
      lastSellOrderUpdatePrice: new BigNumber('0'),
      lastBuyOrderUpdatePrice: new BigNumber('0'),
    });
  };
  const setMarkets = (markets: Dictionary<Market>) => {
    stateUpdates.next({
      markets,
    });
  };
  const selectState = (stateKey: ArbyStoreDataKeys) => {
    return store.pipe(distinctUntilKeyChanged(stateKey), pluck(stateKey));
  };
  const stateChanges = () => {
    return store.asObservable();
  };
  return {
    updateLastSellOrderUpdatePrice,
    updateLastBuyOrderUpdatePrice,
    selectState,
    resetLastOrderUpdatePrice,
    stateChanges,
    setMarkets,
  };
};

export { getArbyStore, ArbyStore };
