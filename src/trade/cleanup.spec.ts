import { TestScheduler } from 'rxjs/testing';
import { getCleanup$ } from './cleanup';
import { testConfig, getLoggers } from '../test-utils';
import { Observable } from 'rxjs';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertCleanupParams = {
  expected: string;
  inputEvents: {
    removeOpenDEXorders$: string;
    removeCEXorders$: string;
  };
};

const assertGetTrade = ({ expected, inputEvents }: AssertCleanupParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const removeOpenDEXorders$ = () => {
      return (cold(inputEvents.removeOpenDEXorders$) as unknown) as Observable<
        null
      >;
    };
    const removeCEXorders$ = () => {
      return cold(inputEvents.removeCEXorders$);
    };
    const cleanup$ = getCleanup$({
      loggers: getLoggers(),
      config: testConfig(),
      removeOpenDEXorders$,
      removeCEXorders$,
    });
    expectObservable(cleanup$).toBe(expected);
  });
};

describe('getCleanup$$', () => {
  beforeEach(testSchedulerSetup);

  it('removes all orders on OpenDEX and CEX', () => {
    expect.assertions(1);
    const inputEvents = {
      removeOpenDEXorders$: '1s a',
      removeCEXorders$: '2s a',
    };
    const expected = '2s |';
    assertGetTrade({
      inputEvents,
      expected,
    });
  });
});
