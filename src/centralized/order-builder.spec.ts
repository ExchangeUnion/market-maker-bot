import BigNumber from 'bignumber.js';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Config } from '../config';
import { OrderSide } from '../constants';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { testConfig } from '../test-utils';
import { CEXorder, getOrderBuilder$ } from './order-builder';

let testScheduler: TestScheduler;

const assertOrderBuilder = (
  inputEvents: {
    receivedBaseAssetSwapSuccess$: string;
    receivedQuoteAssetSwapSuccess$: string;
    unsubscribe?: string;
  },
  inputValues: {
    receivedBaseAssetSwapSuccess$: {
      a: BigNumber;
    };
    receivedQuoteAssetSwapSuccess$: {
      b: BigNumber;
    };
  },
  expected: string,
  expectedValues: {
    a: CEXorder;
  },
  config: Config
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const getOpenDEXswapSuccess$ = () => {
      return {
        receivedBaseAssetSwapSuccess$: (cold(
          inputEvents.receivedBaseAssetSwapSuccess$,
          inputValues.receivedBaseAssetSwapSuccess$
        ) as unknown) as Observable<SwapSuccess>,
        receivedQuoteAssetSwapSuccess$: (cold(
          inputEvents.receivedQuoteAssetSwapSuccess$,
          inputValues.receivedQuoteAssetSwapSuccess$
        ) as unknown) as Observable<SwapSuccess>,
      };
    };
    const accumulateOrderFillsForAssetReceived = jest
      .fn()
      .mockImplementation((v: any) => v);
    const filterMinimumQuantity = (qty: BigNumber) => of(qty);
    const orderBuilder$ = getOrderBuilder$(
      config,
      getOpenDEXswapSuccess$,
      accumulateOrderFillsForAssetReceived,
      accumulateOrderFillsForAssetReceived,
      filterMinimumQuantity
    );
    expectObservable(orderBuilder$, inputEvents.unsubscribe).toBe(
      expected,
      expectedValues
    );
    expect(accumulateOrderFillsForAssetReceived).toHaveBeenCalledTimes(2);
  });
};

describe('getCentralizedExchangeOrder$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('accumulates buy and sell orders for ETHBTC', () => {
    expect.assertions(2);
    const inputEvents = {
      receivedBaseAssetSwapSuccess$: '1s a',
      receivedQuoteAssetSwapSuccess$: '1400ms b',
      unsubscribe: '3s !',
    };
    const receivedBaseAssetQuantity = new BigNumber('40');
    const receivedQuoteAssetQuantity = new BigNumber('1');
    const inputValues = {
      receivedBaseAssetSwapSuccess$: {
        a: receivedBaseAssetQuantity,
      },
      receivedQuoteAssetSwapSuccess$: {
        b: receivedQuoteAssetQuantity,
      },
    };
    const expected = '1s a 399ms b 599ms a 799ms b';
    const expectedValues = {
      a: ({
        quantity: receivedBaseAssetQuantity,
        side: OrderSide.SELL,
      } as unknown) as CEXorder,
      b: ({
        quantity: receivedQuoteAssetQuantity,
        side: OrderSide.BUY,
      } as unknown) as CEXorder,
    };
    const BASEASSET = 'ETH';
    const QUOTEASSET = 'BTC';
    const config = {
      ...testConfig(),
      CEX_BASEASSET: BASEASSET,
      CEX_QUOTEASSET: QUOTEASSET,
      BASEASSET: BASEASSET,
      QUOTEASSET: QUOTEASSET,
    };
    assertOrderBuilder(
      inputEvents,
      inputValues,
      expected,
      expectedValues,
      config
    );
  });

  it('accumulates buy and sell orders for BTCUSDT', () => {
    expect.assertions(2);
    const inputEvents = {
      receivedBaseAssetSwapSuccess$: '1s a',
      receivedQuoteAssetSwapSuccess$: '1400ms b',
      unsubscribe: '3s !',
    };
    const receivedBaseAssetQuantity = new BigNumber('1');
    const receivedQuoteAssetQuantity = new BigNumber('10000');
    const inputValues = {
      receivedBaseAssetSwapSuccess$: {
        a: receivedBaseAssetQuantity,
      },
      receivedQuoteAssetSwapSuccess$: {
        b: receivedQuoteAssetQuantity,
      },
    };
    const expected = '1s a 399ms b 599ms a 799ms b';
    const expectedValues = {
      a: ({
        quantity: receivedBaseAssetQuantity,
        side: OrderSide.SELL,
      } as unknown) as CEXorder,
      b: ({
        quantity: receivedQuoteAssetQuantity,
        side: OrderSide.BUY,
      } as unknown) as CEXorder,
    };
    const BASEASSET = 'BTC';
    const QUOTEASSET = 'USDT';
    const config = {
      ...testConfig(),
      CEX_BASEASSET: BASEASSET,
      CEX_QUOTEASSET: QUOTEASSET,
      BASEASSET: BASEASSET,
      QUOTEASSET: QUOTEASSET,
    };
    assertOrderBuilder(
      inputEvents,
      inputValues,
      expected,
      expectedValues,
      config
    );
  });
});
