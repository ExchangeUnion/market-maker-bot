import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import {
  GetBalanceResponse,
  TradingLimitsResponse,
} from '../broker/opendex/proto/xudrpc_pb';
import { getOpenDEXassets$ } from './assets';

type OpenDEXassetsInputEvents = {
  xudClient$: string;
  xudBalance$: string;
  xudTradingLimits$: string;
  unsubscribe: string;
};

let testScheduler: TestScheduler;

const assertOpenDEXassets = (
  inputEvents: OpenDEXassetsInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const parseOpenDEXassets = ({ balanceResponse }: any) => balanceResponse;
    const getXudBalance$ = () => {
      return (cold(inputEvents.xudBalance$) as unknown) as Observable<
        GetBalanceResponse
      >;
    };
    const getXudTradingLimits$ = () => {
      return (cold(inputEvents.xudTradingLimits$) as unknown) as Observable<
        TradingLimitsResponse
      >;
    };
    const getXudClient$ = () => {
      return (cold(inputEvents.xudClient$) as unknown) as Observable<XudClient>;
    };
    const logBalance = () => {};
    const openDEXassets$ = getOpenDEXassets$({
      logBalance,
      config: testConfig(),
      logger: getLoggers().global,
      xudClient$: getXudClient$,
      xudBalance$: getXudBalance$,
      xudTradingLimits$: getXudTradingLimits$,
      parseOpenDEXassets,
    });
    expectObservable(openDEXassets$, inputEvents.unsubscribe).toBe(expected);
  });
};

describe('getOpenDEXassets$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test('waits for balance and tradinglimits before emitting', () => {
    const inputEvents = {
      xudBalance$: '1s a',
      xudClient$: '1s a',
      xudTradingLimits$: '1s a',
      unsubscribe: '93s !',
    };
    const expected = '2s a 31999ms a 29999ms a';
    assertOpenDEXassets(inputEvents, expected);
  });
});
