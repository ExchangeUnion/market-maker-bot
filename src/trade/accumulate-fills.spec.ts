import BigNumber from 'bignumber.js';
import { TestScheduler } from 'rxjs/testing';
import { Asset } from '../constants';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { accumulateOrderFillsForAsset } from './accumulate-fills';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertAccumulateFillsScanParams = {
  asset: Asset;
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

const assertAccumulateFills = ({
  asset,
  expected,
  inputEvents,
  inputValues,
  expectedValues,
}: AssertAccumulateFillsScanParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const input$ = cold(inputEvents, inputValues);
    const accumulateOrderFillsForAsset$ = accumulateOrderFillsForAsset(asset)(
      input$
    );
    expectObservable(accumulateOrderFillsForAsset$).toBe(
      expected,
      expectedValues
    );
  });
};

describe('accumulateOrderFillsForAsset$', () => {
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
    it('accumulates BTC (quote asset) received', () => {
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
