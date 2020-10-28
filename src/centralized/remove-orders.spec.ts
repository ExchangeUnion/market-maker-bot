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
    openOrderCount: number;
  },
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const exchange = (null as unknown) as Exchange;
    const openOrder = { id: 'a' };
    const createOpenOrders = (count: number) => {
      return {
        a: Array(count)
          .fill(0)
          .map(() => openOrder),
      };
    };
    const fetchOpenOrders$ = () => {
      return (cold(
        inputEvents.fetchOpenOrders$,
        createOpenOrders(inputEvents.openOrderCount)
      ) as unknown) as Observable<Order[]>;
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
    expectObservable(removeOrders$).toBe(expected, {
      a: Array(inputEvents.openOrderCount)
        .fill(0)
        .map(() => 'a'),
    });
  });
};

describe('removeCEXorders$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('executes a mock CEX order cancellation in test mode', () => {
    const config = testConfig();
    const inputEvents = {
      config,
      fetchOpenOrders$: '1s a',
      cancelOrder$: '1s a',
      openOrderCount: 1,
    };
    const expected = '1s (a|)';
    assertRemoveOrders(inputEvents, expected);
  });

  it('executes a real CEX order cancellation in live mode', () => {
    const config = {
      ...testConfig(),
      TEST_MODE: false,
    };
    const inputEvents = {
      config,
      fetchOpenOrders$: '1s (a|)',
      cancelOrder$: '1s (a|)',
      openOrderCount: 5,
    };
    const expected = '2s (a|)';
    assertRemoveOrders(inputEvents, expected);
  });

  it('does not cancel orders when no open orders exist', () => {
    const config = {
      ...testConfig(),
      TEST_MODE: false,
    };
    const inputEvents = {
      config,
      fetchOpenOrders$: '1s (a|)',
      cancelOrder$: '1s (a|)',
      openOrderCount: 0,
    };
    const expected = '1s |';
    assertRemoveOrders(inputEvents, expected);
  });
});
