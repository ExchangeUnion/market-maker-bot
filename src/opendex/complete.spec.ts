import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getArbyStore } from '../store';
import { getLoggers, testConfig } from '../test-utils';
import { TradeInfo } from '../trade/info';
import { getOpenDEXcomplete$ } from './complete';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

const assertGetOpenDEXcomplete = (
  inputEvents: {
    tradeInfo$: string;
    getOpenDEXorders$: string;
  },
  expected: string,
  inputValues: {
    tradeInfo$: any;
  }
) => {
  testScheduler.run(helpers => {
    const { cold, hot, expectObservable } = helpers;
    const createOpenDEXorders$ = () => {
      return cold(inputEvents.getOpenDEXorders$, {
        a: true,
      });
    };
    const getTradeInfo$ = () => {
      return hot(inputEvents.tradeInfo$, inputValues.tradeInfo$) as Observable<
        TradeInfo
      >;
    };
    const centralizedExchangePrice$ = (cold('') as unknown) as Observable<
      BigNumber
    >;
    const CEX = (null as unknown) as Exchange;
    const store = getArbyStore();
    const trade$ = getOpenDEXcomplete$({
      CEX,
      config: testConfig(),
      loggers: getLoggers(),
      tradeInfo$: getTradeInfo$,
      createOpenDEXorders$,
      centralizedExchangePrice$,
      store,
    });
    expectObservable(trade$).toBe(expected, { a: true });
  });
};

describe('getOpenDEXcomplete$', () => {
  beforeEach(testSchedulerSetup);

  test('when trade info present it creates new OpenDEX orders', () => {
    const inputEvents = {
      tradeInfo$: 'a ^ 1000ms a 1500ms b 500ms b',
      getOpenDEXorders$: '1s a|',
    };
    const expected = '2s a 1500ms a';
    const inputValues = {
      tradeInfo$: {
        a: {
          price: new BigNumber('10000'),
        },
        b: {
          price: new BigNumber('10010.1'),
        },
      },
    };
    assertGetOpenDEXcomplete(inputEvents, expected, inputValues);
  });
});
