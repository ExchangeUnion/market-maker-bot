import { TestScheduler } from 'rxjs/testing';
import { Config } from '../config';
import { removeCEXorders$ } from './remove-orders';
import { getLoggers, testConfig } from '../test-utils';
import { Exchange, Order } from 'ccxt';
import { Observable } from 'rxjs';

let testScheduler: TestScheduler;

const assertRemoveOrders = (
  inputEvents: {
    config: Config;
    fetchOpenOrders$: string;
    cancelOrder$: string;
  },
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const exchange = (null as unknown) as Exchange;
    const fetchOpenOrders$ = () => {
      return (cold(inputEvents.fetchOpenOrders$) as unknown) as Observable<
        Order[]
      >;
    };
    const cancelOrder$ = () => {
      return (cold(inputEvents.cancelOrder$) as unknown) as Observable<Order>;
    };
    const removeOrders$ = removeCEXorders$(
      getLoggers().centralized,
      inputEvents.config,
      exchange,
      fetchOpenOrders$,
      cancelOrder$
    );
    expectObservable(removeOrders$).toBe(expected);
  });
};

describe('removeCEXorders$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('executes a mock CEX order in test mode', () => {
    const config = testConfig();
    const inputEvents = {
      config,
      fetchOpenOrders$: '1s a',
      cancelOrder$: '1s a',
    };
    const expected = '1s (a|)';
    assertRemoveOrders(inputEvents, expected);
  });
});
