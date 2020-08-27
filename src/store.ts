import BigNumber from 'bignumber.js';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { scan, pluck, distinctUntilKeyChanged } from 'rxjs/operators';

type ArbyStore = {
  updateLastOrderUpdatePrice: (price: BigNumber) => void;
  resetLastOrderUpdatePrice: () => void;
  selectState: (stateKey: ArbyStoreDataKeys) => Observable<BigNumber>;
};

type ArbyStoreData = {
  lastPriceUpdate: BigNumber;
};

type ArbyStoreDataKeys = keyof ArbyStoreData;

const getArbyStore = (): ArbyStore => {
  const initialState: ArbyStoreData = {
    lastPriceUpdate: new BigNumber('0'),
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
  const updateLastOrderUpdatePrice = (price: BigNumber) => {
    stateUpdates.next({
      lastPriceUpdate: price,
    });
  };

  const resetLastOrderUpdatePrice = () => {
    stateUpdates.next({
      lastPriceUpdate: new BigNumber('0'),
    });
  };
  const selectState = (stateKey: ArbyStoreDataKeys) => {
    return store.pipe(distinctUntilKeyChanged(stateKey), pluck(stateKey));
  };
  return {
    updateLastOrderUpdatePrice,
    selectState,
    resetLastOrderUpdatePrice,
  };
};

export { getArbyStore, ArbyStore };
