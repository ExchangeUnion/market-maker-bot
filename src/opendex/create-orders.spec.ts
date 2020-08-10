import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { PlaceOrderResponse } from '../proto/xudrpc_pb';
import { getLoggers, testConfig } from '../test-utils';
import { TradeInfo } from '../trade/info';
import { createOpenDEXorders$, OpenDEXorders } from './create-orders';

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
    const { cold, expectObservable } = helpers;
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

  it('creates buy and sell orders', () => {
    const inputEvents = {
      xudClient$: '1s a',
      xudOrder$: '1s (a|)',
    };
    const expected = '2s (a|)';
    assertCreateOpenDEXorders(inputEvents, expected);
  });
});
