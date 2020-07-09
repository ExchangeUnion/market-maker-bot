import { TestScheduler } from 'rxjs/testing';
import { executeCEXorder$ } from './execute-order';
import { getLoggers, testConfig } from '../test-utils';
import BigNumber from 'bignumber.js';
import { CEXorder } from './order-builder';
import { OrderSide } from '../constants';
import { Config } from '../config';
import { Observable } from 'rxjs';
import { Order, Exchange } from 'ccxt';

let testScheduler: TestScheduler;

const assertExecuteCEXorder = (
  inputEvents: {
    config: Config;
    price: BigNumber;
    order: CEXorder;
    createOrder$: string;
    unsubscribe?: string;
  },
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const createOrder$ = () => {
      return (cold(inputEvents.createOrder$) as unknown) as Observable<Order>;
    };
    const CEX = (null as unknown) as Exchange;
    const CEXorder$ = executeCEXorder$({
      CEX,
      config: inputEvents.config,
      logger: getLoggers().centralized,
      price: inputEvents.price,
      order: inputEvents.order,
      createOrder$,
    });
    expectObservable(CEXorder$, inputEvents.unsubscribe).toBe(expected, {
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
      createOrder$: '',
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

  it('executes real order in production mode', () => {
    const config = {
      ...testConfig(),
      LIVE_CEX: true,
    };
    const inputEvents = {
      createOrder$: '1s a',
      config,
      price: new BigNumber('123'),
      order: {
        quantity: new BigNumber('0.001'),
        side: OrderSide.BUY,
      },
    };
    const expected = '1s (a|)';
    assertExecuteCEXorder(inputEvents, expected);
  });

  it('retries to execute order upon failure', () => {
    const config = {
      ...testConfig(),
      LIVE_CEX: true,
    };
    const inputEvents = {
      createOrder$: '1s # 1s a',
      config,
      price: new BigNumber('123'),
      order: {
        quantity: new BigNumber('0.001'),
        side: OrderSide.BUY,
      },
      unsubscribe: '4s !',
    };
    const expected = '';
    assertExecuteCEXorder(inputEvents, expected);
  });
});
