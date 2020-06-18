import { BigNumber } from 'bignumber.js';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../test-utils';
import {
  ExchangeAssetAllocation,
  getTradeInfo$,
  OpenDEXassetAllocation,
  TradeInfo,
  tradeInfoArrayToObject,
} from './info';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type TradeInfoInputEvents = {
  getOpenDEXassets$: string;
  getCentralizedExchangeAssets$: string;
  getCentralizedExchangePrice$: string;
};

type TradeInfoOutputValues = {
  [event: string]: string;
};

const assertTradeInfo = (
  inputEvents: TradeInfoInputEvents,
  expected: string,
  expectedValues: TradeInfoOutputValues
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getOpenDEXassets$ = () => {
      return cold(inputEvents.getOpenDEXassets$) as Observable<
        OpenDEXassetAllocation
      >;
    };
    const getCentralizedExchangeAssets$ = () => {
      return cold(inputEvents.getCentralizedExchangeAssets$) as Observable<
        ExchangeAssetAllocation
      >;
    };
    const getCentralizedExchangePrice$ = () => {
      return cold(inputEvents.getCentralizedExchangePrice$) as Observable<
        BigNumber
      >;
    };
    const tradeInfoArrayToObject = (v: any) => {
      return (v.join('') as unknown) as TradeInfo;
    };
    const tradeInfo$ = getTradeInfo$({
      config: testConfig(),
      loggers: getLoggers(),
      openDexAssets$: getOpenDEXassets$,
      centralizedExchangeAssets$: getCentralizedExchangeAssets$,
      centralizedExchangePrice$: getCentralizedExchangePrice$,
      tradeInfoArrayToObject,
    });
    expectObservable(tradeInfo$).toBe(expected, expectedValues);
  });
};

describe('tradeInfo$', () => {
  beforeEach(testSchedulerSetup);

  it('emits TradeInfo events', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a 1s b 1s c',
    };
    const expectedEvents = '7s a 1s b 1s c';
    const expectedValues = {
      a: 'aaa',
      b: 'aab',
      c: 'aac',
    };
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('ignores duplicate values', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a 1s a',
    };
    const expectedEvents = '7s a';
    const expectedValues = {
      a: 'aaa',
    };
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('does not emit anything without OpenDEX assets', () => {
    const inputEvents = {
      getOpenDEXassets$: '',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '';
    const expectedValues = {};
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('does not emit anything without centralized exchange price', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '',
    };
    const expectedEvents = '';
    const expectedValues = {};
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('does not emit anything without centralized exchange assets', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '';
    const expectedValues = {};
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('errors if OpenDEX assets error', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a 5s #',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '7s a 3s #';
    const expectedValues = {
      a: 'aaa',
    };
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('errors if centralized assets error', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a 4s #',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '7s a 3s #';
    const expectedValues = {
      a: 'aaa',
    };
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });

  it('errors if centralized exchange price errors', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a 3s #',
    };
    const expectedEvents = '7s a 3s #';
    const expectedValues = {
      a: 'aaa',
    };
    assertTradeInfo(inputEvents, expectedEvents, expectedValues);
  });
});

describe('tradeInfoArrayToObject', () => {
  it('converts trade info array to object', () => {
    const openDEXassets = {
      baseAssetBalance: new BigNumber('1.23'),
      baseAssetMaxInbound: new BigNumber('0.615'),
      baseAssetMaxOutbound: new BigNumber('0.615'),
      quoteAssetBalance: new BigNumber('3.33'),
      quoteAssetMaxInbound: new BigNumber('1.665'),
      quoteAssetMaxOutbound: new BigNumber('1.665'),
    };
    const centralizedExchangeAssets = {
      baseAssetBalance: new BigNumber('7.65'),
      quoteAssetBalance: new BigNumber('13.37'),
    };
    const centralizedExchangePrice = new BigNumber('10000');
    const tradeInfo = tradeInfoArrayToObject([
      openDEXassets,
      centralizedExchangeAssets,
      centralizedExchangePrice,
    ]);
    expect(tradeInfo.price).toEqual(centralizedExchangePrice);
    expect(tradeInfo.assets.openDEX).toEqual(openDEXassets);
    expect(tradeInfo.assets.centralizedExchange).toEqual(
      centralizedExchangeAssets
    );
  });
});
