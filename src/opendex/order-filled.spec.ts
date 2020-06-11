import { TestScheduler } from 'rxjs/testing';
import { testConfig, TestError } from '../../test/utils';
import { getOpenDEXorderFilled$ } from './order-filled';
import { Observable } from 'rxjs';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../broker/opendex/proto/xudrpc_pb';
import { errors, xudErrorCodes } from './errors';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type OpenDEXorderFilledInputEvents = {
  xudClient$: string;
  subscribeXudSwaps$: string;
};

type OpenDEXorderFilledErrorValues = {
  subscribeXudSwaps$: TestError;
};

const assertOpenDEXorderFilled = (
  inputEvents: OpenDEXorderFilledInputEvents,
  expected: string,
  errorValues?: OpenDEXorderFilledErrorValues,
  expectedError?: TestError
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const config = testConfig();
    const getXudClient$ = () => {
      return (cold(inputEvents.xudClient$) as unknown) as Observable<XudClient>;
    };
    const subscribeXudSwaps$ = () => {
      return (cold(
        inputEvents.subscribeXudSwaps$,
        {},
        errorValues?.subscribeXudSwaps$
      ) as unknown) as Observable<SwapSuccess>;
    };
    const orderFilled$ = getOpenDEXorderFilled$({
      config,
      getXudClient$,
      subscribeXudSwaps$,
    });
    expectObservable(orderFilled$).toBe(expected, {}, expectedError);
  });
};

describe('getOpenDEXorderFilled$', () => {
  beforeEach(testSchedulerSetup);

  it('emits when order filled', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s a',
    };
    const expectedEvents = '2s a';
    assertOpenDEXorderFilled(inputEvents, expectedEvents);
  });

  it('rethrows xud unavailable error', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s #',
    };
    const expectedEvents = '2s #';
    const expectedError = errors.XUD_UNAVAILABLE;
    const errorValues = {
      subscribeXudSwaps$: {
        code: xudErrorCodes.UNAVAILABLE,
        message: 'UNAVAILABLE: No connection established',
      },
    };
    assertOpenDEXorderFilled(
      inputEvents,
      expectedEvents,
      errorValues,
      expectedError
    );
  });

  it('does not rethrow unknown error', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s #',
    };
    const expectedEvents = '2s #';
    const expectedError = {
      code: '123',
      message: 'unknown',
    };
    const errorValues = {
      subscribeXudSwaps$: {
        code: '123',
        message: 'unknown',
      },
    };
    assertOpenDEXorderFilled(
      inputEvents,
      expectedEvents,
      errorValues,
      expectedError
    );
  });
});
