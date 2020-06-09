import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { PlaceOrderResponse } from '../broker/opendex/proto/xudrpc_pb';
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
  removeOpenDEXorders$: string;
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
    const removeOpenDEXorders$ = () => {
      return cold(inputEvents.removeOpenDEXorders$) as Observable<null>;
    };
    const tradeInfoToOpenDEXorders = (v: any) => {
      return (v as unknown) as OpenDEXorders;
    };
    const createOrders$ = createOpenDEXorders$({
      getTradeInfo,
      getXudClient$,
      createXudOrder$,
      tradeInfoToOpenDEXorders,
      removeOpenDEXorders$,
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
      removeOpenDEXorders$: '4s a',
      xudOrder$: '1s (a|)',
    };
    const expected = '6s (a|)';
    assertCreateOpenDEXorders(inputEvents, expected);
  });
});
