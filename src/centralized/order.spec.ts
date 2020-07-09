import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../test-utils';
import { getCentralizedExchangeOrder$ } from './order';
import { CEXorder } from './order-builder';
import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';

let testScheduler: TestScheduler;

const assertCentralizedExchangeOrder = (
  inputEvents: {
    orderBuilder$: string;
    executeCEXorder$: string;
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
    const executeCEXorder$ = () => {
      return (cold(inputEvents.executeCEXorder$) as unknown) as Observable<
        null
      >;
    };
    const centralizedExchangePrice$ = (cold(
      inputEvents.centralizedExchangePrice$
    ) as unknown) as Observable<BigNumber>;
    const CEX = (null as unknown) as Exchange;
    const centralizedExchangeOrder$ = getCentralizedExchangeOrder$({
      CEX,
      logger: getLoggers().centralized,
      config,
      getOrderBuilder$,
      executeCEXorder$,
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
      executeCEXorder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });

  it('does not stop if latest price errors', () => {
    const inputEvents = {
      orderBuilder$: '1s a',
      centralizedExchangePrice$: '500ms #',
      executeCEXorder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });

  it('proceeds without knowing CEX price', () => {
    const inputEvents = {
      orderBuilder$: '1s a',
      centralizedExchangePrice$: '2s a',
      executeCEXorder$: '5s a',
      unsubscribe: '10s !',
    };
    const expected = '6s a';
    assertCentralizedExchangeOrder(inputEvents, expected);
  });
});
