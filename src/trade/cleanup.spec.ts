import { TestScheduler } from 'rxjs/testing';
import { getCleanup$ } from './cleanup';
import { testConfig, getLoggers } from '../test-utils';
import { Observable } from 'rxjs';
import { Exchange } from 'ccxt';

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
    removeOpenDEXorders$: string | string[];
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
    const openDEXorders$ = cold(inputEvents.removeOpenDEXorders$);
    const removeOpenDEXorders$ = () => {
      return (openDEXorders$ as unknown) as Observable<null>;
    };
    const CEXorders$ = cold(inputEvents.removeCEXorders$);
    const removeCEXorders$ = () => CEXorders$;
    const CEX = (null as unknown) as Exchange;
    const cleanup$ = getCleanup$({
      loggers: getLoggers(),
      config: testConfig(),
      removeOpenDEXorders$,
      removeCEXorders$,
      CEX,
    });
    expectObservable(cleanup$, inputEvents.unsubscribe).toBe(expected);
    expectSubscriptions(CEXorders$.subscriptions).toBe(
      expectedSubscriptions.removeCEXorders$
    );
    expectSubscriptions(openDEXorders$.subscriptions).toBe(
      expectedSubscriptions.removeOpenDEXorders$
    );
  });
};

describe('getCleanup$$', () => {
  beforeEach(testSchedulerSetup);

  it('removes all orders on OpenDEX and CEX', () => {
    expect.assertions(3);
    const inputEvents = {
      removeOpenDEXorders$: '1s a',
      removeCEXorders$: '2s a',
    };
    const expected = '2s |';
    const expectedSubscriptions = {
      removeCEXorders$: '^ 1999ms !',
      removeOpenDEXorders$: '^ 1999ms !',
    };
    assertGetTrade({
      inputEvents,
      expected,
      expectedSubscriptions,
    });
  });

  it('retries when OpenDEX fails up to 5 times', () => {
    expect.assertions(3);
    const inputEvents = {
      removeOpenDEXorders$: '1s #',
      removeCEXorders$: '2s a',
      unsubscribe: '15s !',
    };
    const expected = '11s #';
    const expectedSubscriptions = {
      removeCEXorders$: '^ 10999ms !',
      removeOpenDEXorders$: [
        '^ 999ms !',
        '2s ^ 999ms !',
        '4s ^ 999ms !',
        '6s ^ 999ms !',
        '8s ^ 999ms !',
        '10s ^ 999ms !',
      ],
    };
    assertGetTrade({
      inputEvents,
      expected,
      expectedSubscriptions,
    });
  });

  it('retries when CEX fails up to 5 times', () => {
    expect.assertions(3);
    const inputEvents = {
      removeOpenDEXorders$: '1s a',
      removeCEXorders$: '2s #',
      unsubscribe: '20s !',
    };
    const expected = '17s #';
    const expectedSubscriptions = {
      removeCEXorders$: [
        '^ 1999ms !',
        '3s ^ 1999ms !',
        '6s ^ 1999ms !',
        '9s ^ 1999ms !',
        '12s ^ 1999ms !',
        '15s ^ 1999ms !',
      ],
      removeOpenDEXorders$: '^ 16999ms !',
    };
    assertGetTrade({
      inputEvents,
      expected,
      expectedSubscriptions,
    });
  });
});
