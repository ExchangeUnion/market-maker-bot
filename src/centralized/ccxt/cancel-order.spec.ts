import { cancelOrder$ } from './cancel-order';
import { Exchange } from 'ccxt';

describe('CCXT', () => {
  it('cancel order', done => {
    expect.assertions(2);
    const cancelOrderResponse = 'cancelResponse';
    const mockCancelOrder = jest.fn(() => Promise.resolve(cancelOrderResponse));
    const exchange = ({
      cancelOrder: mockCancelOrder,
    } as unknown) as Exchange;
    const orderId = '123';
    const orders$ = cancelOrder$(exchange, orderId);
    orders$.subscribe({
      next: actualResponse => {
        expect(actualResponse).toEqual(cancelOrderResponse);
        expect(mockCancelOrder).toHaveBeenCalledWith(orderId);
      },
      complete: done,
    });
  });
});
