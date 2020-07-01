import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../test-utils';
import { TradeInfo } from '../trade/info';
import { getOpenDEXcomplete$ } from './complete';
import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

describe('getOpenDEXcomplete$', () => {
  beforeEach(testSchedulerSetup);

  test('when trade info present it creates new OpenDEX orders', () => {
    testScheduler.run(helpers => {
      const { cold, hot, expectObservable } = helpers;
      const inputEvents = {
        tradeInfo$: 'a ^ 1000ms a 1500ms a 500ms b',
        getOpenDEXorders$: '1s a|',
      };
      const expected = '2s a 1500ms a';
      const createOpenDEXorders$ = () => {
        return cold(inputEvents.getOpenDEXorders$, {
          a: true,
        });
      };
      const getTradeInfo$ = () => {
        return hot(inputEvents.tradeInfo$) as Observable<TradeInfo>;
      };
      const centralizedExchangePrice$ = (cold('') as unknown) as Observable<
        BigNumber
      >;
      const exchange = (null as unknown) as Exchange;
      const trade$ = getOpenDEXcomplete$({
        exchange,
        config: testConfig(),
        loggers: getLoggers(),
        tradeInfo$: getTradeInfo$,
        createOpenDEXorders$,
        centralizedExchangePrice$,
      });
      expectObservable(trade$).toBe(expected, { a: true });
    });
  });
});
