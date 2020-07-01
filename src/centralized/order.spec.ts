import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../test-utils';
import { getCentralizedExchangeOrder$ } from './order';
import { CEXorder } from './order-builder';
import BigNumber from 'bignumber.js';

let testScheduler: TestScheduler;

const assertCentralizedExchangeOrder = (
  inputEvents: {
    orderBuilder$: string;
    createCentralizedExchangeOrder$: string;
    centralizedExchangePrice$: string;
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
    const centralizedExchangePrice$ = (cold(
      inputEvents.centralizedExchangePrice$
    ) as unknown) as Observable<BigNumber>;
    const centralizedExchangeOrder$ = getCentralizedExchangeOrder$({
      logger: getLoggers().centralized,
      config,
      getOrderBuilder$,
      createCentralizedExchangeOrder$,
      centralizedExchangePrice$,
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

  it('executes queued up orders with latest price', () => {
    const inputEvents = {
      orderBuilder$: '1s a',
      centralizedExchangePrice$: '500ms a',
      createCentralizedExchangeOrder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });

  it('proceeds without knowing CEX price', () => {
    const inputEvents = {
      orderBuilder$: '1s a',
      centralizedExchangePrice$: '2s a',
      createCentralizedExchangeOrder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });
});
