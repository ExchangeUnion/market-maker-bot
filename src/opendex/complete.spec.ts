import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getOpenDEXcomplete$ } from './complete';
import { testConfig, getLoggers } from '../../test/utils';
import { TradeInfo } from '../trade/manager';
import { SwapSuccess } from '../broker/opendex/proto/xudrpc_pb';

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
      const expected = '2s a 1500ms a 6498ms |';
      const createOpenDEXorders$ = () => {
        return cold(inputEvents.getOpenDEXorders$, {
          a: true,
        });
      };
      const getOpenDEXorderFilled$ = () => {
        return (cold(inputEvents.openDEXorderFilled$, {
          a: true,
        }) as unknown) as Observable<SwapSuccess>;
      };
      const getTradeInfo$ = () => {
        return hot(inputEvents.tradeInfo$) as Observable<TradeInfo>;
      };
      const trade$ = getOpenDEXcomplete$({
        config: testConfig(),
        loggers: getLoggers(),
        tradeInfo$: getTradeInfo$,
        createOpenDEXorders$,
        openDEXorderFilled$: getOpenDEXorderFilled$,
      });
      expectObservable(trade$).toBe(expected, { a: true });
    });
  });
});
