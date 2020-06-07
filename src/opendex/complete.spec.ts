import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getOpenDEXcomplete$ } from './complete';
import { testConfig, getLoggers } from '../../test/utils';
import { TradeInfo } from '../trade/manager';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

describe('getOpenDEXcomplete$', () => {
  beforeEach(testSchedulerSetup);

  it('emits when OpenDEX order filled', () => {
    testScheduler.run(helpers => {
      const { cold, hot, expectObservable } = helpers;
      const inputEvents = {
        tradeInfo$: 'a ^ 1000ms a 1500ms a 500ms b',
        getOpenDEXorders$: '1s a|',
        openDEXorderFilled$: '10s a',
      };
      const expected = '2s a 2001ms a 5997ms |';
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
      const getTradeInfo$ = () => {
        return hot(inputEvents.tradeInfo$) as Observable<TradeInfo>;
      };
      const trade$ = getOpenDEXcomplete$({
        config: testConfig(),
        logger: getLoggers().opendex,
        tradeInfo$: getTradeInfo$,
        openDEXorders$: getOpenDEXorders$,
        openDEXorderFilled$: getOpenDEXorderFilled$,
      });
      expectObservable(trade$).toBe(expected, { a: true });
    });
  });
});
