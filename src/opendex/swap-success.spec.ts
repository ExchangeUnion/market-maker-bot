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
    unsubscribe: string;
  };
  inputValues?: {
    subscribeXudSwaps$: {
      a: SwapSuccess;
      b: SwapSuccess;
    };
  };
  expectedEvents: {
    receivedBaseAssetSwapSuccess$: string;
    receivedQuoteAssetSwapSuccess$: string;
    xudSwaps$subscriptions: string | string[];
    xudClien$subscriptions: string | string[];
  };
  expectedValues?: {
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
    const xudClient$ = cold(inputEvents.xudClient$);
    const getXudClient$ = () => {
      return (xudClient$ as unknown) as Observable<XudClient>;
    };
    const xudSwapSuccess$ = cold(
      inputEvents.subscribeXudSwaps$,
      inputValues?.subscribeXudSwaps$
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
    expectObservable(
      receivedBaseAssetSwapSuccess$,
      inputEvents.unsubscribe
    ).toBe(
      expectedEvents.receivedBaseAssetSwapSuccess$,
      expectedValues?.receivedBaseAssetSwapSuccess$
    );
    expectObservable(
      receivedQuoteAssetSwapSuccess$,
      inputEvents.unsubscribe
    ).toBe(
      expectedEvents.receivedQuoteAssetSwapSuccess$,
      expectedValues?.receivedQuoteAssetSwapSuccess$
    );
    expectSubscriptions(xudSwapSuccess$.subscriptions).toBe(
      expectedEvents.xudSwaps$subscriptions
    );
    expectSubscriptions(xudClient$.subscriptions).toBe(
      expectedEvents.xudClien$subscriptions
    );
  });
};

describe('getOpenDEXswapSuccess$', () => {
  beforeEach(testSchedulerSetup);

  it('emits on swap success', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s a 1s b',
      unsubscribe: '4s !',
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
      xudSwaps$subscriptions: '1s ^ 2999ms !',
      xudClien$subscriptions: '^ 3999ms !',
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

  it('catches xudClient$ error silently and retries', () => {
    const inputEvents = {
      xudClient$: '1s #',
      subscribeXudSwaps$: '',
      unsubscribe: '10s !',
    };
    const expectedEvents = {
      receivedBaseAssetSwapSuccess$: '',
      receivedQuoteAssetSwapSuccess$: '',
      xudClien$subscriptions: ['^ 999ms !', '6s ^ 999ms !'],
      xudSwaps$subscriptions: [],
    };
    assertOpenDEXswapSuccess({
      inputEvents,
      expectedEvents,
    });
  });

  it('catches subscribeXudSwaps$ error silently and retries', () => {
    const inputEvents = {
      xudClient$: '1s a',
      subscribeXudSwaps$: '1s a',
      unsubscribe: '10s !',
    };
    const expectedEvents = {
      receivedBaseAssetSwapSuccess$: '',
      receivedQuoteAssetSwapSuccess$: '',
      xudClien$subscriptions: ['^ 1999ms !', '7s ^ 1999ms !'],
      xudSwaps$subscriptions: ['1s ^ 999ms !', '8s ^ 999ms !'],
    };
    assertOpenDEXswapSuccess({
      inputEvents,
      expectedEvents,
    });
  });
});
