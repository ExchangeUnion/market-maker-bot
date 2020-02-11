import { ExchangeBroker } from '../src/broker/exchange';
import { OpenDexStream } from '../src/broker/opendex/stream';
import { Level, Logger } from '../src/logger';
import { OpenDexAPI } from '../src/broker/opendex/api';
import {
  ExchangeType,
  OrderType,
  OrderSide,
} from '../src/enums';

const loggers = Logger.createLoggers(Level.Warn);

jest.mock('../src/broker/opendex/api');
OpenDexAPI.prototype.start = jest.fn();
OpenDexAPI.prototype.newOrder = jest.fn();

jest.mock('../src/broker/opendex/stream');

describe('ExchangeBroker.OpenDEX', () => {

  describe('newOrder', () => {
    test('it creates a new limit order', async () => {
      const broker = new ExchangeBroker({
        exchange: ExchangeType.OpenDEX,
        certPath: '/path/to/tls.cert',
        rpchost: 'localhost',
        rpcport: 8886,
        logger: loggers.opendex,
      });
      jest.resetAllMocks();
      await broker.start();
      const orderRequest = {
        orderId: '123',
        baseAsset: 'ETH',
        quoteAsset: 'BTC',
        orderType: OrderType.Limit,
        orderSide: OrderSide.Buy,
        quantity: 0.005,
        price: 0.023006,
      };
      await broker.newOrder(orderRequest);
      expect(OpenDexAPI.prototype.newOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPrice', () => {
    let broker: ExchangeBroker;
    const onBTCUSDTpriceChange = jest.fn();
    const startStream = OpenDexStream.prototype.start = jest.fn();
    const onListener = OpenDexStream.prototype.on = jest.fn();

    beforeEach(async () => {
      broker = new ExchangeBroker({
        exchange: ExchangeType.OpenDEX,
        certPath: '/hello/world/tls.cert',
        rpchost: 'localhost',
        rpcport: 8886,
        logger: loggers.opendex,
      });
      await broker.start();
      jest.resetAllMocks();
    });

    test('getPrice creates price stream for tradingPair', async () => {
      expect(broker['priceStreams'].size).toEqual(0);
      const tradingPair = 'BTCUSDT';
      await broker.getPrice(tradingPair, onBTCUSDTpriceChange);
      expect(OpenDexStream).toHaveBeenCalledTimes(1);
      expect(startStream).toHaveBeenCalledTimes(1);
      expect(onListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('verify configuration', () => {

    test('throws without certPath', async () => {
      expect.assertions(1);
      try {
        const broker = new ExchangeBroker({
          exchange: ExchangeType.OpenDEX,
          logger: loggers.opendex,
        });
        await broker.start();
      } catch (e) {
        expect(e).toMatchSnapshot();
      }
    });

    test('throws without rpchost', async () => {
      expect.assertions(1);
      try {
        const broker = new ExchangeBroker({
          exchange: ExchangeType.OpenDEX,
          logger: loggers.opendex,
          certPath: '/path/to/tls.cert',
        });
        await broker.start();
      } catch (e) {
        expect(e).toMatchSnapshot();
      }
    });

    test('throws without rpcport', async () => {
      expect.assertions(1);
      try {
        const broker = new ExchangeBroker({
          exchange: ExchangeType.OpenDEX,
          logger: loggers.opendex,
          certPath: '/path/to/tls.cert',
          rpchost: 'localhost',
        });
        await broker.start();
      } catch (e) {
        expect(e).toMatchSnapshot();
      }
    });

    test('starts with certPath, rpchost and rpcport specified', async () => {
      const broker = new ExchangeBroker({
        exchange: ExchangeType.OpenDEX,
        certPath: '/path/to/tls.cert',
        rpchost: 'localhost',
        rpcport: 8886,
        logger: loggers.opendex,
      });
      jest.resetAllMocks();
      await broker.start();
      expect(OpenDexAPI.prototype.start).toHaveBeenCalledTimes(1);
    });

  });

});
