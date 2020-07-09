import { cancelOrder$ } from './cancel-order';
import { Exchange } from 'ccxt';
import { testConfig } from '../../test-utils';

describe('CCXT', () => {
  it('cancel order', done => {
    expect.assertions(2);
    const cancelOrderResponse = 'cancelResponse';
    const mockCancelOrder = jest.fn(() => Promise.resolve(cancelOrderResponse));
    const exchange = ({
      cancelOrder: mockCancelOrder,
    } as unknown) as Exchange;
    const orderId = '123';
    const config = testConfig();
    const { BASEASSET, QUOTEASSET } = config;
    const tradingPair = `${BASEASSET}/${QUOTEASSET}`;
    const orders$ = cancelOrder$(exchange, config, orderId);
    orders$.subscribe({
      next: actualResponse => {
        expect(actualResponse).toEqual(cancelOrderResponse);
        expect(mockCancelOrder).toHaveBeenCalledWith(orderId, tradingPair);
      },
      complete: done,
    });
  });
});
