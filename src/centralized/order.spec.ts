import { TestScheduler } from 'rxjs/testing';
import { getCentralizedExchangeOrder$ } from './order';
import { testConfig, getLoggers } from '../test-utils';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { Observable } from 'rxjs';

let testScheduler: TestScheduler;

type CentralizedExchangeOrderInputEvents = {
  openDEXorderFilled: string;
  createCentralizedExchangeOrder$: string;
  unsubscribe?: string;
};

const assertCentralizedExchangeOrder = (
  inputEvents: CentralizedExchangeOrderInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const config = testConfig();
    const getOpenDEXorderFilled$ = () => {
      return (cold(inputEvents.openDEXorderFilled) as unknown) as Observable<
        SwapSuccess
      >;
    };
    const createCentralizedExchangeOrder$ = () => {
      return (cold(
        inputEvents.createCentralizedExchangeOrder$
      ) as unknown) as Observable<null>;
    };
    const centralizedExchangeOrder$ = getCentralizedExchangeOrder$({
      logger: getLoggers().centralized,
      config,
      getOpenDEXorderFilled$,
      createCentralizedExchangeOrder$,
    });
    expectObservable(centralizedExchangeOrder$, inputEvents.unsubscribe).toBe(
      expected
    );
  });
};

describe('getCentralizedExchangeOrder$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('waits for OpenDEX order to be filled before executing centralized exchange order', () => {
    const inputEvents = {
      openDEXorderFilled: '1s a',
      createCentralizedExchangeOrder$: '1s a',
    };
    const expected = '2s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });

  it('finishes centralized exchange order when OpenDEX filled stream errors afterwards', () => {
    const inputEvents = {
      openDEXorderFilled: '1s a #',
      createCentralizedExchangeOrder$: '5s a',
      unsubscribe: '7s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });

  it('repeats the OpenDEX order filled stream upon error', () => {
    const inputEvents = {
      openDEXorderFilled: '1s #',
      createCentralizedExchangeOrder$: '5s a',
      unsubscribe: '7s !',
    };
    const expected = '';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });
});
