import { Logger, Level } from '../src/logger';
import { BalancerTrade } from '../src/trade/balancer-trade';
import { Balance } from '../src/broker/api';
import { OrderSide } from '../src/enums';

require('dotenv').config();

const ltcBalance: Balance = {
  asset: 'LTC',
  free: 2,
  locked: 3,
  maxsell: 50000000,
  maxbuy: 150000000,
};

const loggers = Logger.createLoggers(Level.Warn);

describe('BalancerTrade', () => {
  let trade: BalancerTrade;
  let emitSpy: any;

  beforeEach(() => {
    trade = new BalancerTrade({
      logger: loggers.balancer,
      baseAsset: 'LTC',
      quoteAsset: 'BTC',
      baseAssetBalance: ltcBalance,
    });
    // @ts-ignore
    const checkLimitsSpy = jest.spyOn(trade, 'checkLimits');
    emitSpy = jest.spyOn(trade, 'emit');
    loggers.balancer.warn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LTC above max', () => {

    it('triggers a sell order with warning', async () => {
      process.env.MAXLTC = '3';
      process.env.MINLTC = '0.5';
      const baseAssetBalance: Balance = {
        asset: 'LTC',
        free: 2,
        locked: 3,
        maxsell: 50000000,
        maxbuy: 150000000,
      };
      await trade.setAssets(baseAssetBalance);
      // total is 2 + 3 = 5... and the max is 3
      // it should sell 2, but we only have channel
      // capacity to send 0.5 is
      // we emit 0.5 and display a warning
      expect(loggers.balancer.warn).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith('order', {
        baseAsset: 'LTC',
        quoteAsset: 'BTC',
        orderSide: OrderSide.Sell,
        quantity: 0.5,
      });
    });

    describe('enough maxSell capacity', () => {

      it('triggers a sell order without warning', async () => {
        process.env.MAXLTC = '3';
        process.env.MINLTC = '0.5';
        const baseAssetBalance: Balance = {
          asset: 'LTC',
          free: 2,
          locked: 3,
          maxsell: 200000000,
          maxbuy: 0,
        };
        await trade.setAssets(baseAssetBalance);
        // total is 2 + 3 = 5... and the max is 3
        // it should sell 2
        expect(loggers.balancer.warn).toHaveBeenCalledTimes(0);
        expect(emitSpy).toHaveBeenCalledWith('order', {
          baseAsset: 'LTC',
          quoteAsset: 'BTC',
          orderSide: OrderSide.Sell,
          quantity: 2,
        });
      });

    });

  });

  describe('LTC below min', () => {

    it('triggers a buy order with warning', async () => {
      process.env.MAXLTC = '3';
      process.env.MINLTC = '0.5';
      const baseAssetBalance: Balance = {
        asset: 'LTC',
        free: 0.1,
        locked: 0.3,
        maxsell: 4000000,
        maxbuy: 6000000,
      };
      await trade.setAssets(baseAssetBalance);
      // total is 0.1 + 0.3 = 0.4... and the min is 0.5
      // it should buy 1.75 (min+max/2) - currentAllocation
      // we only have channel capacity to receive 0.06, so
      // we emit 0.06 and display a warning
      expect(loggers.balancer.warn).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith('order', {
        baseAsset: 'LTC',
        quoteAsset: 'BTC',
        orderSide: OrderSide.Buy,
        quantity: 0.06,
      });
    });

    describe('enough maxBuy capacity', () => {

      it('triggers a buy order without warning', async () => {
        process.env.MAXLTC = '3';
        process.env.MINLTC = '0.5';
        const baseAssetBalance: Balance = {
          asset: 'LTC',
          free: 0.3,
          locked: 0.1,
          maxsell: 0,
          maxbuy: 135000000,
        };
        await trade.setAssets(baseAssetBalance);
        // total is 0.1 + 0.3 = 0.4... and the min is 0.5
        // it should buy 1.75 (min+max/2) - currentAllocation
        // we only have channel capacity to receive 0.06, so
        // we emit 0.06 and display a warning
        expect(loggers.balancer.warn).toHaveBeenCalledTimes(0);
        expect(emitSpy).toHaveBeenCalledWith('order', {
          baseAsset: 'LTC',
          quoteAsset: 'BTC',
          orderSide: OrderSide.Buy,
          quantity: 1.35,
        });
      });

    });

  });

});
