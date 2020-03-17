import { Logger, Level } from '../src/logger';
import { ArbitrageTrade } from '../src/trade/arbitrage-trade';
import { ExchangeBroker } from '../src/broker/exchange';
import { OpenDexOrder } from '../src/broker/opendex/order';
import { OrderSide } from '../src/enums';
import { coinsToSats } from '../src/utils';

require('dotenv').config();
const OPENDEX_MARGIN = process.env.MARGIN && parseFloat(process.env.MARGIN) || 0.06;
process.env.MARGIN = `${OPENDEX_MARGIN}`;

jest.mock('../src/broker/exchange');
const mockedExchangeBroker = <jest.Mock<ExchangeBroker>><any>ExchangeBroker;

jest.mock('../src/broker/opendex/order');
const mockedOrder = <jest.Mock<OpenDexOrder>><any>OpenDexOrder;

const loggers = Logger.createLoggers(Level.Warn);

describe('ArbitrageTrade', () => {
  let arbitrageTrade: ArbitrageTrade;
  let arbitrageTrade2: ArbitrageTrade;
  let openDexBroker: ExchangeBroker;
  let binanceBroker: ExchangeBroker;
  let openDexBroker2: ExchangeBroker;
  let binanceBroker2: ExchangeBroker;

  beforeEach(() => {
    openDexBroker = new mockedExchangeBroker();
    binanceBroker = new mockedExchangeBroker();
    openDexBroker.getAssets = jest.fn()
      .mockReturnValue([
        {
          asset: 'DAI',
          free: 10000,
          locked: 15000,
          maxsell: 900000000000,
          maxbuy: 100000000000,
        },
        {
          asset: 'BTC',
          free: 0.00001,
          locked: 3,
          maxsell: 900,
          maxbuy: 100,
        },
      ]);
    binanceBroker.getAssets = jest.fn()
      .mockReturnValue([
        {
          asset: 'USDT',
          free: 20000,
          locked: 0,
        },
        {
          asset: 'BTC',
          free: 0.00002,
          locked: 2,
        },
      ]);
    binanceBroker.getPrice = jest.fn();
    loggers.trademanager.warn = jest.fn();
    arbitrageTrade = new ArbitrageTrade({
      logger: loggers.trademanager,
      opendex: openDexBroker,
      binance: binanceBroker,
      baseAsset: 'BTC',
      quoteAsset: 'USD',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('start with insufficient balances', () => {
    beforeEach(() => {
      openDexBroker2 = new mockedExchangeBroker();
      binanceBroker2 = new mockedExchangeBroker();
      openDexBroker2.getAssets = jest.fn()
      .mockReturnValue([
        {
          asset: 'DAI',
          free: 0,
          locked: 0,
          maxsell: 0,
          maxbuy: 0,
        },
        {
          asset: 'BTC',
          free: 0,
          locked: 0,
          maxsell: 0,
          maxbuy: 0,
        },
      ]);
      binanceBroker2.getAssets = jest.fn()
      .mockReturnValue([
        {
          asset: 'USDT',
          free: 0,
          locked: 0,
        },
        {
          asset: 'BTC',
          free: 0.00000,
          locked: 0,
        },
      ]);
      binanceBroker2.getPrice = jest.fn();
      arbitrageTrade2 = new ArbitrageTrade({
        logger: loggers.trademanager,
        opendex: openDexBroker2,
        binance: binanceBroker2,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
      });
    });

    it('closes the trade', async () => {
      const closeSpy = jest.spyOn(arbitrageTrade2, 'close');
      await arbitrageTrade2.start();
      await arbitrageTrade2['updateBinancePrice']('BTCUSDT', 10000);
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('start', () => {

    beforeEach(async () => {
      await arbitrageTrade.start();
    });

    it('subscribes to Binance BTC/DAI price stream', () => {
      expect(binanceBroker.getPrice).toHaveBeenCalledTimes(1);
      expect(binanceBroker.getPrice).toHaveBeenCalledWith('BTCUSDT', expect.any(Function));
    });

    describe('close', () => {
      let mockOrder: OpenDexOrder;
      let clearTimeoutSpy: any;

      beforeEach(async () => {
        mockOrder = new mockedOrder();
        mockOrder.cancel = jest.fn();
        arbitrageTrade['openDexBuyOrder'] = mockOrder;
        arbitrageTrade['openDexSellOrder'] = mockOrder;
        arbitrageTrade['updateOrdersTimer'] = setTimeout(() => {}, 60000);
        clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        expect(arbitrageTrade['closed']).toEqual(false);
        await arbitrageTrade.close();
        expect(arbitrageTrade['closed']).toEqual(true);
      });

      test('cancels orders', () => {
        expect(mockOrder.cancel).toHaveBeenCalledTimes(2);
      });

      test('removes update orders timer', () => {
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
      });

    });

  });

  describe('when order completes', () => {
    const price = 1234.56789012;
    const quantity = 4321.09876543;
    let mockBuyOrder: any;
    let mockSellOrder: any;
    let mockBinanceOrder: any;

    beforeEach(() => {
      mockBuyOrder = new mockedOrder();
      mockBuyOrder.start = jest.fn();
      mockBuyOrder.on = jest.fn();
      mockBuyOrder['orderId'] = '123abc';
      mockBuyOrder['quantity'] = quantity;
      arbitrageTrade['openDexBuyOrder'] = mockBuyOrder;
      mockSellOrder = new mockedOrder();
      mockSellOrder.start = jest.fn();
      mockSellOrder.on = jest.fn();
      mockSellOrder['orderId'] = '456efg';
      mockSellOrder['quantity'] = quantity;
      arbitrageTrade['openDexSellOrder'] = mockSellOrder;
      arbitrageTrade['price'] = price;
      mockBinanceOrder = new mockedOrder();
      mockBinanceOrder.start = jest.fn();
      binanceBroker.newOrder = jest.fn()
        .mockReturnValue(mockBinanceOrder);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    test('it excutes sell order on Binance', () => {
      arbitrageTrade['orderComplete'](arbitrageTrade['openDexBuyOrder']!['orderId'], coinsToSats(quantity));
      expect(binanceBroker.newOrder).toHaveBeenCalledTimes(1);
      expect(binanceBroker.newOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          price,
          quantity,
          orderId: expect.any(String),
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          orderSide: OrderSide.Sell,
        }),
      );
      expect(mockBinanceOrder.on).toHaveBeenCalledTimes(3);
      expect(mockBinanceOrder.on).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(mockBinanceOrder.on).toHaveBeenCalledWith('failure', expect.any(Function));
      expect(mockBinanceOrder.on).toHaveBeenCalledWith('fill', expect.any(Function));
      expect(mockBinanceOrder.start).toHaveBeenCalledTimes(1);
    });

    test('it excutes buy order on Binance', () => {
      arbitrageTrade['orderComplete'](arbitrageTrade['openDexSellOrder']!['orderId'], coinsToSats(quantity));
      expect(binanceBroker.newOrder).toHaveBeenCalledTimes(1);
      expect(binanceBroker.newOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          price,
          quantity,
          orderId: expect.any(String),
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          orderSide: OrderSide.Buy,
        }),
      );
      expect(mockBinanceOrder.on).toHaveBeenCalledTimes(3);
      expect(mockBinanceOrder.on).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(mockBinanceOrder.on).toHaveBeenCalledWith('failure', expect.any(Function));
      expect(mockBinanceOrder.on).toHaveBeenCalledWith('fill', expect.any(Function));
      expect(mockBinanceOrder.start).toHaveBeenCalledTimes(1);
    });

  });

  describe('updateBinancePrice', () => {
    let mockOrder: OpenDexOrder;

    beforeEach(() => {
      jest.useFakeTimers();
      mockOrder = new mockedOrder();
      mockOrder['orderId'] = '123abc';
      mockOrder.start = jest.fn()
        .mockReturnValue(Promise.resolve(true));
      mockOrder.on = jest.fn();
      mockOrder.cancel = jest.fn();
      openDexBroker.newOrder = jest.fn()
        .mockReturnValue(mockOrder);
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    test('it waits for price update to be processed', () => {
      jest.useRealTimers();
      arbitrageTrade['createOpenDexOrders'] = jest.fn()
        .mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(resolve, 10000);
          });
        });
      arbitrageTrade['updateBinancePrice']('BTCUSDT', 7000);
      arbitrageTrade['updateBinancePrice']('BTCUSDT', 7001);
      arbitrageTrade['updateBinancePrice']('BTCUSDT', 6999);
      expect(arbitrageTrade['createOpenDexOrders']).toHaveBeenCalledTimes(1);
    });

    describe('order and buy/sell quantities do not exist', () => {
      const expectedBuyQuantity = 0.14285714;
      const expectedSellQuantity = 0.000009;
      const price = 7000;

      beforeEach(async () => {
        await arbitrageTrade['updateBinancePrice']('BTCUSDT', price);
      });

      test('gets asset allocation for Binance and OpenDEX', () => {
        expect(binanceBroker.getAssets).toHaveBeenCalledTimes(1);
        expect(openDexBroker.getAssets).toHaveBeenCalledTimes(1);
      });

      test('sets buy quantity', () => {
        expect(arbitrageTrade['buyQuantity'])
          .toEqual(expectedBuyQuantity);
      });

      test('sets sell quantity', () => {
        expect(arbitrageTrade['sellQuantity'])
          .toEqual(expectedSellQuantity);
      });

      test('it creates buy and sell orders', () => {
        const expectedBuyPrice = price - price * OPENDEX_MARGIN;
        expect(openDexBroker.newOrder).toHaveBeenCalledTimes(2);
        expect(openDexBroker.newOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: expect.any(String),
            price: expectedBuyPrice,
            baseAsset: 'BTC',
            quoteAsset: 'DAI',
            orderSide: OrderSide.Buy,
            quantity: expectedBuyQuantity,
          }),
        );
        const expectedSellPrice = price + price * OPENDEX_MARGIN;
        expect(openDexBroker.newOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: expect.any(String),
            price: expectedSellPrice,
            baseAsset: 'BTC',
            quoteAsset: 'DAI',
            orderSide: OrderSide.Sell,
            quantity: expectedSellQuantity,
          }),
        );
        expect(mockOrder.start).toHaveBeenCalledTimes(2);
        expect(mockOrder.on).toHaveBeenCalledTimes(6);
        expect(mockOrder.on).toHaveBeenCalledWith('complete', expect.any(Function));
        expect(mockOrder.on).toHaveBeenCalledWith('failure', expect.any(Function));
        expect(mockOrder.on).toHaveBeenCalledWith('fill', expect.any(Function));
        expect(arbitrageTrade['openDexBuyOrder']!['orderId']).toEqual(mockOrder['orderId']);
        expect(arbitrageTrade['openDexSellOrder']!['orderId']).toEqual(mockOrder['orderId']);
      });

      describe('when arbitrage trade closed', () => {

        beforeEach(() => {
          arbitrageTrade['closed'] = true;
        });

        afterEach(() => {
          arbitrageTrade['closed'] = false;
        });

        test('it does not create buy and sell orders', async () => {
          arbitrageTrade['openDexBuyOrder'] = undefined;
          arbitrageTrade['openDexSellOrder'] = undefined;
          arbitrageTrade['updatingPrice'] = false;
          await arbitrageTrade['updateBinancePrice']('BTCUSDT', 11111);
          expect(openDexBroker.newOrder).toHaveBeenCalledTimes(2);
        });

      });

      describe('after 60 seconds', () => {
        const basePrice = 7500;

        beforeEach(async () => {
          await arbitrageTrade['updateBinancePrice']('BTCUSDT', basePrice);
          jest.advanceTimersByTime(60000);
        });

        test('it updates the order', () => {
          const expectedBuyPrice = parseFloat((basePrice - basePrice * OPENDEX_MARGIN).toFixed(8));
          const expectedSellPrice = parseFloat((basePrice + basePrice * OPENDEX_MARGIN).toFixed(8));
          // it updates the quantities
          expect(arbitrageTrade['buyQuantity']).toEqual(0.13333333);
          expect(arbitrageTrade['sellQuantity']).toEqual(0.000009);
          // it caches the asset allocation
          expect(binanceBroker.getAssets).toHaveBeenCalledTimes(1);
          expect(openDexBroker.getAssets).toHaveBeenCalledTimes(2);
          expect(mockOrder.cancel).toHaveBeenCalledTimes(2);
          expect(openDexBroker.newOrder).toHaveBeenCalledTimes(4);
          expect(openDexBroker.newOrder).toHaveBeenCalledWith(
            expect.objectContaining({
              orderId: expect.any(String),
              price: expectedBuyPrice,
              baseAsset: 'BTC',
              quoteAsset: 'DAI',
              orderSide: OrderSide.Buy,
            }),
          );
          expect(openDexBroker.newOrder).toHaveBeenCalledWith(
            expect.objectContaining({
              orderId: expect.any(String),
              price: expectedSellPrice,
              baseAsset: 'BTC',
              quoteAsset: 'DAI',
              orderSide: OrderSide.Sell,
            }),
          );
          expect(mockOrder.start).toHaveBeenCalledTimes(4);
          expect(mockOrder.on).toHaveBeenCalledTimes(12);
          expect(arbitrageTrade['openDexBuyOrder']!['orderId']).toEqual(mockOrder['orderId']);
          expect(arbitrageTrade['openDexSellOrder']!['orderId']).toEqual(mockOrder['orderId']);
          jest.advanceTimersByTime(59000);
          expect(mockOrder.cancel).toHaveBeenCalledTimes(2);
          expect(openDexBroker.newOrder).toHaveBeenCalledTimes(4);
        });

      });

    });

  });

});
