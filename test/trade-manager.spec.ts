import { TradeManager } from '../src/trade/manager';
import { ExchangeBroker } from '../src/broker/exchange';
import { Logger, Level } from '../src/logger';
import { ArbitrageTrade } from '../src/trade/arbitrage-trade';

jest.mock('../src/broker/exchange');
const mockedExchangeBroker = <jest.Mock<ExchangeBroker>><any>ExchangeBroker;

jest.mock('../src/trade/arbitrage-trade');

const loggers = Logger.createLoggers(Level.Warn);

describe('TradeManager', () => {
  let brokerManager: TradeManager;
  let openDexBroker: ExchangeBroker;
  let binanceBroker: ExchangeBroker;

  beforeEach(() => {
    openDexBroker = new mockedExchangeBroker();
    openDexBroker.start = jest.fn();
    openDexBroker.close = jest.fn();
    binanceBroker = new mockedExchangeBroker();
    binanceBroker.start = jest.fn();
    binanceBroker.close = jest.fn();
    ArbitrageTrade.prototype.start = jest.fn();
    ArbitrageTrade.prototype.close = jest.fn();
    loggers.trademanager.warn = jest.fn();
    brokerManager = new TradeManager({
      opendex: openDexBroker,
      binance: binanceBroker,
      logger: loggers.trademanager,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    const tradeCount = 1;

    beforeEach(async () => {
      await brokerManager.start();
    });

    it('starts the brokers', () => {
      expect(openDexBroker.start).toHaveBeenCalledTimes(1);
      expect(binanceBroker.start).toHaveBeenCalledTimes(1);
    });

    it(`starts ${tradeCount} trades`, () => {
      expect(ArbitrageTrade.prototype.constructor).toHaveBeenCalledTimes(tradeCount);
      expect(ArbitrageTrade.prototype.start).toHaveBeenCalledTimes(tradeCount);
      expect(brokerManager['trades'].size).toEqual(tradeCount);
    });

    it('starts ETH/BTC trade', () => {
      expect(ArbitrageTrade.prototype.constructor)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            baseAsset: 'ETH',
            quoteAsset: 'BTC',
          }),
        );
    });

    describe('close', () => {

      beforeEach(async () => {
        await brokerManager.close();
      });

      it('closes the brokers', () => {
        expect(ArbitrageTrade.prototype.close).toHaveBeenCalledTimes(tradeCount);
        expect(openDexBroker.close).toHaveBeenCalledTimes(1);
        expect(binanceBroker.close).toHaveBeenCalledTimes(1);
      });

    });

  });

});
