import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest } from '../../broker/opendex/proto/xudrpc_pb';
import { subscribeXudSwaps$ } from './subscribe-swaps';
import { EventEmitter } from 'events';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

class MockSwapSubscription extends EventEmitter {}

describe('subscribeXudSwaps$', () => {
  let client: XudClient;
  let mockSwapSubscription: MockSwapSubscription;
  let onSwapSubscriptionSpy: any;

  beforeEach(() => {
    mockSwapSubscription = new MockSwapSubscription();
    client = ({
      subscribeSwaps: () => mockSwapSubscription,
    } as unknown) as XudClient;
    onSwapSubscriptionSpy = jest.spyOn(mockSwapSubscription, 'on');
  });

  test('success', done => {
    expect.assertions(6);
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
});
