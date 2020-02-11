import { BinanceAPI } from '../src/broker/binance/api';
import { mockAccountInfo } from '../mock-data/account-info';
import { exchangeInfo } from '../mock-data/exchange-info';
import axios from 'axios';
import { Level, Logger } from '../src/logger';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

require('dotenv').config();

const loggers = Logger.createLoggers(Level.Warn);

const pingSuccessResponse = { status: 200, data: {} };
let pingResponse = jest.fn()
  .mockReturnValue(pingSuccessResponse);

const avgPriceResponse = {
  status: 200,
  data: {
    mins: 5, price: '0.02096972',
  },
};

mockedAxios.get.mockImplementation((url) => {
  if (url.includes('exchangeInfo')) {
    return Promise.resolve(exchangeInfo);
  } else if (url.includes('ping')) {
    return Promise.resolve(pingResponse());
  } else if (url.includes('avgPrice')) {
    return Promise.resolve(avgPriceResponse);
  } else if (url.includes('account')) {
    return Promise.resolve(mockAccountInfo);
  } else {
    return Promise.reject();
  }
});

const ONE_MINUTE = 60 * 1000;

describe('BinanceAPI', () => {
  let binance: BinanceAPI;

  beforeEach(() => {
    binance = new BinanceAPI({
      logger: loggers.binance,
      apiKey: process.env.BINANCE_API_KEY! || '123',
      apiSecret: process.env.BINANCE_API_SECRET! || 'abc',
    });
  });

  describe('start and stop', () => {
    let getExchangeInfoSpy: any;
    let pingSpy: any;
    let getAveragePriceSpy: any;

    beforeEach(async () => {
      jest.useFakeTimers();
      getExchangeInfoSpy = jest.spyOn(binance, 'getExchangeInfo');
      pingSpy = jest.spyOn(binance, 'ping');
      getAveragePriceSpy = jest.spyOn(binance, 'getAveragePrice');
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('it queries average prices for ETHBTC, LINKBTC', async () => {
      const activeAssets = new Set(['ETHBTC', 'LINKBTC']);
      await binance.start(activeAssets);
      expect(getAveragePriceSpy).toHaveBeenCalledTimes(activeAssets.size);
      expect(binance['averageAssetPrices'].has('ETHBTC')).toBeTruthy();
      expect(binance['averageAssetPrices'].get('ETHBTC'))
        .toEqual(parseFloat(avgPriceResponse.data.price));
      expect(binance['averageAssetPrices'].has('LINKBTC')).toBeTruthy();
      let updatedActiveAssetsSize = 3;
      await binance.monitorPriceForTradingPair('XRPBTC');
      expect(getAveragePriceSpy).toHaveBeenCalledTimes(updatedActiveAssetsSize);
      await binance.monitorPriceForTradingPair('XRPBTC');
      expect(getAveragePriceSpy).toHaveBeenCalledTimes(updatedActiveAssetsSize);
      expect(binance['tradingPairsToMonitor'].size).toEqual(updatedActiveAssetsSize);
      expect(binance['averageAssetPrices'].get('XRPBTC'))
        .toEqual(parseFloat(avgPriceResponse.data.price));
      binance.stopMonitoringPrice('ETHBTC');
      updatedActiveAssetsSize = 2;
      expect(binance['tradingPairsToMonitor'].size).toEqual(updatedActiveAssetsSize);
      expect(binance['averageAssetPrices'].size).toEqual(updatedActiveAssetsSize);
      jest.clearAllMocks();
      jest.advanceTimersByTime(5 * ONE_MINUTE);
      expect(getAveragePriceSpy).toHaveBeenCalledTimes(updatedActiveAssetsSize);
      await binance.stop();
      jest.advanceTimersByTime(5 * ONE_MINUTE);
      expect(getAveragePriceSpy).toHaveBeenCalledTimes(updatedActiveAssetsSize);
    });

    test('it updates exchangeInfo every 5 minutes', async () => {
      await binance.start();
      expect(getExchangeInfoSpy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(5 * ONE_MINUTE);
      expect(getExchangeInfoSpy).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(4 * ONE_MINUTE);
      expect(getExchangeInfoSpy).toHaveBeenCalledTimes(2);
      await binance.stop();
      jest.advanceTimersByTime(5 * ONE_MINUTE);
      expect(getExchangeInfoSpy).toHaveBeenCalledTimes(2);
    });

    test('it pings every 3 minutes', async () => {
      await binance.start();
      expect(pingSpy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(3 * ONE_MINUTE);
      expect(pingSpy).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(2 * ONE_MINUTE);
      expect(pingSpy).toHaveBeenCalledTimes(2);
      await binance.stop();
      jest.advanceTimersByTime(3 * ONE_MINUTE);
      expect(pingSpy).toHaveBeenCalledTimes(2);
    });

  });

  describe('ping', () => {

    test('succeeds', async () => {
      await expect(binance.ping()).resolves.toEqual({});
    });

    test('rejects with non 200 status code', async () => {
      pingResponse = jest.fn()
        .mockReturnValue({});
      await expect(binance.ping()).rejects.toMatchSnapshot();
      pingResponse = jest.fn().mockReturnValue(pingSuccessResponse);
    });

  });

  describe('accountInfo', () => {

    test('succeeds', async () => {
      await expect(binance.accountInfo()).resolves.toMatchSnapshot();
    });

    test('getAssets refreshed accountInfo', async () => {
      const ownedAssets = await binance.getAssets();
      expect(ownedAssets).toMatchSnapshot();
    });

  });

  describe('verifyQuantity', () => {

    test('it fails without exchangeInfo', async () => {
      expect.assertions(1);
      try {
        await binance.verifyQuantity('ETH', 'BTC', 0.004);
      } catch (e) {
        expect(e).toMatchSnapshot();
      }
    });

    test('it starts monitoring average price for tradingPair', async () => {
      expect.assertions(1);
      const monitorPriceForTradingPairSpy = jest.spyOn(binance, 'monitorPriceForTradingPair');
      await binance.start();
      try {
        await binance.verifyQuantity('ETH', 'BTC', 0.004);
      } catch (e) {
        expect(monitorPriceForTradingPairSpy).toHaveBeenCalledWith('ETHBTC');
      }
    });

    describe('exchangeInfo fetched', () => {
      beforeEach(async () => {
        await binance.start(
          new Set(['ETHBTC', 'LINKBTC']),
        );
      });

      test('it rounds maxQty to nearest step', async () => {
        expect.assertions(3);
        let maxQty = await binance.verifyQuantity('ETH', 'BTC', 0.0099);
        expect(maxQty).toEqual(0.00900000);

        maxQty = await binance.verifyQuantity('LINK', 'BTC', 1.05);
        expect(maxQty).toEqual(1);
        maxQty = await binance.verifyQuantity('LINK', 'BTC', 2.01);
        expect(maxQty).toEqual(2);
      });

      test('it does not round correct quantity', async () => {
        expect.assertions(1);
        const maxQty = await binance.verifyQuantity('ETH', 'BTC', 0.005);
        expect(maxQty).toEqual(0.005);
      });

      test('it fails with MIN_NOTIONAL', async () => {
        expect.assertions(1);
        try {
          await binance.verifyQuantity('ETH', 'BTC', 0.004);
        } catch (e) {
          expect(e).toMatchSnapshot();
        }
      });

      test('it fails with LOT_SIZE', async () => {
        expect.assertions(2);
        try {
          await binance.verifyQuantity('LINK', 'BTC', 0.9);
        } catch (e) {
          expect(e).toMatchSnapshot();
        }
        try {
          await binance.verifyQuantity('LINK', 'BTC', 90000001);
        } catch (e) {
          expect(e).toMatchSnapshot();
        }
      });

    });

  });

});
