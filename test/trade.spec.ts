import { TestScheduler } from 'rxjs/testing';
import { getNewTrade$ } from '../src/trade/manager';
import { testConfig, getLoggers } from './utils';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

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
      const getOpenDEXcomplete$ = () => {
        return cold(
          inputEvents.openDEXcomplete$,
          inputValues.openDEXcomplete$,
        );
      };
      const trade$ = getNewTrade$({
        shutdown$,
        loggers: getLoggers(),
        getOpenDEXcomplete$,
        config: testConfig(),
        centralizedExchangeOrder$: getCentralizedExchangeOrder$,
      });
      expectObservable(trade$).toBe(expected, { a: true });
    });
  });

});
