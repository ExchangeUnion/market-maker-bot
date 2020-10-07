import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { Config } from '../config';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { satsToCoinsStr } from '../utils';

const accumulateOrderFillsForBaseAssetReceived = (config: Config) => {
  return (source: Observable<SwapSuccess>) => {
    const SEED_VALUE = new BigNumber('0');
    return source.pipe(
      scan((acc: BigNumber, curr: SwapSuccess) => {
        const PROFIT_ASSET = 'BTC';
        if (config.BASEASSET === PROFIT_ASSET) {
          // accumulate quote asset sent when profit asset is the base asset
          const quantitySent = new BigNumber(
            satsToCoinsStr(curr.getAmountSent())
          );
          return acc.plus(quantitySent);
        } else {
          // accumulate base asset received when profit asset is not the base asset
          const quantityReceived = new BigNumber(
            satsToCoinsStr(curr.getAmountReceived())
          );
          return acc.plus(quantityReceived);
        }
      }, SEED_VALUE)
    );
  };
};

const accumulateOrderFillsForQuoteAssetReceived = (config: Config) => {
  return (source: Observable<SwapSuccess>) => {
    const SEED_VALUE = new BigNumber('0');
    return source.pipe(
      scan((acc: BigNumber, curr: SwapSuccess) => {
        const PROFIT_ASSET = 'BTC';
        if (config.BASEASSET === PROFIT_ASSET) {
          // accumulate quote asset received when profit asset is the base asset
          const quantityReceived = new BigNumber(
            satsToCoinsStr(curr.getAmountReceived())
          );
          return acc.plus(quantityReceived);
        } else {
          // accumulate base asset sent when profit asset is not base asset
          const quantitySent = new BigNumber(
            satsToCoinsStr(curr.getAmountSent())
          );
          return acc.plus(quantitySent);
        }
      }, SEED_VALUE)
    );
  };
};

export {
  accumulateOrderFillsForBaseAssetReceived,
  accumulateOrderFillsForQuoteAssetReceived,
};
