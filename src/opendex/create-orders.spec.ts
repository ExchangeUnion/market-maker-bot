import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getLoggers, testConfig } from '../../test/utils';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import {
  ListOrdersResponse,
  PlaceOrderResponse,
  RemoveOrderResponse,
} from '../broker/opendex/proto/xudrpc_pb';
import { TradeInfo } from '../trade/info';
import { createOpenDEXorders$, OpenDEXorders } from './create-orders';
import { ListXudOrdersResponse } from './xud/list-orders';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type CreateOpenDEXordersInputEvents = {
  xudClient$: string;
  xudOrder$: string;
  listXudOrders$: string;
  removeXudOrder$: string;
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
    const removeXudOrder$ = () => {
      return cold(inputEvents.removeXudOrder$) as Observable<
        RemoveOrderResponse
      >;
    };
    const listXudOrders$ = () => {
      return cold(inputEvents.listXudOrders$) as Observable<
        ListXudOrdersResponse
      >;
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
      removeXudOrder$,
      listXudOrders$,
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
      listXudOrders$: '1s a',
      removeXudOrder$: '1s a',
      xudOrder$: '1s a',
    };
    const expected = '4s (a|)';
    assertCreateOpenDEXorders(inputEvents, expected);
  });
});
