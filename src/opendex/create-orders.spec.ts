import { status } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { PlaceOrderResponse } from '../proto/xudrpc_pb';
import { getArbyStore, ArbyStore } from '../store';
import { getLoggers, testConfig, TestError } from '../test-utils';
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
  replaceXudOrder$: string;
};

const assertCreateOpenDEXorders = ({
  expected,
  inputEvents,
  inputErrors,
  store,
  shouldCreateOpenDEXorders,
}: {
  inputEvents: CreateOpenDEXordersInputEvents;
  expected: string;
  inputErrors?: {
    xudOrder$?: TestError;
    replaceXudOrder$?: TestError;
  };
  store?: ArbyStore;
  shouldCreateOpenDEXorders?: () => boolean;
}) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getTradeInfo = (): TradeInfo => {
      return ('mock trade info' as unknown) as TradeInfo;
    };
    const createXudOrder$ = (createOrderParams: any) => {
      if (createOrderParams.replaceOrderId) {
        return (cold(
          inputEvents.replaceXudOrder$,
          { a: 'order-response' },
          inputErrors?.replaceXudOrder$
        ) as unknown) as Observable<PlaceOrderResponse>;
      } else {
        return (cold(
          inputEvents.xudOrder$,
          { a: 'order-response' },
          inputErrors?.xudOrder$
        ) as unknown) as Observable<PlaceOrderResponse>;
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
      store: store ? store : getArbyStore(),
      shouldCreateOpenDEXorders: shouldCreateOpenDEXorders
        ? shouldCreateOpenDEXorders
        : () => true,
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
    const store = {
      ...getArbyStore(),
      ...{ updateLastOrderUpdatePrice: jest.fn() },
    };
    assertCreateOpenDEXorders({ inputEvents, expected, store });
    expect(store.updateLastOrderUpdatePrice).toHaveBeenCalledTimes(2);
  });

  it('filters by shouldCreateOpenDEXorders', () => {
    const inputEvents = {
      xudClient$: '1s a',
      replaceXudOrder$: '1s (a|)',
      xudOrder$: '',
    };
    // it returns true immediately without attempting to create orders
    const expected = '1s (a|)';
    const store = {
      ...getArbyStore(),
      ...{ updateLastOrderUpdatePrice: jest.fn() },
    };
    const selectStateSpy = jest.spyOn(store, 'selectState');
    const shouldCreateOpenDEXorders = () => false;
    assertCreateOpenDEXorders({
      inputEvents,
      expected,
      store,
      shouldCreateOpenDEXorders,
    });
    expect(store.updateLastOrderUpdatePrice).toHaveBeenCalledTimes(0);
    expect(selectStateSpy).toHaveBeenCalledTimes(1);
  });

  it('will not update lastOrderUpdatePrice when orders not created', () => {
    const inputEvents = {
      xudClient$: '1s a',
      replaceXudOrder$: '1s (b|)',
      xudOrder$: '',
    };
    const expected = '2s (a|)';
    const store = {
      ...getArbyStore(),
      ...{ updateLastOrderUpdatePrice: jest.fn() },
    };
    assertCreateOpenDEXorders({ inputEvents, expected, store });
    expect(store.updateLastOrderUpdatePrice).toHaveBeenCalledTimes(0);
  });

  it('throws if unknown error for replace order', () => {
    const inputEvents = {
      xudClient$: '1s a',
      replaceXudOrder$: '1s #',
      xudOrder$: '',
    };
    const expected = '2s #';
    const store = {
      ...getArbyStore(),
      ...{ updateLastOrderUpdatePrice: jest.fn() },
    };
    assertCreateOpenDEXorders({ inputEvents, expected, store });
    expect(store.updateLastOrderUpdatePrice).toHaveBeenCalledTimes(0);
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
    const store = {
      ...getArbyStore(),
      ...{ updateLastOrderUpdatePrice: jest.fn() },
    };
    assertCreateOpenDEXorders({ inputEvents, expected, inputErrors, store });
    expect(store.updateLastOrderUpdatePrice).toHaveBeenCalledTimes(2);
  });
});
