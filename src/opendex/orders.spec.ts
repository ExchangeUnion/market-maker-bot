import { tradeInfoToOpenDEXorders } from './orders';
import BigNumber from 'bignumber.js';
import { OrderSide } from '../proto/xudrpc_pb';
import { coinsToSats } from '../utils';
import { testConfig } from '../test-utils';
import { TradeInfo } from '../trade/info';
import { Config } from '../config';

type AssertTradeInfoToOpenDEXordersParams = {
  tradeInfo: TradeInfo;
  expected: {
    buyPrice?: BigNumber;
    buyQuantity?: BigNumber;
    sellPrice?: BigNumber;
    sellQuantity?: BigNumber;
  };
  config: Config;
};

const assertTradeInfoToOpenDEXorders = ({
  tradeInfo,
  expected,
  config,
}: AssertTradeInfoToOpenDEXordersParams) => {
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
        orderId: `arby-${config.BASEASSET}/${config.QUOTEASSET}-buy-order`,
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
        orderId: `arby-${config.BASEASSET}/${config.QUOTEASSET}-sell-order`,
      })
    );
  }
};

describe('tradeInfoToOpenDEXorders', () => {
  describe('buy order', () => {
    test('OpenDEX base asset max inbound for ETH/BTC', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('0.02'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('40'),
            baseAssetMaxInbound: new BigNumber('0'),
            baseAssetMaxOutbound: new BigNumber('40'),
            quoteAssetBalance: new BigNumber('0.35'),
            quoteAssetMaxOutbound: new BigNumber('0.35'),
            quoteAssetMaxInbound: new BigNumber('0.1'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('20'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('0.0188'),
          buyQuantity: new BigNumber('14.85'),
        },
        config: testConfig(),
      });
    });

    test('OpenDEX base asset max inbound reduces buy quantity for BTC/USDT', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('10000'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('1'),
            baseAssetMaxInbound: new BigNumber('0.5'),
            baseAssetMaxOutbound: new BigNumber('1'),
            quoteAssetBalance: new BigNumber('20000'),
            quoteAssetMaxOutbound: new BigNumber('20000'),
            quoteAssetMaxInbound: new BigNumber('20000'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('1.5'),
            quoteAssetBalance: new BigNumber('25000'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('9400'),
          buyQuantity: new BigNumber('0.495'),
        },
        config: {
          ...testConfig(),
          ...{ BASEASSET: 'BTC', QUOTEASSET: 'USDT' },
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
            quoteAssetBalance: new BigNumber('0.1'),
            quoteAssetMaxOutbound: new BigNumber('0.1'),
            quoteAssetMaxInbound: new BigNumber('0.05'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('500'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('0.0188'),
          buyQuantity: new BigNumber('5.26595744'),
        },
        config: testConfig(),
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
            baseAssetBalance: new BigNumber('5'),
            quoteAssetBalance: new BigNumber('1.5'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          buyPrice: new BigNumber('0.0188'),
          buyQuantity: new BigNumber('4.95'),
        },
        config: testConfig(),
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
          sellQuantity: new BigNumber('39.6'),
        },
        config: testConfig(),
      });
    });

    test('OpenDEX quote asset max inbound reduces sell quantity for ETH/BTC', () => {
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
          sellQuantity: new BigNumber('11.67452830'),
        },
        config: testConfig(),
      });
    });

    test('OpenDEX quote asset max inbound for BTC/USDT', () => {
      expect.assertions(1);
      const tradeInfo = {
        price: new BigNumber('10000'),
        assets: {
          openDEX: {
            baseAssetBalance: new BigNumber('1'),
            baseAssetMaxInbound: new BigNumber('1'),
            baseAssetMaxOutbound: new BigNumber('1'),
            quoteAssetBalance: new BigNumber('15000'),
            quoteAssetMaxOutbound: new BigNumber('15000'),
            quoteAssetMaxInbound: new BigNumber('0'),
          },
          centralizedExchange: {
            baseAssetBalance: new BigNumber('1.5'),
            quoteAssetBalance: new BigNumber('20000'),
          },
        },
      };
      assertTradeInfoToOpenDEXorders({
        tradeInfo,
        expected: {
          sellPrice: new BigNumber('10600'),
          sellQuantity: new BigNumber('0.46698113'),
        },
        config: {
          ...testConfig(),
          ...{
            BASEASSET: 'BTC',
            QUOTEASSET: 'USDT',
          },
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
          sellQuantity: new BigNumber('4.95'),
        },
        config: testConfig(),
      });
    });
  });
});
