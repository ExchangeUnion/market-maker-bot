import { TestScheduler } from 'rxjs/testing';
import {
  getTradeInfo$,
  tradeInfoArrayToObject,
  ExchangeAssetAllocation,
  TradeInfo,
} from './info';
import { BigNumber } from 'bignumber.js';
import { testConfig } from '../../test/utils';
import { Observable } from 'rxjs';

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

const assertTradeInfo = (
  inputEvents: TradeInfoInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getOpenDEXassets$ = () => {
      return cold(inputEvents.getOpenDEXassets$) as Observable<
        ExchangeAssetAllocation
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
    const tradeInfoArrayToObject = (v: any) => (v[0] as unknown) as TradeInfo;
    const tradeInfo$ = getTradeInfo$({
      config: testConfig(),
      openDexAssets$: getOpenDEXassets$,
      centralizedExchangeAssets$: getCentralizedExchangeAssets$,
      centralizedExchangePrice$: getCentralizedExchangePrice$,
      tradeInfoArrayToObject,
    });
    expectObservable(tradeInfo$).toBe(expected);
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
    const expectedEvents = '7s a 1s a 1s a';
    assertTradeInfo(inputEvents, expectedEvents);
  });

  it('does not emit anything without OpenDEX assets', () => {
    const inputEvents = {
      getOpenDEXassets$: '',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '';
    assertTradeInfo(inputEvents, expectedEvents);
  });

  it('does not emit anything without centralized exchange price', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '',
    };
    const expectedEvents = '';
    assertTradeInfo(inputEvents, expectedEvents);
  });

  it('does not emit anything without centralized exchange assets', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '';
    assertTradeInfo(inputEvents, expectedEvents);
  });

  it('errors if OpenDEX assets error', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a 5s #',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '7s a 3s #';
    assertTradeInfo(inputEvents, expectedEvents);
  });

  it('errors if centralized assets error', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a 4s #',
      getCentralizedExchangePrice$: '7s a',
    };
    const expectedEvents = '7s a 3s #';
    assertTradeInfo(inputEvents, expectedEvents);
  });

  it('errors if centralized exchange price errors', () => {
    const inputEvents = {
      getOpenDEXassets$: '5s a',
      getCentralizedExchangeAssets$: '6s a',
      getCentralizedExchangePrice$: '7s a 3s #',
    };
    const expectedEvents = '7s a 3s #';
    assertTradeInfo(inputEvents, expectedEvents);
  });
});

describe('tradeInfoArrayToObject', () => {
  it('converts trade info array to object', () => {
    const openDEXassets = {
      baseAssetBalance: new BigNumber('1.23'),
      quoteAssetBalance: new BigNumber('3.33'),
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
