import { Level, Logger } from '../src/logger';
import { BinanceAPI } from '../src/broker/binance/api';
import {
  OrderSide,
  OrderType,
} from '../src/enums';

require('dotenv').config();

const loggers = Logger.createLoggers(Level.Warn);

// This test suite is not using mocked responses.
// It hits the actual binance test order endpoint.
// It is skipped by default in order to speed up
// tests in the development environement.
// Run in when making changes to newOrder API or tagging
// a major release.
describe.skip('BinanceAPI.newOrder', () => {
  let binance: BinanceAPI;

  beforeEach(() => {
    binance = new BinanceAPI({
      logger: loggers.binance,
      apiKey: process.env.BINANCE_API_KEY! || '123',
      apiSecret: process.env.BINANCE_API_SECRET! || 'abc',
    });
  });

  describe('cancelOrder', () => {

    test('returns false when orderId does not exist', async () => {
      const cancelOrderResponse = await binance.cancelOrder({
        tradingPair: 'ETHBTC',
        orderId: '6gCrw2kRUAF9CvJDGP16IP',
      });
      expect(cancelOrderResponse).toEqual(false);
    });

  });

  describe('limit', () => {
    const orderRequest = {
      orderId: '123',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderSide: OrderSide.Buy,
      orderType: OrderType.Limit,
      quantity: 0.005,
      price: 123,
    };

    beforeEach(async () => {
      await binance.start();
    });

    test('it fails without price', async () => {
      await expect(binance.newOrder(orderRequest))
        .rejects.toMatchSnapshot();
    });

    test('succeeds', async () => {
      await expect(binance.newOrder({
        ...orderRequest,
        price: 0.05,
      })).resolves.toBeTruthy();
    });

  });

  describe('stop-limit', () => {
    const orderRequest = {
      orderId: '123',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderSide: OrderSide.Buy,
      orderType: OrderType.StopLimit,
      quantity: 0.005,
      price: 123,
    };

    beforeEach(async () => {
      await binance.start();
    });

    test('fails without price', async () => {
      expect.assertions(1);
      await expect(binance.newOrder(orderRequest))
        .rejects.toMatchSnapshot();
    });

    test('fails without stopPrice', async () => {
      expect.assertions(1);
      await expect(
        binance.newOrder({
          ...orderRequest,
          price: 0.05,
        }),
      ).rejects.toMatchSnapshot();
    });

    test('succeeds', async () => {
      await expect(binance.newOrder({
        ...orderRequest,
        price: 0.05,
        stopPrice: 0.07,
      })).resolves.toBeTruthy();
    });

  });

  describe('queryOrder', () => {

    beforeEach(async () => {
      await binance.start();
    });

    test('fails with order does not exist', async () => {
      try {
        await binance.queryOrder({
          tradingPair: 'ETHBTC',
          orderId: '6gCrw2kRUAF9CvJDGP16IP',
        });
      } catch (e) {
        expect(e.response.data).toMatchSnapshot();
      }
    });

  });

  test('ETHBTC market buy order fails without exchange info', async () => {
    const orderRequest = {
      orderId: '123',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderSide: OrderSide.Buy,
      orderType: OrderType.Market,
      quantity: 0.004,
      price: 123,
    };
    try {
      await binance.newOrder(orderRequest);
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  test('ETHBTC market sell order', async () => {
    const orderRequest = {
      orderId: '123',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderSide: OrderSide.Sell,
      orderType: OrderType.Market,
      quantity: 0.005,
      price: 123,
    };
    await binance.start();
    const monitorPriceForTradingPairSpy = jest.spyOn(binance, 'monitorPriceForTradingPair');
    const newOrderResponse = await binance.newOrder(orderRequest);
    expect(monitorPriceForTradingPairSpy).toHaveBeenCalledTimes(1);
    await expect(newOrderResponse).toBeTruthy();
  });

});
