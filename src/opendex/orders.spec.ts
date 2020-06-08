import { tradeInfoToOpenDEXorders } from './orders';
import BigNumber from 'bignumber.js';
import { OrderSide } from '../broker/opendex/proto/xudrpc_pb';

describe('tradeInfoToOpenDEXorders', () => {
  it('fails', () => {
    const tradeInfo = {
      price: new BigNumber('10000'),
      assets: {
        openDEX: {
          baseAssetBalance: new BigNumber('30'),
          quoteAssetBalance: new BigNumber('200'),
        },
        centralizedExchange: {
          baseAssetBalance: new BigNumber('15'),
          quoteAssetBalance: new BigNumber('432'),
        },
      },
    };
    const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders(tradeInfo);
    expect(buyOrder).toEqual(
      expect.objectContaining({
        quantity: 1000,
        orderSide: OrderSide.BUY,
        pairId: 'ETH/BTC',
        price: 123,
        orderId: '123-orderid',
      })
    );
    expect(sellOrder).toEqual(
      expect.objectContaining({
        quantity: 1000,
        orderSide: OrderSide.SELL,
        pairId: 'ETH/BTC',
        price: 123,
        orderId: '123-orderid',
      })
    );
  });
});
