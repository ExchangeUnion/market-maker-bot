import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { SwapSuccess } from '../proto/xudrpc_pb';

const accumulateFillsScan = (
  accumulator: (acc: BigNumber, curr: SwapSuccess) => BigNumber,
  startingValue: BigNumber
) => {
  return (source: Observable<SwapSuccess>) => {
    return source.pipe(scan(accumulator, startingValue));
  };
};

export { accumulateFillsScan };
