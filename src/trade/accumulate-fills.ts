import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { satsToCoinsStr } from '../utils';
import { Asset } from '../constants';

const accumulateOrderFillsForAsset = (asset: Asset) => {
  const SEED_VALUE = new BigNumber('0');
  const ETHaccumulator = (acc: BigNumber, curr: SwapSuccess) => {
    if (curr.getCurrencyReceived() === asset) {
      const quantityReceived = new BigNumber(
        satsToCoinsStr(curr.getAmountReceived())
      );
      return acc.plus(quantityReceived);
    } else {
      return acc;
    }
  };
  const BTCaccumulator = (acc: BigNumber, curr: SwapSuccess) => {
    if (curr.getCurrencyReceived() === asset) {
      const quantitySent = new BigNumber(satsToCoinsStr(curr.getAmountSent()));
      return acc.plus(quantitySent);
    } else {
      return acc;
    }
  };
  const getAccumulator = (asset: Asset) => {
    switch (asset) {
      case 'ETH':
        return ETHaccumulator;
      case 'BTC':
        return BTCaccumulator;
      default:
        throw new Error('Unrecognized asset to accumulate');
    }
  };
  return (source: Observable<SwapSuccess>) => {
    return source.pipe(scan(getAccumulator(asset), SEED_VALUE));
  };
};

export { accumulateOrderFillsForAsset };
