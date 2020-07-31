import BigNumber from 'bignumber.js';
import { TestScheduler } from 'rxjs/testing';
import { Config } from '../config';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { testConfig } from '../test-utils';
import {
  accumulateOrderFillsForBaseAssetReceived,
  accumulateOrderFillsForQuoteAssetReceived,
} from './accumulate-fills';

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
      config
    )(input$);
    expectObservable(accumulateOrderFillsForBaseAssetReceived$).toBe(
      expected,
      expectedValues
    );
  });
};

const assertAccumulateFillsForQuoteAssetReceived = ({
  config,
  expected,
  inputEvents,
  inputValues,
  expectedValues,
}: AssertAccumulateFillsScanParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const input$ = cold(inputEvents, inputValues);
    const accumulateOrderFillsForQuoteAssetReceived$ = accumulateOrderFillsForQuoteAssetReceived(
      config
    )(input$);
    expectObservable(accumulateOrderFillsForQuoteAssetReceived$).toBe(
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

describe('accumulateOrderFillsForQuoteAssetReceived', () => {
  beforeEach(testSchedulerSetup);

  describe('BTCDAI', () => {
    describe('received DAI (quote asset)', () => {
      it('accumulates DAI (quote asset) received', () => {
        expect.assertions(1);
        const inputEvents = '1s a 999ms b 999ms c';
        const swapSuccessA = {
          getAmountReceived: () => 1000000000000,
          getCurrencyReceived: () => 'DAI',
          getCurrencySent: () => 'BTC',
          getAmountSent: () => 100000000,
        } as SwapSuccess;
        const swapSuccessB = {
          getAmountReceived: () => 2000000000000,
          getCurrencyReceived: () => 'DAI',
          getCurrencySent: () => 'BTC',
          getAmountSent: () => 200000000,
        } as SwapSuccess;
        const swapSuccessC = {
          getAmountReceived: () => 3000000000000,
          getCurrencyReceived: () => 'DAI',
          getCurrencySent: () => 'BTC',
          getAmountSent: () => 300000000,
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
        assertAccumulateFillsForQuoteAssetReceived({
          config,
          inputEvents,
          inputValues,
          expected,
          expectedValues,
        });
      });
    });
  });

  describe('ETHBTC', () => {
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
          getAmountReceived: () => 300000000,
          getCurrencyReceived: () => 'BTC',
          getCurrencySent: () => 'ETH',
          getAmountSent: () => 12000000000,
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
          b: new BigNumber('240'),
          c: new BigNumber('243'),
        };
        const config = testConfig();
        assertAccumulateFillsForQuoteAssetReceived({
          config,
          inputEvents,
          inputValues,
          expected,
          expectedValues,
        });
      });
    });
  });
});
