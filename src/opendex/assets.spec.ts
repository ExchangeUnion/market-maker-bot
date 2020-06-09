import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { getOpenDEXassets$ } from './assets';

type OpenDEXassetsInputEvents = {
  xudClient$: string;
  xudBalance$: string;
};

let testScheduler: TestScheduler;

const assertOpenDEXassets = (
  inputEvents: OpenDEXassetsInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const xudBalanceToExchangeAssetAllocation = ({ balanceResponse }: any) =>
      balanceResponse;
    const getXudBalance$ = () => {
      return (cold(inputEvents.xudBalance$) as unknown) as Observable<
        GetBalanceResponse
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
      xudBalanceToExchangeAssetAllocation,
    });
    expectObservable(openDEXassets$).toBe(expected);
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
      xudBalance$: '500ms a',
      xudClient$: '500ms a',
    };
    const expected = '1s a';
    assertOpenDEXassets(inputEvents, expected);
  });
});
