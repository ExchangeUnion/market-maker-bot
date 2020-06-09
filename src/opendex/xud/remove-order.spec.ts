import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { RemoveOrderRequest } from '../../broker/opendex/proto/xudrpc_pb';
import { removeXudOrder$ } from './remove-order';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

describe('removeXudOrder$', () => {
  test('success', done => {
    expect.assertions(3);
    const expectedResponse = 'expectedResponse';
    const client = ({
      removeOrder: (req: any, cb: any) => {
        cb(null, expectedResponse);
      },
    } as unknown) as XudClient;
    const orderId = '123';
    const removeOrder$ = removeXudOrder$({
      ...{ client },
      ...{ orderId },
    });
    removeOrder$.subscribe({
      next: actualResponse => {
        expect(actualResponse).toEqual(expectedResponse);
        expect(RemoveOrderRequest).toHaveBeenCalledTimes(1);
        expect(RemoveOrderRequest.prototype.setOrderId).toHaveBeenCalledWith(
          orderId
        );
      },
      complete: done,
    });
  });

  test('failure', done => {
    expect.assertions(1);
    const expectedError = 'expectedError';
    const client = ({
      removeOrder: (req: any, cb: any) => {
        cb(expectedError);
      },
    } as unknown) as XudClient;
    const orderId = '321';
    const removeOrder$ = removeXudOrder$({
      ...{ client },
      ...{ orderId },
    });
    removeOrder$.subscribe({
      error: error => {
        expect(error).toEqual(expectedError);
        done();
      },
    });
  });
});
