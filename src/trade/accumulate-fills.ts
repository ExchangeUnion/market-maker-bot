import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { satsToCoinsStr } from '../utils';

const accumulateOrderFillsForAsset = (asset: string) => {
  const SEED_VALUE = new BigNumber('0');
  return (source: Observable<SwapSuccess>) => {
    return source.pipe(
      scan((acc: BigNumber, curr: SwapSuccess) => {
        if (curr.getCurrencyReceived() === asset) {
          const quantityReceived = new BigNumber(
            satsToCoinsStr(curr.getAmountReceived())
          );
          const totalQuantityReceived = acc.plus(quantityReceived);
          return totalQuantityReceived;
        } else {
          return acc;
        }
      }, SEED_VALUE)
    );
  };
};

export { accumulateOrderFillsForAsset };
