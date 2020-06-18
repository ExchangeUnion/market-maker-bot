import { tradeInfoToOpenDEXorders } from './orders';
import BigNumber from 'bignumber.js';
import { OrderSide } from '../proto/xudrpc_pb';
import { coinsToSats } from '../utils';
import { testConfig } from '../test-utils';
import { TradeInfo } from '../trade/info';

type AssertTradeInfoToOpenDEXordersParams = {
  tradeInfo: TradeInfo;
  expected: {
    buyPrice?: BigNumber;
    buyQuantity?: BigNumber;
    sellPrice?: BigNumber;
    sellQuantity?: BigNumber;
  };
};

const assertTradeInfoToOpenDEXorders = ({
  tradeInfo,
  expected,
}: AssertTradeInfoToOpenDEXordersParams) => {
  const config = testConfig();
  const { buyOrder, sellOrder } = tradeInfoToOpenDEXorders({
    tradeInfo,
    config,
  });
  if (expected.buyQuantity && expected.buyPrice) {
    const expectedBuyQuantity = coinsToSats(expected.buyQuantity.toNumber());
    const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
    expect(buyOrder).toEqual(
      expect.objectContaining({
        quantity: expectedBuyQuantity,
        orderSide: OrderSide.BUY,
        pairId,
        price: expected.buyPrice.toNumber(),
        orderId: expect.any(String),
      })
    );
  }
  if (expected.sellQuantity && expected.sellPrice) {
    const expectedSellQuantity = coinsToSats(expected.sellQuantity.toNumber());
    const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
    expect(sellOrder).toEqual(
      expect.objectContaining({
        quantity: expectedSellQuantity,
        orderSide: OrderSide.SELL,
        pairId,
        price: expected.sellPrice.toNumber(),
        orderId: expect.any(String),
      })
    );
  }
};

describe('tradeInfoToOpenDEXorders', () => {
  describe('buy order', () => {
    test('all of OpenDEX base asset max inbound can be used for buying', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('500'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('9.5'),
            quoteAssetMaxOutbound: new BigNumber('9.4'),
            quoteAssetMaxInbound: new BigNumber('2'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('501'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('0.0188'),
          buyQuantity: new BigNumber('500'),
        },
      });
    });

    test('OpenDEX quote asset max outbound reduces buy quantity', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('9007199254740991'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('5.1'),
            quoteAssetMaxOutbound: new BigNumber('5'),
            quoteAssetMaxInbound: new BigNumber('2'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('501'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('0.0188'),
          buyQuantity: new BigNumber('265.957446809'),
        },
      });
    });

    test('centralized exchange base asset balance reduces buy quantity', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('9007199254740991'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('5.1'),
            quoteAssetMaxOutbound: new BigNumber('5'),
            quoteAssetMaxInbound: new BigNumber('2'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('250'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('0.0188'),
          buyQuantity: new BigNumber('250'),
        },
      });
    });
  });

  describe('sell order', () => {
    test('all of OpenDEX base asset max outbound can be used for selling', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('40'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('4'),
            quoteAssetMaxOutbound: new BigNumber('3.95'),
            quoteAssetMaxInbound: new BigNumber('2'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('50'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          sellPrice: new BigNumber('0.0212'),
          sellQuantity: new BigNumber('40'),
        },
      });
    });

    test('OpenDEX quote asset max inbound reduces sell quantity', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('40'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('4'),
            quoteAssetMaxOutbound: new BigNumber('3.95'),
            quoteAssetMaxInbound: new BigNumber('0.25'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('50'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          sellPrice: new BigNumber('0.0212'),
          sellQuantity: new BigNumber('11.79245283'),
        },
      });
    });

    test("centralized exchange's quote asset allocation reduces sell quantity", () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('40'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('4'),
            quoteAssetMaxOutbound: new BigNumber('3.95'),
            quoteAssetMaxInbound: new BigNumber('0.25'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('50'),
            quoteAssetBalance: new BigNumber('0.1'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          sellPrice: new BigNumber('0.0212'),
          sellQuantity: new BigNumber('5'),
        },
      });
    });
  });
});
