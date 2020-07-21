import BigNumber from 'bignumber.js';
import { TestScheduler } from 'rxjs/testing';
// import { Asset } from '../constants';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { accumulateOrderFillsForBaseAssetReceived } from './accumulate-fills';
import { testConfig } from '../test-utils';
import { Config } from '../config';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertAccumulateFillsScanParams = {
  config: Config;
  expected: string;
  inputEvents: string;
  inputValues: {
    a: SwapSuccess;
  };
  expectedValues: {
    a: BigNumber;
    b: BigNumber;
    c: BigNumber;
  };
};

const assertAccumulateFillsForBaseAssetReceived = ({
  config,
  expected,
  inputEvents,
  inputValues,
  expectedValues,
}: AssertAccumulateFillsScanParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const input$ = cold(inputEvents, inputValues);
    const accumulateOrderFillsForBaseAssetReceived$ = accumulateOrderFillsForBaseAssetReceived(
      config,
      input$
    );
    expectObservable(accumulateOrderFillsForBaseAssetReceived$).toBe(
      expected,
      expectedValues
    );
  });
};

describe('accumulateOrderFillsForBaseAssetReceived', () => {
  beforeEach(testSchedulerSetup);

  describe('ETHBTC', () => {
    it('accumulates ETH (base asset) received', () => {
      expect.assertions(1);
      const inputEvents = '1s a 999ms b 999ms c';
      const swapSuccessA = {
        getAmountReceived: () => 200000000,
        getCurrencyReceived: () => 'ETH',
        getCurrencySent: () => 'BTC',
        getAmountSent: () => 500000,
      } as SwapSuccess;
      const swapSuccessB = {
        getAmountReceived: () => 300000000,
        getCurrencyReceived: () => 'ETH',
        getCurrencySent: () => 'BTC',
        getAmountSent: () => 750000,
      } as SwapSuccess;
      const swapSuccessC = {
        getAmountReceived: () => 300000000,
        getCurrencyReceived: () => 'ETH',
        getCurrencySent: () => 'BTC',
        getAmountSent: () => 750000,
      } as SwapSuccess;
      const inputValues = {
        a: swapSuccessA,
        b: swapSuccessB,
        c: swapSuccessC,
      };
      const expected = '1s a 999ms b 999ms c';
      const expectedValues = {
        a: new BigNumber('2'),
        b: new BigNumber('5'),
        c: new BigNumber('8'),
      };
      const config = testConfig();
      assertAccumulateFillsForBaseAssetReceived({
        config,
        inputEvents,
        inputValues,
        expected,
        expectedValues,
      });
    });
  });

  describe('BTCDAI', () => {
    it('accumulates DAI (quote asset) sent', () => {
      expect.assertions(1);
      const inputEvents = '1s a 999ms b 999ms c';
      const swapSuccessA = {
        getAmountReceived: () => 100000000,
        getCurrencyReceived: () => 'BTC',
        getCurrencySent: () => 'DAI',
        getAmountSent: () => 1000000000000,
      } as SwapSuccess;
      const swapSuccessB = {
        getAmountReceived: () => 200000000,
        getCurrencyReceived: () => 'BTC',
        getCurrencySent: () => 'DAI',
        getAmountSent: () => 2000000000000,
      } as SwapSuccess;
      const swapSuccessC = {
        getAmountReceived: () => 300000000,
        getCurrencyReceived: () => 'BTC',
        getCurrencySent: () => 'DAI',
        getAmountSent: () => 3000000000000,
      } as SwapSuccess;
      const inputValues = {
        a: swapSuccessA,
        b: swapSuccessB,
        c: swapSuccessC,
      };
      const expected = '1s a 999ms b 999ms c';
      const expectedValues = {
        a: new BigNumber('10000'),
        b: new BigNumber('30000'),
        c: new BigNumber('60000'),
      };
      const config: Config = {
        ...testConfig(),
        BASEASSET: 'BTC',
        QUOTEASSET: 'DAI',
      };
      assertAccumulateFillsForBaseAssetReceived({
        config,
        inputEvents,
        inputValues,
        expected,
        expectedValues,
      });
    });
  });
});

/*
describe('accumulateOrderFillsForAssetReceived$', () => {
  beforeEach(testSchedulerSetup);

  describe('received ETH (base asset)', () => {
    it('accumulates ETH (base asset) received', () => {
      expect.assertions(1);
      const inputEvents = '1s a 999ms b 999ms c';
      const swapSuccessA = {
        getAmountReceived: () => 200000000,
        getCurrencyReceived: () => 'ETH',
        getCurrencySent: () => 'BTC',
        getAmountSent: () => 500000,
      } as SwapSuccess;
      const swapSuccessB = {
        getAmountReceived: () => 300000000,
        getCurrencyReceived: () => 'BTC',
        getCurrencySent: () => 'ETH',
        getAmountSent: () => 12000000000,
      } as SwapSuccess;
      const swapSuccessC = {
        getAmountReceived: () => 300000000,
        getCurrencyReceived: () => 'ETH',
        getCurrencySent: () => 'BTC',
        getAmountSent: () => 750000,
      } as SwapSuccess;
      const inputValues = {
        a: swapSuccessA,
        b: swapSuccessB,
        c: swapSuccessC,
      };
      const expected = '1s a 999ms b 999ms c';
      const expectedValues = {
        a: new BigNumber('2'),
        b: new BigNumber('2'),
        c: new BigNumber('5'),
      };
      assertAccumulateFills({
        asset: 'ETH',
        inputEvents,
        inputValues,
        expected,
        expectedValues,
      });
    });
  });

  describe('received BTC (quote asset)', () => {
    it('accumulates ETH (base asset) sent', () => {
      expect.assertions(1);
      const inputEvents = '1s a 999ms b 999ms c';
      const swapSuccessA = {
        getAmountReceived: () => 300000000,
        getCurrencyReceived: () => 'BTC',
        getCurrencySent: () => 'ETH',
        getAmountSent: () => 12000000000,
      } as SwapSuccess;
      const swapSuccessB = {
        getAmountReceived: () => 200000000,
        getCurrencyReceived: () => 'ETH',
        getCurrencySent: () => 'BTC',
        getAmountSent: () => 500000,
      } as SwapSuccess;
      const swapSuccessC = {
        getAmountReceived: () => 750000,
        getCurrencyReceived: () => 'BTC',
        getCurrencySent: () => 'ETH',
        getAmountSent: () => 300000000,
      } as SwapSuccess;
      const inputValues = {
        a: swapSuccessA,
        b: swapSuccessB,
        c: swapSuccessC,
      };
      const expected = '1s a 999ms b 999ms c';
      const expectedValues = {
        a: new BigNumber('120'),
        b: new BigNumber('120'),
        c: new BigNumber('123'),
      };
      assertAccumulateFills({
        asset: 'BTC',
        inputEvents,
        inputValues,
        expected,
        expectedValues,
      });
    });
  });
});
*/
