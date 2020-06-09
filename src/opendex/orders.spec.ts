import { tradeInfoToOpenDEXorders } from './orders';
import BigNumber from 'bignumber.js';
import { OrderSide } from '../broker/opendex/proto/xudrpc_pb';
import { coinsToSats } from '../utils';

describe('tradeInfoToOpenDEXorders', () => {
  it('fails', () => {
    const tradeInfo = {
      price: new BigNumber('10000'),
      assets: {
        openDEX: {
          baseAssetBalance: new BigNumber('30'),
          baseAssetMaxbuy: new BigNumber('15'),
          baseAssetMaxsell: new BigNumber('15'),
          quoteAssetBalance: new BigNumber('200'),
          quoteAssetMaxsell: new BigNumber('90'),
          quoteAssetMaxbuy: new BigNumber('110'),
        },
        centralizedExchange: {
          baseAssetBalance: new BigNumber('20'),
          quoteAssetBalance: new BigNumber('432'),
        },
      },
    };
    const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders(tradeInfo);
    const expectedBuyQuantity = coinsToSats(new BigNumber('0.011').toNumber());
    expect(buyOrder).toEqual(
      expect.objectContaining({
        quantity: expectedBuyQuantity,
        orderSide: OrderSide.BUY,
        pairId: 'ETH/BTC',
        price: 123,
        orderId: '123-orderid',
      })
    );
    const expectedSellQuantity = coinsToSats(new BigNumber('15').toNumber());
    expect(sellOrder).toEqual(
      expect.objectContaining({
        quantity: expectedSellQuantity,
        orderSide: OrderSide.SELL,
        pairId: 'ETH/BTC',
        price: 123,
        orderId: '123-orderid',
      })
    );
  });
});
