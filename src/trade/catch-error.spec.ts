import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig, TestError } from '../test-utils';
import { catchOpenDEXerror } from './catch-error';
import { errors } from '../opendex/errors';

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
  expectedError?: TestError;
  unsubscribe: string;
};

const assertCatchOpenDEXerror = ({
  expected,
  inputEvents,
  inputError,
  expectedError,
  unsubscribe,
}: AssertCatchOpenDEXerrorParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const input$ = cold(inputEvents, undefined, inputError);
    const output$ = catchOpenDEXerror(getLoggers())(input$);
    expectObservable(output$, unsubscribe).toBe(expected, undefined, expectedError);
  });
};

describe('catchOpenDEXerror', () => {
  beforeEach(testSchedulerSetup);

  it('retries XUD_CLIENT_INVALID_CERT', () => {
    expect.assertions(1);
    const inputEvents = '1s #';
    const inputError = errors.XUD_CLIENT_INVALID_CERT('/invalid/cert/path');
    const expected = '';
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
    });
  });

  it('retries BALANCE_MISSING', () => {
    expect.assertions(1);
    const inputEvents = '1s #';
    const inputError = errors.BALANCE_MISSING('ETH');
    const expected = '';
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
    });
  });

  it('retries TRADING_LIMITS_MISSING', () => {
    expect.assertions(1);
    const inputEvents = '1s #';
    const inputError = errors.TRADING_LIMITS_MISSING('BTC');
    const expected = '';
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
    });
  });

  it('retries INVALID_ORDERS_LIST', () => {
    expect.assertions(1);
    const inputEvents = '1s #';
    const inputError = errors.INVALID_ORDERS_LIST('ETH/BTC');
    const expected = '';
    const unsubscribe = '10s !';
    assertCatchOpenDEXerror({
      inputEvents,
      inputError,
      expected,
      unsubscribe,
    });
  });

  /*
  it('retries when price feed lost', () => {
    expect.assertions(1);
    const inputEvents = {
      openDEXcomplete$: '1s #',
      getCentralizedExchangeOrder$: '',
      shutdown$: '5s a',
    };
    const errorValues = {
      openDEXcomplete$: errors.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR,
    };
    const expected = '5s |';
    assertCatchOpenDEXerror({
      inputEvents,
      expected,
      errorValues,
    });
  });
  */
});
