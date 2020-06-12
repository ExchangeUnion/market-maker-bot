import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest } from '../../proto/xudrpc_pb';
import { subscribeXudSwaps$ } from './subscribe-swaps';
import { EventEmitter } from 'events';
import { xudErrorCodes, errors } from '../errors';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

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
    // cleanup function of subscribeXudSwaps$ uses
    // setImmediate to work around NodeJS core crashing
    // so we'll have to use setTimeout here
    setTimeout(() => {
      expect(offSwapSubscriptionSpy).toHaveBeenCalledTimes(3);
      expect(cancelSwapSubscriptionSpy).toHaveBeenCalledTimes(1);
      done();
    });
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

  test('rethrows xudErrorCodes.UNAVAILABLE as errors.XUD_UNAVAILABLE', done => {
    expect.assertions(1);
    const swapError = {
      code: xudErrorCodes.UNAVAILABLE,
    };
    const swapsSubscription$ = subscribeXudSwaps$(client);
    swapsSubscription$.subscribe({
      error: actualErrorValue => {
        expect(actualErrorValue).toEqual(errors.XUD_UNAVAILABLE);
        done();
      },
    });
    mockSwapSubscription.emit('error', swapError);
  });

  test('rethrows xudErrorCodes.UNIMPLEMENTED as errors.XUD_LOCKED', done => {
    expect.assertions(1);
    const swapError = {
      code: xudErrorCodes.UNIMPLEMENTED,
    };
    const swapsSubscription$ = subscribeXudSwaps$(client);
    swapsSubscription$.subscribe({
      error: actualErrorValue => {
        expect(actualErrorValue).toEqual(errors.XUD_LOCKED);
        done();
      },
    });
    mockSwapSubscription.emit('error', swapError);
  });
});
