import { TestScheduler } from 'rxjs/testing';
import { errors } from '../opendex/errors';
import { getLoggers, TestError, testConfig } from '../test-utils';
import { catchOpenDEXerror } from './catch-error';
import { status } from '@grpc/grpc-js';
import { AuthenticationError } from 'ccxt';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertCatchOpenDEXerrorParams = {
  inputEvents: string;
  inputError?: TestError | AuthenticationError;
  expected: string;
  expectedSubscriptions: {
    input$: string | string[];
    cleanup$: string | string[];
  };
  expectedError?: TestError;
  unsubscribe: string;
};

const assertCatchOpenDEXerror = ({
  expected,
  expectedSubscriptions,
  inputEvents,
  inputError,
  expectedError,
  unsubscribe,
}: AssertCatchOpenDEXerrorParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable, expectSubscriptions } = helpers;
    const input$ = cold(inputEvents, undefined, inputError);
    const cleanup$ = cold('1s a|');
    const getCleanup$ = () => cleanup$;
    const config = testConfig();
    const output$ = catchOpenDEXerror(
      getLoggers(),
      config,
      getCleanup$
    )(input$);
    expectObservable(output$, unsubscribe).toBe(
      expected,
      undefined,
      expectedError
    );
    expectSubscriptions(input$.subscriptions).toBe(
      expectedSubscriptions.input$
    );
    expectSubscriptions(cleanup$.subscriptions).toBe(
      expectedSubscriptions.cleanup$
    );
  });
};

const ASSERTIONS_PER_TEST = 3;

describe('catchOpenDEXerror', () => {
  beforeEach(testSchedulerSetup);

  it('does not retry unexpected error', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = {
      code: 1234,
      message: 'unexpected',
    };
    const expected = '1s #';
    const expectedSubscriptions = {
      input$: '^ 999ms !',
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      expectedError: inputError,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('remaps CCXT AuthenticationError', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = new AuthenticationError(
      'Signature for this request is not valid.'
    );
    const expected = '1s #';
    const expectedSubscriptions = {
      input$: '^ 999ms !',
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    const expectedError = errors.CEX_INVALID_CREDENTIALS;
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      expectedError,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('retries XUD_CLIENT_INVALID_CERT', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = errors.XUD_CLIENT_INVALID_CERT('/invalid/cert/path');
    const expected = '';
    const expectedSubscriptions = {
      input$: ['^ 999ms !', '6s ^ 999ms !'],
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('retries BALANCE_MISSING', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = errors.BALANCE_MISSING('ETH');
    const expected = '';
    const expectedSubscriptions = {
      input$: ['^ 999ms !', '6s ^ 999ms !'],
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('retries TRADING_LIMITS_MISSING', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = errors.TRADING_LIMITS_MISSING('BTC');
    const expected = '';
    const expectedSubscriptions = {
      input$: ['^ 999ms !', '6s ^ 999ms !'],
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('retries INVALID_ORDERS_LIST', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = errors.INVALID_ORDERS_LIST('ETH/BTC');
    const expected = '';
    const expectedSubscriptions = {
      input$: ['^ 999ms !', '6s ^ 999ms !'],
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('cancels orders, retries CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR', () => {
    expect.assertions(ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const inputError = errors.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR;
    const expected = '';
    const expectedSubscriptions = {
      input$: ['^ 999ms !', '7001ms ^ 999ms !'],
      cleanup$: ['1s ^ 1s !', '8001ms ^ 1s !'],
    };
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('retries recoverable gRPC errors', () => {
    const recoverableGRPCerrors = [
      status.UNAVAILABLE,
      status.UNKNOWN,
      status.NOT_FOUND,
      status.ALREADY_EXISTS,
      status.FAILED_PRECONDITION,
      status.RESOURCE_EXHAUSTED,
      status.UNIMPLEMENTED,
      status.ABORTED,
      status.DEADLINE_EXCEEDED,
      status.INTERNAL,
    ];
    expect.assertions(recoverableGRPCerrors.length * ASSERTIONS_PER_TEST);
    const inputEvents = '1s #';
    const expected = '';
    const expectedSubscriptions = {
      input$: ['^ 999ms !', '6s ^ 999ms !'],
      cleanup$: [],
    };
    const unsubscribe = '10s !';
    recoverableGRPCerrors.forEach(grpcError => {
      const inputError = {
        code: grpcError,
        message: 'gRPC error',
      };
      testSchedulerSetup();
      assertCatchOpenDEXerror({
        inputEvents,
        inputError,
        expected,
        unsubscribe,
        expectedSubscriptions,
      });
    });
  });
});
