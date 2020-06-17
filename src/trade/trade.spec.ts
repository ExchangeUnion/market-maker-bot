import { TestScheduler } from 'rxjs/testing';
import { errors } from '../opendex/errors';
import { getLoggers, testConfig, TestError } from '../test-utils';
import { getNewTrade$ } from './trade';
import { Observable } from 'rxjs';

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
    removeOpenDEXorders$: string;
  };
  errorValues?: {
    openDEXcomplete$?: TestError;
    getCentralizedExchangeOrder$?: TestError;
    shutdown$?: TestError;
    removeOpenDEXorders$?: TestError;
  };
};

const assertGetTrade = ({
  expected,
  expectedError,
  inputEvents,
  errorValues,
}: AssertGetTradeParams) => {
  const inputValues = {
    getCentralizedExchangeOrder$: {
      a: true,
    },
    openDEXcomplete$: {
      a: true,
    },
  };
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getCentralizedExchangeOrder$ = () => {
      return cold(
        inputEvents.getCentralizedExchangeOrder$,
        inputValues.getCentralizedExchangeOrder$
      );
    };
    const shutdown$ = cold(inputEvents.shutdown$);
    const getOpenDEXcomplete$ = () => {
      return cold(
        inputEvents.openDEXcomplete$,
        inputValues.openDEXcomplete$,
        errorValues?.openDEXcomplete$
      );
    };
    const getRemoveOpenDEXorders$ = () => {
      return (cold(
        inputEvents.removeOpenDEXorders$,
        {},
        errorValues?.removeOpenDEXorders$
      ) as unknown) as Observable<null>;
    };
    const trade$ = getNewTrade$({
      shutdown$,
      loggers: getLoggers(),
      getOpenDEXcomplete$,
      config: testConfig(),
      centralizedExchangeOrder$: getCentralizedExchangeOrder$,
      removeOpenDEXorders$: getRemoveOpenDEXorders$,
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
      shutdown$: '7s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const expected = '3s a 2999ms a 999ms |';
    assertGetTrade({
      inputEvents,
      expected,
    });
  });

  it('creates centralized exchange orders when swap succeeds, but removing OpenDEX orders fails', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s (a|)',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '7s a',
      removeOpenDEXorders$: '1s #',
    };
    const errorValues = {
      removeOpenDEXorders$: errors.XUD_UNAVAILABLE,
    };
    const expected = '3s a 2999ms a 999ms |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when xud unavailable', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.XUD_UNAVAILABLE,
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when xud locked', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.XUD_LOCKED,
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when xud cert file not found', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.XUD_CLIENT_INVALID_CERT('/invalid/cert/path'),
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when unable to retrieve asset balance', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.BALANCE_MISSING('ETH'),
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it("retries when unable to retrieve asset's trading limits", () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.TRADING_LIMITS_MISSING('BTC'),
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when unable to retrieve orders list', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.INVALID_ORDERS_LIST('ETH/BTC'),
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when price feed lost', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR,
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('retries when insufficient outbound balance', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const errorValues = {
      openDEXcomplete$: errors.INSUFFICIENT_OUTBOUND_BALANCE,
    };
    const expected = '5s |';
    assertGetTrade({
      inputEvents,
      expected,
      errorValues,
    });
  });

  it('stops when unexpected error happens', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '1s (a|)',
      shutdown$: '5s a',
      removeOpenDEXorders$: '1s (a|)',
    };
    const unexpectedError = {
      code: '1234',
      message: 'some unexpected error',
    };
    const errorValues = {
      openDEXcomplete$: unexpectedError,
    };
    const expected = '1s #';
    assertGetTrade({
      inputEvents,
      expected,
      expectedError: unexpectedError,
      errorValues,
    });
  });
});
