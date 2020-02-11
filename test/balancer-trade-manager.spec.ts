import { BalancerTradeManager } from '../src/trade/balancer';
import { ExchangeBroker } from '../src/broker/exchange';
import { Logger, Level } from '../src/logger';
import { Balance } from '../src/broker/api';
import { BalancerTrade, BalancerOrder } from '../src/trade/balancer-trade';
import {
  OrderSide,
  OrderType,
} from '../src/enums';

jest.mock('../src/broker/exchange');
const mockedExchangeBroker = <jest.Mock<ExchangeBroker>><any>ExchangeBroker;

jest.mock('../src/trade/balancer-trade');

const loggers = Logger.createLoggers(Level.Warn);

const btcBalance: Balance = {
  asset: 'BTC',
  free: 5,
  locked: 2,
  maxsell: 3,
  maxbuy: 2,
};

const ltcBalance: Balance = {
  asset: 'LTC',
  free: 2,
  locked: 3,
  maxsell: 0.5,
  maxbuy: 1.5,
};

const daiBalance: Balance = {
  asset: 'DAI',
  free: 10000,
  locked: 5000,
  maxsell: 5000,
  maxbuy: 0,
};

const wethBalance: Balance = {
  asset: 'WETH',
  free: 100,
  locked: 0,
  maxsell: 0,
  maxbuy: 100,
};

const getAssetsResponse: Balance[] = [
  btcBalance,
  ltcBalance,
  daiBalance,
  wethBalance,
];

describe('BalancerTradeManager', () => {
  let openDexBroker: ExchangeBroker;
  let balancerTradeManager: BalancerTradeManager;
  let onNewOrder: any;
  let startNewOrder: any;

  beforeEach(() => {
    openDexBroker = new mockedExchangeBroker();
    openDexBroker.start = jest.fn();
    openDexBroker.close = jest.fn();
    openDexBroker.getAssets = jest
      .fn()
      .mockReturnValue(getAssetsResponse);
    onNewOrder = jest.fn();
    startNewOrder = jest.fn();
    openDexBroker.newOrder = jest
      .fn()
      .mockReturnValue({
        on: onNewOrder,
        start: startNewOrder,
      });
    BalancerTrade.prototype.start = jest.fn();
    BalancerTrade.prototype.close = jest.fn();
    BalancerTrade.prototype.setAssets = jest.fn();
    BalancerTrade.prototype.on = jest.fn();
    // @ts-ignore
    BalancerTrade.prototype['baseAsset'] = 'LTC';
    // @ts-ignore
    BalancerTrade.prototype['quoteAsset'] = 'BTC';
    loggers.balancer.warn = jest.fn();
    balancerTradeManager = new BalancerTradeManager({
      opendex: openDexBroker,
      logger: loggers.balancer,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('start', () => {
    const tradeCount = 1;

    beforeEach(async () => {
      jest.useFakeTimers();
      await balancerTradeManager.start();
    });

    it('starts the opendex broker', () => {
      expect(openDexBroker.start).toHaveBeenCalledTimes(1);
    });

    it('starts LTC/BTC trade', () => {
      expect(BalancerTrade.prototype.constructor)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            baseAsset: 'LTC',
            quoteAsset: 'BTC',
            baseAssetBalance: ltcBalance,
          }),
        );
      expect(BalancerTrade.prototype.on)
        .toHaveBeenCalledWith('order', expect.any(Function));
    });

    it(`starts ${tradeCount} trades`, () => {
      expect(BalancerTrade.prototype.constructor).toHaveBeenCalledTimes(tradeCount);
      expect(BalancerTrade.prototype.start).toHaveBeenCalledTimes(tradeCount);
      expect(balancerTradeManager['trades'].size).toEqual(tradeCount);
    });

    it('fetches OpenDEX assets', () => {
      expect(openDexBroker.getAssets).toHaveBeenCalledTimes(1);
      expect(balancerTradeManager['assets']).toEqual(getAssetsResponse);
    });

    describe('close', () => {
      beforeEach(async () => {
        await balancerTradeManager.close();
      });

      it('closes the opendex broker', () => {
        expect(openDexBroker.close).toHaveBeenCalledTimes(1);
        expect(BalancerTrade.prototype.close).toHaveBeenCalledTimes(tradeCount);
      });
    });

    describe('after time passes', () => {

      beforeEach(() => {
        jest.clearAllMocks();
        // 10 sec
        jest.advanceTimersByTime(10000);
      });

      it('updates assets every 10 sec', () => {
        expect(openDexBroker.getAssets).toHaveBeenCalledTimes(1);
        expect(BalancerTrade.prototype.setAssets).toHaveBeenCalledTimes(5);
        // another 10 sec
        jest.advanceTimersByTime(10000);
        expect(openDexBroker.getAssets).toHaveBeenCalledTimes(2);
      });

    });

    describe('handleOrder', () => {

      it('creates OpenDEX order', async () => {
        const order: BalancerOrder = {
          baseAsset: 'LTC',
          quoteAsset: 'BTC',
          orderSide: OrderSide.Buy,
          quantity: 0.1,
        };
        balancerTradeManager['handleOrder'](order);
        expect(openDexBroker.newOrder).toHaveBeenCalledTimes(1);
        expect(openDexBroker.newOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: expect.any(String),
            baseAsset: order.baseAsset,
            quoteAsset: order.quoteAsset,
            orderType: OrderType.Market,
            orderSide: order.orderSide,
            quantity: order.quantity,
            price: 'mkt',
          }),
        );
        expect(onNewOrder).toHaveBeenCalledTimes(3);
        expect(onNewOrder).toHaveBeenCalledWith('complete', expect.any(Function));
        expect(onNewOrder).toHaveBeenCalledWith('failure', expect.any(Function));
        expect(onNewOrder).toHaveBeenCalledWith('fill', expect.any(Function));
      });

      describe('when active order exists', () => {

        beforeEach(() => {
          jest.clearAllMocks();
          // @ts-ignore
          balancerTradeManager['activeOrder'] = true;
        });

        it('ignores the second order', () => {
          const order2: BalancerOrder = {
            baseAsset: 'LTC',
            quoteAsset: 'BTC',
            orderSide: OrderSide.Sell,
            quantity: 0.3,
          };
          balancerTradeManager['handleOrder'](order2);
          expect(openDexBroker.newOrder).toHaveBeenCalledTimes(0);
        });

      });

    });

  });
});
