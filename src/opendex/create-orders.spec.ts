import { TestScheduler } from 'rxjs/testing';
import { testConfig, getLoggers } from '../../test/utils';
import { createOpenDEXorders$, OpenDEXorders } from './create-orders';
import BigNumber from 'bignumber.js';
import { TradeInfo } from '../trade/info';
import { PlaceOrderResponse } from '../broker/opendex/proto/xudrpc_pb';
import { Observable } from 'rxjs';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type CreateOpenDEXordersInputEvents = {
  xudClient$: string;
  xudOrder$: string;
};

const assertCreateOpenDEXorders = (
  inputEvents: CreateOpenDEXordersInputEvents,
  expected: string
) => {
  testScheduler.run(helpers => {
    const { cold, hot, expectObservable } = helpers;
    const getTradeInfo = (): TradeInfo => {
      return ('mock trade info' as unknown) as TradeInfo;
    };
    const createXudOrder$ = () => {
      return cold(inputEvents.xudOrder$) as Observable<PlaceOrderResponse>;
    };
    const getXudClient$ = () => {
      return cold(inputEvents.xudClient$) as Observable<XudClient>;
    };
    const tradeInfoToOpenDEXorders = (v: any) => {
      return (v as unknown) as OpenDEXorders;
    };
    const createOrders$ = createOpenDEXorders$({
      getTradeInfo,
      getXudClient$,
      createXudOrder$,
      tradeInfoToOpenDEXorders,
      logger: getLoggers().global,
      config: testConfig(),
    });
    expectObservable(createOrders$).toBe(expected, {
      a: true,
    });
  });
};

describe('createOpenDEXorders$', () => {
  beforeEach(testSchedulerSetup);

  it('creates buy orders', () => {
    const inputEvents = {
      xudClient$: '1s a',
      xudOrder$: '1s a',
    };
    const expected = '2s (a|)';
    assertCreateOpenDEXorders(inputEvents, expected);
  });
});
