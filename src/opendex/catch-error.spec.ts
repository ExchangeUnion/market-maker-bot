import { TestScheduler } from 'rxjs/testing';
import { errors } from '../opendex/errors';
import { getLoggers, TestError } from '../test-utils';
import { catchOpenDEXerror } from './catch-error';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertCatchOpenDEXerrorParams = {
  inputEvents: string;
  inputError?: TestError;
  expected: string;
  expectedSubscriptions: string | string[];
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
    const output$ = catchOpenDEXerror(getLoggers())(input$);
    expectObservable(output$, unsubscribe).toBe(
      expected,
      undefined,
      expectedError
    );
    expectSubscriptions(input$.subscriptions).toBe(expectedSubscriptions);
  });
};

describe('catchOpenDEXerror', () => {
  beforeEach(testSchedulerSetup);

  it('does not retry unexpected error', () => {
    expect.assertions(2);
    const inputEvents = '1s #';
    const inputError = {
      code: 1234,
      message: 'unexpected',
    };
    const expected = '1s #';
    const expectedSubscriptions = '^ 999ms !';
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

  it('retries XUD_CLIENT_INVALID_CERT', () => {
    expect.assertions(2);
    const inputEvents = '1s #';
    const inputError = errors.XUD_CLIENT_INVALID_CERT('/invalid/cert/path');
    const expected = '';
    const expectedSubscriptions = ['^ 999ms !', '6s ^ 999ms !'];
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
    expect.assertions(2);
    const inputEvents = '1s #';
    const inputError = errors.BALANCE_MISSING('ETH');
    const expected = '';
    const expectedSubscriptions = ['^ 999ms !', '6s ^ 999ms !'];
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
    expect.assertions(2);
    const inputEvents = '1s #';
    const inputError = errors.TRADING_LIMITS_MISSING('BTC');
    const expected = '';
    const expectedSubscriptions = ['^ 999ms !', '6s ^ 999ms !'];
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
    expect.assertions(2);
    const inputEvents = '1s #';
    const inputError = errors.INVALID_ORDERS_LIST('ETH/BTC');
    const expected = '';
    const expectedSubscriptions = ['^ 999ms !', '6s ^ 999ms !'];
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });

  it('retries CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR', () => {
    expect.assertions(2);
    const inputEvents = '1s #';
    const inputError = errors.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR;
    const expected = '';
    const expectedSubscriptions = ['^ 999ms !', '6s ^ 999ms !'];
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
      expectedSubscriptions,
    });
  });
});
