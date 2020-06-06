import { TestScheduler } from 'rxjs/testing';
import { getTradeInfo$ } from './info';
import { BigNumber } from 'bignumber.js';
import { testConfig } from '../../test/utils';
import { ExchangeAssetAllocation, TradeInfo } from './info';
import { Observable } from 'rxjs';

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
      const expected = '7s a 1s a 1s a';
      const getOpenDEXassets$ = () => {
        return cold(inputEvents.getOpenDEXassets$) as Observable<ExchangeAssetAllocation>;
      };
      const getCentralizedExchangeAssets$ = () => {
        return cold(inputEvents.getCentralizedExchangeAssets$) as Observable<ExchangeAssetAllocation>;
      };
      const getCentralizedExchangePrice$ = () => {
        return cold(inputEvents.getCentralizedExchangePrice$) as Observable<BigNumber>;
      };
      const tradeInfoArrayToObject = (v: any) => v[0] as unknown as TradeInfo;
      const tradeInfo$ = getTradeInfo$({
        config: testConfig(),
        openDexAssets$: getOpenDEXassets$,
        centralizedExchangeAssets$: getCentralizedExchangeAssets$,
        centralizedExchangePrice$: getCentralizedExchangePrice$,
        tradeInfoArrayToObject,
      });
      expectObservable(tradeInfo$).toBe(expected);
    });
  });

});
