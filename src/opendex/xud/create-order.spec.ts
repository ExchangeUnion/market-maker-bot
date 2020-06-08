import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  PlaceOrderRequest,
  OrderSide,
} from '../../broker/opendex/proto/xudrpc_pb';
import { createXudOrder$ } from './create-order';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

const getTestXudOrderParams = () => {
  return {
    quantity: 123,
    orderSide: OrderSide.BUY,
    pairId: 'ETHBTC',
    price: 0.0234,
    orderId: '123',
  };
};

describe('createXudOrder$', () => {
  test('success', done => {
    expect.assertions(7);
    const expectedResponse = 'expectedResponse';
    const client = ({
      placeOrderSync: (req: any, cb: any) => {
        cb(null, expectedResponse);
      },
    } as unknown) as XudClient;
    const order = getTestXudOrderParams();
    const createOrder$ = createXudOrder$({
      ...{ client },
      ...order,
    });
    createOrder$.subscribe(actualResponse => {
      expect(actualResponse).toEqual(expectedResponse);
      expect(PlaceOrderRequest).toHaveBeenCalledTimes(1);
      expect(PlaceOrderRequest.prototype.setQuantity).toHaveBeenCalledWith(
        order.quantity
      );
      expect(PlaceOrderRequest.prototype.setSide).toHaveBeenCalledWith(
        order.orderSide
      );
      expect(PlaceOrderRequest.prototype.setPairId).toHaveBeenCalledWith(
        order.pairId
      );
      expect(PlaceOrderRequest.prototype.setPrice).toHaveBeenCalledWith(
        order.price
      );
      expect(PlaceOrderRequest.prototype.setOrderId).toHaveBeenCalledWith(
        order.orderId
      );
      done();
    });
  });

  test('failure', done => {
    expect.assertions(1);
    const expectedError = 'expectedError';
    const client = ({
      placeOrderSync: (req: any, cb: any) => {
        cb(expectedError);
      },
    } as unknown) as XudClient;
    const createOrder$ = createXudOrder$({
      ...{ client },
      ...getTestXudOrderParams(),
    });
    createOrder$.subscribe({
      error: error => {
        expect(error).toEqual(expectedError);
        done();
      },
    });
  });
});
