import { tradeInfoToOpenDEXorders } from './orders';
import BigNumber from 'bignumber.js';
import { OrderSide } from '../proto/xudrpc_pb';
import { coinsToSats } from '../utils';
import { testConfig } from '../test-utils';

describe('tradeInfoToOpenDEXorders', () => {
  it("calculates OpenDEX orders' quantity and price", () => {
    const config = testConfig();
    const tradeInfo = {
      price: new BigNumber('10000'),
      assets: {
        openDEX: {
          baseAssetBalance: new BigNumber('30'),
          baseAssetMaxInbound: new BigNumber('15'),
          baseAssetMaxOutbound: new BigNumber('15'),
          quoteAssetBalance: new BigNumber('200'),
          quoteAssetMaxOutbound: new BigNumber('90'),
          quoteAssetMaxInbound: new BigNumber('110'),
        },
        centralizedExchange: {
          baseAssetBalance: new BigNumber('20'),
          quoteAssetBalance: new BigNumber('432'),
        },
      },
    };
    const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders({
      tradeInfo,
      config,
    });
    const expectedBuyQuantity = coinsToSats(new BigNumber('0.011').toNumber());
    const expectedBuyPrice = new BigNumber('9400').toNumber();
    const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
    expect(buyOrder).toEqual(
      expect.objectContaining({
        quantity: expectedBuyQuantity,
        orderSide: OrderSide.BUY,
        pairId,
        price: expectedBuyPrice,
        orderId: expect.any(String),
      })
    );
    const expectedSellQuantity = coinsToSats(new BigNumber('15').toNumber());
    const expectedSellprice = new BigNumber('10600').toNumber();
    expect(sellOrder).toEqual(
      expect.objectContaining({
        quantity: expectedSellQuantity,
        orderSide: OrderSide.SELL,
        pairId,
        price: expectedSellprice,
        orderId: expect.any(String),
      })
    );
  });
});
