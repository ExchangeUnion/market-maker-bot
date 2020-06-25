import { SwapSuccess } from '../proto/xudrpc_pb';
import BigNumber from 'bignumber.js';

const accumulateOrderFills = (asset: string) => {
  return (acc: BigNumber, curr: SwapSuccess): BigNumber => {
    const quantityReceived = new BigNumber(curr.getAmountReceived());
    // TODO: convert satoshis to coins
    const totalQuantityReceived = acc.plus(quantityReceived);
    return totalQuantityReceived;
  };
};

export { accumulateOrderFills };
