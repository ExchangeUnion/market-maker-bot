import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getNewTrade$, getOpenDEXcomplete$, getTradeInfo$, TradeInfo } from '../src/trade/manager';
import { BigNumber } from 'bignumber.js';
import { testConfig } from './utils';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

describe('tradeInfo$', () => {

  beforeEach(testSchedulerSetup)

  it('emits TradeInfo events', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const inputEvents = {
        getOpenDEXassets$:             '5s a',
        getCentralizedExchangeAssets$: '6s a',
        getCentralizedExchangePrice$:  '7s a 1s b 1s c',
      };
      const expected = '7s a 1s b 1s c';
      const inputValues = {
        getCentralizedExchangePrice$: {
          a: new BigNumber('10000'),
          b: new BigNumber('11000'),
          c: new BigNumber('12000'),
        },
        getOpenDEXassets$: {
          a: {
            baseAssetBalance: new BigNumber('1.23'),
            quoteAssetBalance: new BigNumber('4.11'),
          },
        },
        getCentralizedExchangeAssets$: {
          a: {
            baseAssetBalance: new BigNumber('3.44'),
            quoteAssetBalance: new BigNumber('2.21'),
          }
        }
      };
      const getOpenDEXassets$ = () => {
        return cold(
          inputEvents.getOpenDEXassets$,
          inputValues.getOpenDEXassets$,
        );
      };
      const getCentralizedExchangeAssets$ = () => {
        return cold(
          inputEvents.getCentralizedExchangeAssets$,
          inputValues.getCentralizedExchangeAssets$,
        );
      };
      const getCentralizedExchangePrice$ = () => {
        return cold(inputEvents.getCentralizedExchangePrice$, {
          a: inputValues.getCentralizedExchangePrice$.a,
          b: inputValues.getCentralizedExchangePrice$.b,
          c: inputValues.getCentralizedExchangePrice$.c,
        });
      };
      const tradeInfo$ = getTradeInfo$({
        config: testConfig(),
        openDexAssets$: getOpenDEXassets$,
        centralizedExchangeAssets$: getCentralizedExchangeAssets$,
        centralizedExchangePrice$: getCentralizedExchangePrice$,
      });
      expectObservable(tradeInfo$).toBe(expected, {
        a: {
          price: inputValues.getCentralizedExchangePrice$.a,
          assets: {
            openDex: inputValues.getOpenDEXassets$.a,
            centralizedExchange: inputValues.getCentralizedExchangeAssets$.a,
          }
        },
        b: {
          price: inputValues.getCentralizedExchangePrice$.b,
          assets: {
            openDex: inputValues.getOpenDEXassets$.a,
            centralizedExchange: inputValues.getCentralizedExchangeAssets$.a,
          }
        },
        c: {
          price: inputValues.getCentralizedExchangePrice$.c,
          assets: {
            openDex: inputValues.getOpenDEXassets$.a,
            centralizedExchange: inputValues.getCentralizedExchangeAssets$.a,
          }
        }
      });
    });
  });

});

describe('getOpenDEXcomplete$', () => {

  beforeEach(testSchedulerSetup)

  it('emits when OpenDEX order filled', () => {
    testScheduler.run(helpers => {
      const { cold, hot, expectObservable } = helpers;
      const inputEvents = {
        tradeInfo$:                    'a ^ 1000ms a',
        getOpenDEXorders$:             '1s a|',
        openDEXorderFilled$:           '1s a',
      };
      const expected = '3s (a|)';
      const getOpenDEXorders$ = () => {
        return cold(inputEvents.getOpenDEXorders$, {
          a: true,
        });
      };
      const getOpenDEXorderFilled$ = () => {
        return cold(inputEvents.openDEXorderFilled$, {
          a: true,
        });
      };
      const tradeInfo$ = hot(inputEvents.tradeInfo$) as Observable<TradeInfo>;
      const trade$ = getOpenDEXcomplete$({
        config: testConfig(),
        tradeInfo$,
        openDEXorders$: getOpenDEXorders$,
        openDEXorderFilled$: getOpenDEXorderFilled$,
      });
      expectObservable(trade$).toBe(expected, { a: true });
    });
  });

});

describe('getTrade$', () => {

  beforeEach(testSchedulerSetup)

  it('emits when arbitrage trade complete', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;
      const inputEvents = {
        openDEXcomplete$:             '1s (a|)',
        getCentralizedExchangeOrder$: '1s (a|)',
        shutdown$:                    '5s a',
      };
      const expected = '2s a 1999ms a 999ms |';
      const inputValues = {
        getCentralizedExchangeOrder$: {
          a: true,
        },
        openDEXcomplete$: {
          a: true,
        }
      };
      const getCentralizedExchangeOrder$ = () => {
        return cold(
          inputEvents.getCentralizedExchangeOrder$,
          inputValues.getCentralizedExchangeOrder$,
        );
      };
      const shutdown$ = cold(inputEvents.shutdown$);
      const openDEXcomplete$ = cold(
        inputEvents.openDEXcomplete$,
        inputValues.openDEXcomplete$,
      );
      const trade$ = getNewTrade$({
        shutdown$,
        openDEXcomplete$,
        config: testConfig(),
        centralizedExchangeOrder$: getCentralizedExchangeOrder$,
      });
      expectObservable(trade$).toBe(expected, { a: true });
    });
  });

});
