import { status } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { PlaceOrderResponse } from '../proto/xudrpc_pb';
import { getLoggers, testConfig } from '../test-utils';
import { TradeInfo } from '../trade/info';
import { createOpenDEXorders$, OpenDEXorders } from './create-orders';
import { TestError } from '../test-utils';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type CreateOpenDEXordersInputEvents = {
  xudClient$: string;
  xudOrder$: string;
  replaceXudOrder$: string;
};

const assertCreateOpenDEXorders = (
  inputEvents: CreateOpenDEXordersInputEvents,
  expected: string,
  inputErrors?: {
    xudOrder$?: TestError;
    replaceXudOrder$?: TestError;
  }
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getTradeInfo = (): TradeInfo => {
      return ('mock trade info' as unknown) as TradeInfo;
    };
    const createXudOrder$ = (createOrderParams: any) => {
      if (createOrderParams.replaceOrderId) {
        return cold(
          inputEvents.replaceXudOrder$,
          {},
          inputErrors?.replaceXudOrder$
        ) as Observable<PlaceOrderResponse>;
      } else {
        return cold(
          inputEvents.xudOrder$,
          {},
          inputErrors?.xudOrder$
        ) as Observable<PlaceOrderResponse>;
      }
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
      replaceXudOrder$: '1s (a|)',
      xudOrder$: '',
    };
    const expected = '2s (a|)';
    assertCreateOpenDEXorders(inputEvents, expected);
  });

  it('throws if unknown error for repace order', () => {
    const inputEvents = {
      xudClient$: '1s a',
      replaceXudOrder$: '1s #',
      xudOrder$: '',
    };
    const expected = '2s #';
    assertCreateOpenDEXorders(inputEvents, expected);
  });

  it('retries without replaceOrderId if grpc.NOT_FOUND error', () => {
    const inputEvents = {
      xudClient$: '1s a',
      xudOrder$: '1s (a|)',
      replaceXudOrder$: '1s #',
    };
    const inputErrors = {
      replaceXudOrder$: {
        code: status.NOT_FOUND,
        message: 'NOT FOUND',
      },
    };
    const expected = '3s (a|)';
    assertCreateOpenDEXorders(inputEvents, expected, inputErrors);
  });
});
