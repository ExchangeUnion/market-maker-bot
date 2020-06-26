import BigNumber from 'bignumber.js';
import { TestScheduler } from 'rxjs/testing';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { testConfig } from '../test-utils';
import { accumulateOrderFillsForAsset } from './accumulate-fills';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertAccumulateFillsScanParams = {
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
  expected,
  inputEvents,
  inputValues,
  expectedValues,
}: AssertAccumulateFillsScanParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const input$ = cold(inputEvents, inputValues);
    const config = testConfig();
    const accumulateOrderFillsForAsset$ = accumulateOrderFillsForAsset(
      config.BASEASSET
    )(input$);
    expectObservable(accumulateOrderFillsForAsset$).toBe(
      expected,
      expectedValues
    );
  });
};

describe('accumulateOrderFillsForAsset$', () => {
  beforeEach(testSchedulerSetup);

  it('accumulates quantity filled for ETH', () => {
    expect.assertions(1);
    const inputEvents = '1s a 999ms b 999ms c';
    const swapSuccessA = {
      getAmountReceived: () => 200000000,
      getCurrencyReceived: () => 'ETH',
    } as SwapSuccess;
    const swapSuccessB = {
      getAmountReceived: () => 300000000,
      getCurrencyReceived: () => 'BTC',
    } as SwapSuccess;
    const swapSuccessC = {
      getAmountReceived: () => 300000000,
      getCurrencyReceived: () => 'ETH',
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
      inputEvents,
      inputValues,
      expected,
      expectedValues,
    });
  });
});
