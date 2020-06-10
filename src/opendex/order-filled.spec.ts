import { TestScheduler } from 'rxjs/testing';
import { testConfig } from '../../test/utils';
import { getOpenDEXorderFilled$ } from './order-filled';
import { Observable } from 'rxjs';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../broker/opendex/proto/xudrpc_pb';

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

const assertOpenDEXorderFilled = (
  inputEvents: OpenDEXorderFilledInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, hot, expectObservable } = helpers;
    const config = testConfig();
    const getXudClient$ = () => {
      return (cold(inputEvents.xudClient$) as unknown) as Observable<XudClient>;
    };
    const subscribeXudSwaps$ = () => {
      return (cold(inputEvents.subscribeXudSwaps$) as unknown) as Observable<
        SwapSuccess
      >;
    };
    const orderFilled$ = getOpenDEXorderFilled$({
      config,
      getXudClient$,
      subscribeXudSwaps$,
    });
    expectObservable(orderFilled$).toBe(expected);
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
});
