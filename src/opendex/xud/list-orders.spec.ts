import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { ListOrdersRequest } from '../../broker/opendex/proto/xudrpc_pb';
import { listXudOrders$ } from './list-orders';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

describe('listXudOrders$', () => {
  test('success', done => {
    expect.assertions(3);
    const expectedResponse = 'expectedResponse';
    const client = ({
      listOrders: (req: any, cb: any) => {
        cb(null, expectedResponse);
      },
    } as unknown) as XudClient;
    const listOrders$ = listXudOrders$(client);
    listOrders$.subscribe(actualResponse => {
      expect(actualResponse.client).toEqual(expect.any(Object));
      expect(actualResponse.orders).toEqual(expectedResponse);
      expect(ListOrdersRequest).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('failure', done => {
    expect.assertions(1);
    const expectedError = 'expectedError';
    const client = ({
      listOrders: (req: any, cb: any) => {
        cb(expectedError);
      },
    } as unknown) as XudClient;
    const listOrders$ = listXudOrders$(client);
    listOrders$.subscribe({
      error: error => {
        expect(error).toEqual(expectedError);
        done();
      },
    });
  });
});
