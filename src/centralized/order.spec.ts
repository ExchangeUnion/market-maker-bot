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
    const processSwapSuccess = (acc: string, curr: string) => {
      return acc + curr;
    };
    const quantityGreaterThanCEXminimum = (v: string) => {
      return v.length > 2;
    };
    const centralizedExchangeOrder$ = getCentralizedExchangeOrder$({
      logger: getLoggers().centralized,
      config,
      getOpenDEXorderFilled$,
      createCentralizedExchangeOrder$,
      processSwapSuccess,
      quantityGreaterThanCEXminimum,
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

  it('finishes centralized exchange order when OpenDEX filled stream errors afterwards', () => {
    const inputEvents = {
      openDEXorderFilled: '1s a 999ms a 999ms a #',
      createCentralizedExchangeOrder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '8s a';
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

  it('accumulates filled values until threshold and executes CEX orders in order', () => {
    const inputEvents = {
      openDEXorderFilled: '1s a 999ms a 999ms a',
      createCentralizedExchangeOrder$: '5s (a|)',
      unsubscribe: '20s !',
    };
    const expected = '8s a 4999ms a 4999ms a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });
});
