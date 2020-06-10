import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest } from '../../broker/opendex/proto/xudrpc_pb';
import { subscribeXudSwaps$ } from './subscribe-swaps';
import { EventEmitter } from 'events';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

const CANCELLED_ERROR = {
  code: 1,
  message: 'Cancelled on client',
};

class MockSwapSubscription extends EventEmitter {
  cancel = () => {
    this.emit('error', CANCELLED_ERROR);
  };
}

describe('subscribeXudSwaps$', () => {
  let client: XudClient;
  let mockSwapSubscription: MockSwapSubscription;
  let onSwapSubscriptionSpy: any;
  let offSwapSubscriptionSpy: any;
  let cancelSwapSubscriptionSpy: any;

  beforeEach(() => {
    mockSwapSubscription = new MockSwapSubscription();
    cancelSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'cancel');
    client = ({
      subscribeSwaps: () => mockSwapSubscription,
    } as unknown) as XudClient;
    onSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'on');
    offSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'off');
  });

  test('success', done => {
    expect.assertions(8);
    const swapSuccess = 'swapSuccess';
    const swapsSubscription$ = subscribeXudSwaps$(client);
    swapsSubscription$.subscribe({
      next: actualSuccessValue => {
        expect(actualSuccessValue).toEqual(swapSuccess);
      },
      complete: done,
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
    mockSwapSubscription.emit('end');
    expect(offSwapSubscriptionSpy).toHaveBeenCalledTimes(3);
    expect(cancelSwapSubscriptionSpy).toHaveBeenCalledTimes(1);
  });

  test('failure', done => {
    expect.assertions(1);
    const swapError = 'swapError';
    const swapsSubscription$ = subscribeXudSwaps$(client);
    swapsSubscription$.subscribe({
      error: actualErrorValue => {
        expect(actualErrorValue).toEqual(swapError);
        done();
      },
    });
    mockSwapSubscription.emit('error', swapError);
  });

  test('does not emit error on cancel', done => {
    expect.assertions(1);
    const swapsSubscription$ = subscribeXudSwaps$(client);
    const swapSuccess = 'success';
    swapsSubscription$.subscribe({
      next: actualSwapSuccess => {
        expect(actualSwapSuccess).toEqual(swapSuccess);
        done();
      },
    });
    mockSwapSubscription.emit('error', CANCELLED_ERROR);
    mockSwapSubscription.emit('data', swapSuccess);
  });
});
