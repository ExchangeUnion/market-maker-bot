import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { SubscribeSwapsRequest } from '../../proto/xudrpc_pb';
import { subscribeXudSwaps$ } from './subscribe-swaps';
import { EventEmitter } from 'events';
import { grpcErrorCodes, errors } from '../errors';
import { testConfig } from '../../test-utils';
import { Config } from '../../config';
import { ParseGrpcErrorResponse } from './parse-error';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

const CANCELLED_ERROR = {
  code: grpcErrorCodes.CLIENT_CANCELED,
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
    const { BASEASSET, QUOTEASSET } = config;
    swapSuccess = { getPairId: () => `${BASEASSET}/${QUOTEASSET}` };
  });

  test('success', done => {
    expect.assertions(8);
    const parseGrpcError = () => null;
    const swapsSubscription$ = subscribeXudSwaps$({
      client,
      config,
      parseGrpcError,
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
    // cleanup function of subscribeXudSwaps$ uses
    // setImmediate to work around NodeJS core crashing
    // so we'll have to use setTimeout here
    setTimeout(() => {
      expect(offSwapSubscriptionSpy).toHaveBeenCalledTimes(3);
      expect(cancelSwapSubscriptionSpy).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('parseError returns null will not emit error', () => {
    expect.assertions(2);
    const swapError = 'swapError';
    const parseGrpcError = jest.fn().mockReturnValue(null);
    const swapsSubscription$ = subscribeXudSwaps$({
      client,
      config,
      parseGrpcError,
    });
    swapsSubscription$.subscribe(() => {});
    mockSwapSubscription.emit('error', swapError);
    expect(parseGrpcError).toHaveBeenCalledWith(swapError);
    expect(parseGrpcError).toHaveBeenCalledTimes(1);
  });

  test('will parse error and emit', done => {
    expect.assertions(3);
    const swapError = 'swapError';
    const parsedError = 'parsedError';
    const parseGrpcError = jest.fn().mockReturnValue(parsedError);
    const swapsSubscription$ = subscribeXudSwaps$({
      client,
      config,
      parseGrpcError,
    });
    swapsSubscription$.subscribe({
      error: actualError => {
        expect(actualError).toEqual(parsedError);
        done();
      },
    });
    mockSwapSubscription.emit('error', swapError);
    expect(parseGrpcError).toHaveBeenCalledWith(swapError);
    expect(parseGrpcError).toHaveBeenCalledTimes(1);
  });
});
