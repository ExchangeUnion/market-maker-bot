import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { getLoggers, testConfig } from '../test-utils';
import { getCentralizedExchangeOrder$ } from './order';

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
    const accumulateOrderFillsForAsset = () => (v: any) => v;
    const shouldCreateCEXorder = (v: any) => (v === 'a' ? true : false);
    const centralizedExchangeOrder$ = getCentralizedExchangeOrder$({
      logger: getLoggers().centralized,
      config,
      getOpenDEXorderFilled$,
      createCentralizedExchangeOrder$,
      accumulateOrderFillsForAsset,
      shouldCreateCEXorder,
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
      openDEXorderFilled: '1s b 999ms b 999ms a #',
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

  it('filters quantities less than allowed minimum', () => {
    const inputEvents = {
      openDEXorderFilled: '1s b 999ms b 999ms a',
      createCentralizedExchangeOrder$: '5s (a|)',
      unsubscribe: '20s !',
    };
    const expected = '8s a 4999ms a 4999ms a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });
});
