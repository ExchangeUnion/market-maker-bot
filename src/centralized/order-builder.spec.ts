import { getOrderBuilder$, CEXorder } from './order-builder';
import { TestScheduler } from 'rxjs/testing';
import { testConfig, getLoggers } from '../test-utils';
import { Observable } from 'rxjs';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { OrderSide } from '../constants';
import BigNumber from 'bignumber.js';

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
  }
) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable } = helpers;
    const config = testConfig();
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
      .mockImplementation(() => {
        return (v: any) => v;
      });
    const quantityAboveMinimum = jest.fn().mockImplementation(() => {
      return () => true;
    });
    const orderBuilder$ = getOrderBuilder$({
      config,
      logger: getLoggers().centralized,
      getOpenDEXswapSuccess$,
      accumulateOrderFillsForBaseAssetReceived: accumulateOrderFillsForAssetReceived,
      accumulateOrderFillsForQuoteAssetReceived: accumulateOrderFillsForAssetReceived,
      quantityAboveMinimum,
    });
    expectObservable(orderBuilder$, inputEvents.unsubscribe).toBe(
      expected,
      expectedValues
    );
    expect(accumulateOrderFillsForAssetReceived).toHaveBeenCalledTimes(2);
    expect(accumulateOrderFillsForAssetReceived).toHaveBeenCalledWith(
      expect.objectContaining(config)
    );
    expect(quantityAboveMinimum).toHaveBeenCalledTimes(2);
    expect(quantityAboveMinimum).toHaveBeenCalledWith(config.BASEASSET);
  });
};

describe('getCentralizedExchangeOrder$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('accumulates buy and sell orders', () => {
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
    assertOrderBuilder(inputEvents, inputValues, expected, expectedValues);
  });
});
