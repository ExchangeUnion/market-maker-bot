import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { testConfig } from '../test-utils';
import { getOpenDEXswapSuccess$ } from './swap-success';

let testScheduler: TestScheduler;
const testSchedulerSetup = () => {
  testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

type AssertOpenDEXswapSuccess = {
  inputEvents: {
    xudClient$: string;
    subscribeXudSwaps$: string;
  };
  inputValues: {
    subscribeXudSwaps$: {
      a: SwapSuccess;
      b: SwapSuccess;
    };
  };
  expectedEvents: {
    receivedBaseAssetSwapSuccess$: string;
    receivedQuoteAssetSwapSuccess$: string;
    xudSwaps$subscriptions: string;
  };
  expectedValues: {
    receivedBaseAssetSwapSuccess$: {
      a: SwapSuccess;
    };
    receivedQuoteAssetSwapSuccess$: {
      a: SwapSuccess;
    };
  };
};

const config = testConfig();

const assertOpenDEXswapSuccess = ({
  inputEvents,
  inputValues,
  expectedEvents,
  expectedValues,
}: AssertOpenDEXswapSuccess) => {
  testScheduler.run(helpers => {
    const { cold, expectObservable, expectSubscriptions } = helpers;
    const getXudClient$ = () => {
      return (cold(inputEvents.xudClient$) as unknown) as Observable<XudClient>;
    };
    const xudSwapSuccess$ = cold(
      inputEvents.subscribeXudSwaps$,
      inputValues.subscribeXudSwaps$
    );
    const subscribeXudSwaps$ = () => {
      return (xudSwapSuccess$ as unknown) as Observable<SwapSuccess>;
    };
    const {
      receivedBaseAssetSwapSuccess$,
      receivedQuoteAssetSwapSuccess$,
    } = getOpenDEXswapSuccess$({
      config,
      getXudClient$,
      subscribeXudSwaps$,
    });
    expectObservable(receivedBaseAssetSwapSuccess$).toBe(
      expectedEvents.receivedBaseAssetSwapSuccess$,
      expectedValues.receivedBaseAssetSwapSuccess$
    );
    expectObservable(receivedQuoteAssetSwapSuccess$).toBe(
      expectedEvents.receivedQuoteAssetSwapSuccess$,
      expectedValues.receivedQuoteAssetSwapSuccess$
    );
    expectSubscriptions(xudSwapSuccess$.subscriptions).toBe(
      expectedEvents.xudSwaps$subscriptions
    );
  });
};

describe('getOpenDEXswapSuccess$', () => {
  beforeEach(testSchedulerSetup);

  it('emits on swap success', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s a 1s b',
    };
    const { BASEASSET, QUOTEASSET } = config;
    const swapSuccessA = ({
      getCurrencyReceived: () => BASEASSET,
    } as unknown) as SwapSuccess;
    const swapSuccessB = ({
      getCurrencyReceived: () => QUOTEASSET,
    } as unknown) as SwapSuccess;
    const inputValues = {
      subscribeXudSwaps$: {
        a: swapSuccessA,
        b: swapSuccessB,
      },
    };
    const expectedEvents = {
      receivedBaseAssetSwapSuccess$: '2s a',
      receivedQuoteAssetSwapSuccess$: '3001ms a',
      xudSwaps$subscriptions: '1s ^',
    };
    const expectedValues = {
      receivedBaseAssetSwapSuccess$: {
        a: swapSuccessA,
      },
      receivedQuoteAssetSwapSuccess$: {
        a: swapSuccessB,
      },
    };
    assertOpenDEXswapSuccess({
      inputEvents,
      inputValues,
      expectedEvents,
      expectedValues,
    });
  });

  /*
  it('errors when xudClient$ errors', () => {
    const inputEvents = {
      xudClient$: '1s #',
      subscribeXudSwaps$: '1s a',
    };
    const expectedEvents = '1s #';
    assertOpenDEXswapSuccess(inputEvents, expectedEvents);
  });

  it('errors when subscribeXudSwaps$ errors', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s #',
    };
    const expectedEvents = '2s #';
    assertOpenDEXswapSuccess(inputEvents, expectedEvents);
  });
  */
});
