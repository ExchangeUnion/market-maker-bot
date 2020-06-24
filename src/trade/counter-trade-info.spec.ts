import { getCounterTradeInfo } from './counter-trade-info';
import { SwapSuccess } from '../proto/xudrpc_pb';

describe('getCounterTradeInfo', () => {
  it('gets quantity and asset received', () => {
    const quantityReceived = 2;
    const assetReceived = 'ETH';
    const swapSuccess = {
      getAmountReceived: () => quantityReceived,
      getCurrencyReceived: () => assetReceived,
    } as SwapSuccess;
    expect(
      getCounterTradeInfo({
        swapSuccess,
        asset: assetReceived,
      })
    ).toEqual({
      quantityReceived,
      assetReceived,
    });
  });

  it('ignores quantity for TODO', () => {
    const quantityReceived = 2;
    const assetReceived = 'ETH';
    const swapSuccess = {
      getAmountReceived: () => quantityReceived,
      getCurrencyReceived: () => assetReceived,
    } as SwapSuccess;
    expect(
      getCounterTradeInfo({
        swapSuccess,
        asset: assetReceived,
      })
    ).toEqual({
      quantityReceived,
      assetReceived,
    });
  });
});
