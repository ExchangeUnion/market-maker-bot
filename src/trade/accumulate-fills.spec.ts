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

describe.skip('accumulateOrderFillsForAsset$', () => {
  beforeEach(testSchedulerSetup);

  test('when we bough ETH with BTC it accumulates ETH received quantity', () => {
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

  it('we received BTC', () => {
    expect.assertions(1);
    const inputEvents = '1s a 999ms b 999ms c';
    const swapSuccessA = {
      getAmountReceived: () => 25000000000,
      getCurrencyReceived: () => 'ETH',
      getAmountSent: () => 6000000,
      getCurrencySent: () => 'BTC',
    } as SwapSuccess;
    const swapSuccessB = {
      getAmountReceived: () => 300000000,
      getCurrencyReceived: () => 'BTC',
      getAmountSent: () => 12000000000,
      getCurrencySent: () => 'ETH',
    } as SwapSuccess;
    const swapSuccessC = {
      getAmountReceived: () => 30000000000,
      getCurrencyReceived: () => 'ETH',
      getAmountSent: () => 7400000,
      getCurrencySent: () => 'BTC',
    } as SwapSuccess;
    const inputValues = {
      a: swapSuccessA,
      b: swapSuccessB,
      c: swapSuccessC,
    };
    const expected = '1s a 999ms b 999ms c';
    const expectedValues = {
      a: new BigNumber('0.06'),
      b: new BigNumber('0.06'),
      c: new BigNumber('0.134'),
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
