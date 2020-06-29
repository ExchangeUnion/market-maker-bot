import { getOrderBuilder$, CEXorder } from './order-builder';
import { TestScheduler } from 'rxjs/testing';
import { testConfig } from '../test-utils';
import { Observable } from 'rxjs';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { OrderSide } from '../constants';

let testScheduler: TestScheduler;

const assertOrderBuilder = (
  inputEvents: {
    receivedBaseAssetSwapSuccess$: string;
    receivedQuoteAssetSwapSuccess$: string;
    unsubscribe?: string;
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
          inputEvents.receivedBaseAssetSwapSuccess$
        ) as unknown) as Observable<SwapSuccess>,
        receivedQuoteAssetSwapSuccess$: (cold(
          inputEvents.receivedQuoteAssetSwapSuccess$
        ) as unknown) as Observable<SwapSuccess>,
      };
    };
    const accumulateOrderFillsForAsset = jest.fn().mockImplementation(() => {
      return (v: any) => v;
    });
    const shouldCreateCEXorder = jest.fn().mockImplementation(() => {
      return () => true;
    });
    const orderBuilder$ = getOrderBuilder$({
      config,
      getOpenDEXswapSuccess$,
      accumulateOrderFillsForAsset,
      shouldCreateCEXorder,
    });
    expectObservable(orderBuilder$, inputEvents.unsubscribe).toBe(
      expected,
      expectedValues
    );
    expect(accumulateOrderFillsForAsset).toHaveBeenCalledTimes(2);
    expect(accumulateOrderFillsForAsset).toHaveBeenCalledWith(
      config.QUOTEASSET
    );
    expect(accumulateOrderFillsForAsset).toHaveBeenCalledWith(config.BASEASSET);
    expect(shouldCreateCEXorder).toHaveBeenCalledTimes(2);
    expect(shouldCreateCEXorder).toHaveBeenCalledWith(config.BASEASSET);
    expect(shouldCreateCEXorder).toHaveBeenCalledWith(config.QUOTEASSET);
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
    const expected = '1s a 399ms b 599ms a 799ms b';
    const expectedValues = {
      a: ({
        quantity: 'a',
        side: OrderSide.BUY,
      } as unknown) as CEXorder,
      b: ({
        quantity: 'b',
        side: OrderSide.SELL,
      } as unknown) as CEXorder,
    };
    assertOrderBuilder(inputEvents, expected, expectedValues);
  });
});
