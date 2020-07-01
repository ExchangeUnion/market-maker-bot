import { Dictionary, Exchange, Market } from 'ccxt';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { testConfig } from '../../test-utils';
import { initBinance$ } from './init';

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
    const centralizedExchangeOrder$ = initBinance$({
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
