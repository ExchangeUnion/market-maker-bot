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
  expectedSubscriptions: {
    removeCEXorders$: string | string[];
  };
  inputEvents: {
    removeOpenDEXorders$: string;
    removeCEXorders$: string;
    unsubscribe?: string;
  };
};

const assertGetTrade = ({
  expected,
  expectedSubscriptions,
  inputEvents,
}: AssertCleanupParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable, expectSubscriptions } = helpers;
    const removeOpenDEXorders$ = () => {
      return (cold(inputEvents.removeOpenDEXorders$) as unknown) as Observable<
        null
      >;
    };
    const CEXorders$ = cold(inputEvents.removeCEXorders$);
    const removeCEXorders$ = () => CEXorders$;
    const cleanup$ = getCleanup$({
      loggers: getLoggers(),
      config: testConfig(),
      removeOpenDEXorders$,
      removeCEXorders$,
    });
    expectObservable(cleanup$, inputEvents.unsubscribe).toBe(expected);
    expectSubscriptions(CEXorders$.subscriptions).toBe(
      expectedSubscriptions.removeCEXorders$
    );
  });
};

describe('getCleanup$$', () => {
  beforeEach(testSchedulerSetup);

  it('removes all orders on OpenDEX and CEX', () => {
    expect.assertions(2);
    const inputEvents = {
      removeOpenDEXorders$: '1s a',
      removeCEXorders$: '2s a',
    };
    const expected = '2s |';
    const expectedSubscriptions = {
      removeCEXorders$: '^ 1999ms !',
    };
    assertGetTrade({
      inputEvents,
      expected,
      expectedSubscriptions,
    });
  });

  it('retries when CEX fails', () => {
    expect.assertions(2);
    const inputEvents = {
      removeOpenDEXorders$: '1s a',
      removeCEXorders$: '2s #',
      unsubscribe: '5s !',
    };
    const expected = '';
    const expectedSubscriptions = {
      removeCEXorders$: ['^ 1999ms !', '3s ^ 1999ms !'],
    };
    assertGetTrade({
      inputEvents,
      expected,
      expectedSubscriptions,
    });
  });
});
