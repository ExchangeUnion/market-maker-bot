import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { OrderSide, PlaceOrderRequest } from '../../proto/xudrpc_pb';
import { createXudOrder$ } from './create-order';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    createOrder$.subscribe({
      next: actualResponse => {
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
      },
      complete: done,
    });
  });

  test('0 quantity will not place an order', done => {
    expect.assertions(2);
    const client = (null as unknown) as XudClient;
    const order = {
      ...getTestXudOrderParams(),
      quantity: 0,
    };
    const createOrder$ = createXudOrder$({
      ...{ client },
      ...order,
    });
    createOrder$.subscribe({
      next: actualResponse => {
        expect(actualResponse).toEqual(null);
        expect(PlaceOrderRequest).toHaveBeenCalledTimes(0);
      },
      complete: done,
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
