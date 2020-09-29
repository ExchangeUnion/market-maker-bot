import { status } from '@grpc/grpc-js';
import { EventEmitter } from 'events';
import { Config } from '../../config';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest } from '../../proto/xudrpc_pb';
import { testConfig } from '../../test-utils';
import { subscribeXudSwaps$ } from './subscribe-swaps';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

const CANCELLED_ERROR = {
  code: status.CANCELLED,
  message: 'Cancelled on client',
};

class MockSwapSubscription extends EventEmitter {
  cancel = () => {
    this.emit('error', CANCELLED_ERROR);
  };
}

describe('subscribeXudSwaps$', () => {
  let client: XudClient;
  let config: Config;
  let swapSuccess: any;
  let mockSwapSubscription: MockSwapSubscription;
  let onSwapSubscriptionSpy: any;
  let offSwapSubscriptionSpy: any;
  let cancelSwapSubscriptionSpy: any;

  beforeEach(() => {
    config = testConfig();
    mockSwapSubscription = new MockSwapSubscription();
    cancelSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'cancel');
    client = ({
      subscribeSwaps: () => mockSwapSubscription,
    } as unknown) as XudClient;
    onSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'on');
    offSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'off');
    const { OPENDEX_BASEASSET, OPENDEX_QUOTEASSET } = config;
    swapSuccess = {
      getPairId: () => `${OPENDEX_BASEASSET}/${OPENDEX_QUOTEASSET}`,
    };
  });

  test('success', done => {
    expect.assertions(8);
    const swapsSubscription$ = subscribeXudSwaps$({
      client,
      config,
    });
    swapsSubscription$.subscribe({
      next: actualSuccessValue => {
        expect(actualSuccessValue).toEqual(swapSuccess);
      },
    });
    expect(SubscribeSwapsRequest).toHaveBeenCalledTimes(1);
    expect(
      SubscribeSwapsRequest.prototype.setIncludeTaker
    ).toHaveBeenCalledTimes(1);
    expect(
      SubscribeSwapsRequest.prototype.setIncludeTaker
    ).toHaveBeenCalledWith(true);
    expect(onSwapSubscriptionSpy).toHaveBeenCalledTimes(3);
    expect(onSwapSubscriptionSpy).toHaveBeenCalledWith(
      'data',
      expect.any(Function)
    );
    mockSwapSubscription.emit('data', swapSuccess);
    const swapSuccessOtherTradingPair = {
      getPairId: () => 'TOK/BTC',
    };
    mockSwapSubscription.emit('data', swapSuccessOtherTradingPair);
    mockSwapSubscription.emit('end');
    expect(offSwapSubscriptionSpy).toHaveBeenCalledTimes(3);
    expect(cancelSwapSubscriptionSpy).toHaveBeenCalledTimes(1);
    done();
  });

  test('will emit error', done => {
    expect.assertions(1);
    const swapError = 'swapError HELLO';
    const swapsSubscription$ = subscribeXudSwaps$({
      client,
      config,
    });
    swapsSubscription$.subscribe({
      error: actualError => {
        expect(actualError).toEqual(swapError);
        done();
      },
    });
    mockSwapSubscription.emit('error', swapError);
  });
});
