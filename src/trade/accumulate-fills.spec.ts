import { accumulateOrderFills } from './accumulate-fills';
import { SwapSuccess } from '../proto/xudrpc_pb';
import BigNumber from 'bignumber.js';

describe('accumulateOrderFills', () => {
  it('accumulates received quantity', () => {
    const quantityReceived = 2;
    const assetReceived = 'ETH';
    const swapSuccess = {
      getAmountReceived: () => quantityReceived,
      getCurrencyReceived: () => assetReceived,
    } as SwapSuccess;
    const counterTradeInfo = new BigNumber('1');
    expect(
      accumulateOrderFills(assetReceived)(counterTradeInfo, swapSuccess)
    ).toEqual(new BigNumber(quantityReceived).plus(counterTradeInfo));
  });
});
