import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig, TestError } from '../test-utils';
import { getNewTrade$ } from './trade';
import BigNumber from 'bignumber.js';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertGetTradeParams = {
  expected: string;
  expectedError?: TestError;
  inputEvents: {
    openDEXcomplete$: string;
    getCentralizedExchangeOrder$: string;
    shutdown$: string;
    catchOpenDEXerror$: string;
  };
  errorValues?: {
    openDEXcomplete$?: TestError;
    getCentralizedExchangeOrder$?: TestError;
    shutdown$?: TestError;
    catchOpenDEXerror$?: TestError;
  };
};

const assertGetTrade = ({
  expected,
  expectedError,
  inputEvents,
  errorValues,
}: AssertGetTradeParams) => {
  const inputValues = {
    openDEXcomplete$: {
      a: true,
    },
  };
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getCentralizedExchangeOrder$ = () => {
      return (cold(
        inputEvents.getCentralizedExchangeOrder$,
        undefined,
        errorValues?.getCentralizedExchangeOrder$
      ) as unknown) as Observable<null>;
    };
    const shutdown$ = cold(inputEvents.shutdown$);
    const getOpenDEXcomplete$ = () => {
      return cold(
        inputEvents.openDEXcomplete$,
        inputValues.openDEXcomplete$,
        errorValues?.openDEXcomplete$
      );
    };
    const catchOpenDEXerror = () => (source: Observable<unknown>) => {
      return source.pipe(
        catchError(() => {
          return cold(
            inputEvents.catchOpenDEXerror$,
            undefined,
            errorValues?.catchOpenDEXerror$
          );
        })
      );
    };
    const getCentralizedExchangePrice$ = () => {
      return (cold('') as unknown) as Observable<BigNumber>;
    };
    const trade$ = getNewTrade$({
      shutdown$,
      loggers: getLoggers(),
      getOpenDEXcomplete$,
      config: testConfig(),
      getCentralizedExchangeOrder$,
      catchOpenDEXerror,
      getCentralizedExchangePrice$,
    });
    expectObservable(trade$).toBe(expected, { a: true }, expectedError);
  });
};

describe('getTrade$', () => {
  beforeEach(testSchedulerSetup);

  it('emits when arbitrage trade complete', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s (a|)',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '3s a',
      catchOpenDEXerror$: '',
    };
    const expected = '1s a 999ms a 999ms |';
    assertGetTrade({
      inputEvents,
      expected,
    });
  });

  it('retries when recoverable OpenDEX error happens', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '2s (a|)',
      shutdown$: '5s a',
      catchOpenDEXerror$: '500ms (a|)',
    };
    const expected = '2s a 1999ms a 999ms |';
    assertGetTrade({
      inputEvents,
      expected,
    });
  });

  it('stops when unexpected OpenDEX error happens', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '2s a',
      shutdown$: '5s a',
      catchOpenDEXerror$: '1500ms #',
    };
    const unexpectedError = {
      code: '1234',
      message: 'some unexpected OpenDEX error',
    };
    const errorValues = {
      openDEXcomplete$: unexpectedError,
      catchOpenDEXerror$: unexpectedError,
    };
    const expected = '2s a 499ms #';
    assertGetTrade({
      inputEvents,
      expected,
      expectedError: unexpectedError,
      errorValues,
    });
  });

  it('stops when centralized exchange error happens', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s a',
      getCentralizedExchangeOrder$: '1s #',
      shutdown$: '5s a',
      catchOpenDEXerror$: '',
    };
    const expected = '1s #';
    assertGetTrade({
      inputEvents,
      expected,
    });
  });
});
