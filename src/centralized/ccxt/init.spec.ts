import { Dictionary, Exchange, Market } from 'ccxt';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { testConfig } from '../../test-utils';
import { initCEX$ } from './init';

let testScheduler: TestScheduler;

const assertInitBinance = (
  inputEvents: {
    loadMarkets$: string;
  },
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const loadMarkets$ = () => {
      return (cold(inputEvents.loadMarkets$) as unknown) as Observable<
        Dictionary<Market>
      >;
    };
    const config = testConfig();
    const getExchange = () => ('a' as unknown) as Exchange;
    const centralizedExchangeOrder$ = initCEX$({
      config,
      loadMarkets$,
      getExchange,
    });
    expectObservable(centralizedExchangeOrder$).toBe(expected);
  });
};

describe('CCXT', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads markets after init', () => {
    const inputEvents = {
      loadMarkets$: '1s a',
    };
    const expected = '1s a';
    assertInitBinance(inputEvents, expected);
  });
});

it('initializes once and loads markets', done => {
  expect.assertions(2);
  const loadMarkets$ = jest.fn(() => {
    return (of('markets') as unknown) as Observable<Dictionary<Market>>;
  });
  const getExchange = jest.fn(() => {
    return (null as unknown) as Exchange;
  });
  const CEX = initCEX$({
    loadMarkets$,
    config: testConfig(),
    getExchange,
  });
  // first subscription
  CEX.subscribe(undefined);
  setTimeout(() => {
    CEX.subscribe({
      complete: () => {
        // future subscriptions will get cached value
        expect(getExchange).toHaveBeenCalledTimes(1);
        expect(loadMarkets$).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });
});
