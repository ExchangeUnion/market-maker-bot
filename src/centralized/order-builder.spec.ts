import BigNumber from 'bignumber.js';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Config } from '../config';
import { Asset, OrderSide } from '../constants';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { ArbyStore, getArbyStore } from '../store';
import { getLoggers, testConfig } from '../test-utils';
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
  config: Config,
  expectedAssetToTradeOnCEX: Asset,
  store?: ArbyStore
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
      store: store ? store : getArbyStore(),
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
    expect(quantityAboveMinimum).toHaveBeenCalledWith(
      expectedAssetToTradeOnCEX
    );
  });
};

describe('getCentralizedExchangeOrder$', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('accumulates buy and sell orders for ETHBTC', () => {
    expect.assertions(6);
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
    const BASEASSET: Asset = 'ETH';
    const QUOTEASSET: Asset = 'BTC';
    const config = {
      ...testConfig(),
      CEX_BASEASSET: BASEASSET,
      CEX_QUOTEASSET: QUOTEASSET,
      OPENDEX_BASEASSET: BASEASSET,
      OPENDEX_QUOTEASSET: QUOTEASSET,
    };
    const expectedAssetToTradeOnCEX = BASEASSET;
    const store = {
      ...getArbyStore(),
      ...{ resetLastOrderUpdatePrice: jest.fn() },
    };
    assertOrderBuilder(
      inputEvents,
      inputValues,
      expected,
      expectedValues,
      config,
      expectedAssetToTradeOnCEX,
      store
    );
    expect(store.resetLastOrderUpdatePrice).toHaveBeenCalledTimes(4);
  });

  it('accumulates buy and sell orders for BTCUSDT', () => {
    expect.assertions(6);
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
    const BASEASSET: Asset = 'BTC';
    const QUOTEASSET: Asset = 'USDT';
    const config = {
      ...testConfig(),
      CEX_BASEASSET: BASEASSET,
      CEX_QUOTEASSET: QUOTEASSET,
      OPENDEX_BASEASSET: BASEASSET,
      OPENDEX_QUOTEASSET: QUOTEASSET,
    };
    const expectedAssetToTradeOnCEX = QUOTEASSET;
    const store = {
      ...getArbyStore(),
      ...{ resetLastOrderUpdatePrice: jest.fn() },
    };
    assertOrderBuilder(
      inputEvents,
      inputValues,
      expected,
      expectedValues,
      config,
      expectedAssetToTradeOnCEX,
      store
    );
    expect(store.resetLastOrderUpdatePrice).toHaveBeenCalledTimes(4);
  });
});
