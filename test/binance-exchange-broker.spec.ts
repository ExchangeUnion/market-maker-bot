import { ExchangeBroker } from '../src/broker/exchange';
import {
  ExchangeType,
  OrderSide,
  OrderType,
} from '../src/enums';
import { BinanceStream } from '../src/broker/binance/stream';
import { BinanceAPI } from '../src/broker/binance/api';
import { Level, Logger } from '../src/logger';
import { mockAccountInfo } from '../mock-data/account-info';

const loggers = Logger.createLoggers(Level.Warn);

jest.mock('../src/broker/binance/api');
const binanceAPIstart = BinanceAPI.prototype.start = jest.fn();
BinanceAPI.prototype.stop = jest.fn();
BinanceAPI.prototype.cancelOrder = jest.fn();
BinanceAPI.prototype.newOrder = jest.fn();

jest.mock('../src/broker/binance/stream');

describe('Broker', () => {

  describe('Binance', () => {

    describe('verify configuration', () => {

      test('throws without api key and secret', async () => {
        expect.assertions(1);
        try {
          const broker = new ExchangeBroker({
            exchange: ExchangeType.Binance,
            logger: loggers.binance,
          });
          await broker.start();
        } catch (e) {
          expect(e).toMatchSnapshot();
        }
      });

      test('throws without api key', async () => {
        expect.assertions(1);
        try {
          const broker = new ExchangeBroker({
            exchange: ExchangeType.Binance,
            apiSecret: 'abc',
            logger: loggers.binance,
          });
          await broker.start();
        } catch (e) {
          expect(e).toMatchSnapshot();
        }
      });

      test('throws without api secret', async () => {
        expect.assertions(1);
        try {
          const broker = new ExchangeBroker({
            exchange: ExchangeType.Binance,
            apiKey: '123',
            logger: loggers.binance,
          });
          await broker.start();
        } catch (e) {
          expect(e).toMatchSnapshot();
        }
      });

      test('starts with api key and secret specified', async () => {
        const broker = new ExchangeBroker({
          exchange: ExchangeType.Binance,
          apiKey: '123',
          apiSecret: 'abc',
          logger: loggers.binance,
        });
        await broker.start();
        expect(binanceAPIstart).toHaveBeenCalledTimes(1);
      });

    });

    describe('getAssets', () => {

      it('returns asset allocation', async () => {
        const broker = new ExchangeBroker({
          exchange: ExchangeType.Binance,
          apiKey: '123',
          apiSecret: 'abc',
          logger: loggers.binance,
        });
        const getAssetsMock = BinanceAPI.prototype.getAssets = jest
          .fn()
          .mockReturnValue(mockAccountInfo.data.balances);
        await broker.start();
        const ownedAssets = await broker.getAssets();
        expect(getAssetsMock).toHaveBeenCalledTimes(1);
        expect(ownedAssets).toMatchSnapshot();
      });

    });

    describe('newOrder', () => {

      test('it creates a new stop-limit order', async () => {
        const broker = new ExchangeBroker({
          exchange: ExchangeType.Binance,
          apiKey: '123',
          apiSecret: 'abc',
          logger: loggers.binance,
        });
        await broker.start();
        const orderRequest = {
          orderId: '123',
          baseAsset: 'ETH',
          quoteAsset: 'BTC',
          orderType: OrderType.StopLimit,
          orderSide: OrderSide.Buy,
          quantity: 0.005,
          price: 0.023006,
          stopPrice: 0.025410,
        };
        await broker.newOrder(orderRequest);
        expect(BinanceAPI.prototype.newOrder).toHaveBeenCalledTimes(1);
      });

    });

    describe('getPrice', () => {
      let broker: ExchangeBroker;
      const onBTCUSDTpriceChange = jest.fn();
      const startStream = BinanceStream.prototype.start = jest.fn();
      const onListener = BinanceStream.prototype.on = jest.fn();
      const closeListener = BinanceStream.prototype.close = jest.fn();

      beforeEach(async () => {
        broker = new ExchangeBroker({
          exchange: ExchangeType.Binance,
          apiKey: '123',
          apiSecret: 'abc',
          logger: loggers.binance,
        });
        await broker.start();
        jest.resetAllMocks();
      });

      test('getPrice creates price stream for tradingPair', async () => {
        expect(broker['priceStreams'].size).toEqual(0);
        const tradingPair = 'BTCUSDT';
        await broker.getPrice(tradingPair, onBTCUSDTpriceChange);
        expect(broker['priceStreams'].size).toEqual(1);
        expect(broker['priceStreams'].has(tradingPair)).toBeTruthy();
      });

      test('getPrice does not create duplicate streams', async () => {
        const tradingPair = 'BTCUSDT';
        await broker.getPrice(tradingPair, onBTCUSDTpriceChange);
        await broker.getPrice(tradingPair, onBTCUSDTpriceChange);
        expect(BinanceStream).toHaveBeenCalledTimes(1);
        expect(startStream).toHaveBeenCalledTimes(1);
        expect(onListener).toHaveBeenCalledTimes(2);
      });

      describe('close', () => {

        it('destroys all streams and closes API', async () => {
          expect(broker['priceStreams'].size).toEqual(0);
          await broker.getPrice('BTCUSDT', () => {});
          await broker.getPrice('ETHBTC', () => {});
          expect(broker['priceStreams'].size).toEqual(2);
          // close destroys pending streams
          const apiClose = BinanceAPI.prototype.stop = jest.fn();
          await broker.close();
          expect(closeListener).toHaveBeenCalledTimes(2);
          expect(apiClose).toHaveBeenCalledTimes(1);
        });

      });

    });

  });

});
