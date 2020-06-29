import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../test-utils';
import { getCentralizedExchangeOrder$ } from './order';
import { CEXorder } from './order-builder';

let testScheduler: TestScheduler;

const assertCentralizedExchangeOrder = (
  inputEvents: {
    orderBuilder$: string;
    createCentralizedExchangeOrder$: string;
    unsubscribe?: string;
  },
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const config = testConfig();
    const getOrderBuilder$ = () => {
      return (cold(inputEvents.orderBuilder$) as unknown) as Observable<
        CEXorder
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
      getOrderBuilder$,
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

  it('executes queued up orders', () => {
    const inputEvents = {
      orderBuilder$: '1s a',
      createCentralizedExchangeOrder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });
});
