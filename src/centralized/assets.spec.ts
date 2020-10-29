import BigNumber from 'bignumber.js';
import { Balances, Exchange } from 'ccxt';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Config } from '../config';
import { getLoggers, testConfig } from '../test-utils';
import { ExchangeAssetAllocation } from '../trade/info';
import { getCentralizedExchangeAssets$ } from './assets';

let testScheduler: TestScheduler;

type AssertCEXassetsParams = {
  config: Config;
  inputEvents: {
    unsubscribe: string;
    CEXfetchBalance$: string;
  };
  expected: string;
  expectedValues?: {
    a: ExchangeAssetAllocation;
  };
};

const assertCEXassets = ({
  config,
  inputEvents,
  expected,
  expectedValues,
}: AssertCEXassetsParams) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const CEX = (null as unknown) as Exchange;
    const CEXfetchBalance$ = () => {
      return (cold(inputEvents.CEXfetchBalance$) as unknown) as Observable<
        Balances
      >;
    };
    const convertBalances = (_a: any, v: any) => v;
    const logAssetAllocation = (_a: any, v: any) => v;
    const CEXassets$ = getCentralizedExchangeAssets$({
      logger: getLoggers().centralized,
      config,
      CEX,
      CEXfetchBalance$,
      convertBalances,
      logAssetAllocation,
    });
    expectObservable(CEXassets$, inputEvents.unsubscribe).toBe(
      expected,
      expectedValues
    );
  });
};

describe('CEXassets$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('emits test config values every 30 seconds', () => {
    const config = testConfig();
    assertCEXassets({
      config,
      inputEvents: {
        CEXfetchBalance$: '',
        unsubscribe: '70s !',
      },
      expected: 'a 29999ms a 29999ms a',
      expectedValues: {
        a: {
          baseAssetBalance: new BigNumber(
            config.TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE
          ),
          quoteAssetBalance: new BigNumber(
            config.TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE
          ),
        },
      },
    });
  });

  it('fetches balances from CEX every 30 seconds', () => {
    const config = {
      ...testConfig(),
      TEST_MODE: false,
    };
    assertCEXassets({
      config,
      inputEvents: {
        CEXfetchBalance$: '1s a',
        unsubscribe: '70s !',
      },
      expected: '1s a 30999ms a 29999ms a',
    });
  });
});
