import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { accumulateFillsScan } from './accumulate-fills-scan';
import BigNumber from 'bignumber.js';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertAccumulateFillsScanParams = {
  expected: string;
  expectedValues: {
    a: string;
    b: string;
    c: string;
  };
  inputEvents: string;
};

const assertAccumulateFillsScan = ({
  expected,
  expectedValues,
  inputEvents,
}: AssertAccumulateFillsScanParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const input$ = (cold(inputEvents) as unknown) as Observable<SwapSuccess>;
    const accumulator = (acc: any, curr: any) => {
      return acc + curr;
    };
    const startingValue = ('' as unknown) as BigNumber;
    const accumulateFillsScan$ = accumulateFillsScan(
      accumulator,
      startingValue
    )(input$);
    expectObservable(accumulateFillsScan$).toBe(expected, expectedValues);
  });
};

describe('accumlateFillsScan$', () => {
  beforeEach(testSchedulerSetup);

  it('accumulates values', () => {
    expect.assertions(1);
    const inputEvents = '1s a 999ms a 999ms a';
    const expected = '1s a 999ms b 999ms c';
    const expectedValues = {
      a: 'a',
      b: 'aa',
      c: 'aaa',
    };
    assertAccumulateFillsScan({
      inputEvents,
      expected,
      expectedValues,
    });
  });
});
