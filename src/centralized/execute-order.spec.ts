import { TestScheduler } from 'rxjs/testing';
import { executeCEXorder$ } from './execute-order';
import { getLoggers, testConfig } from '../test-utils';
import BigNumber from 'bignumber.js';
import { CEXorder } from './order-builder';
import { OrderSide } from '../constants';
import { Config } from '../config';

let testScheduler: TestScheduler;

const assertExecuteCEXorder = (
  inputEvents: {
    config: Config;
    price: BigNumber;
    order: CEXorder;
  },
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const CEXorder$ = executeCEXorder$({
      config: inputEvents.config,
      logger: getLoggers().centralized,
      price: inputEvents.price,
      order: inputEvents.order,
    });
    expectObservable(CEXorder$).toBe(expected, {
      a: null,
    });
  });
};

describe('executeCEXorder$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('executes a mock CEX order in test mode', () => {
    const inputEvents = {
      config: testConfig(),
      price: new BigNumber('123'),
      order: {
        quantity: new BigNumber('0.001'),
        side: OrderSide.BUY,
      },
    };
    const expected = '5s (a|)';
    assertExecuteCEXorder(inputEvents, expected);
  });
});
