import { TestScheduler } from 'rxjs/testing';
import { getTradeInfo$ } from './info';
import { BigNumber } from 'bignumber.js';
import { testConfig } from '../../test/utils';

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
