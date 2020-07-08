import { fetchOpenOrders$ } from './fetch-open-orders';
import { Exchange } from 'ccxt';

describe('CCXT', () => {
  it('fetch orders', done => {
    expect.assertions(1);
    const orders = 'fetchOrdersResponse';
    const exchange = ({
      fetchOpenOrders: () => Promise.resolve(orders),
    } as unknown) as Exchange;
    const orders$ = fetchOpenOrders$(exchange);
    orders$.subscribe({
      next: actualOrders => {
        expect(actualOrders).toEqual(orders);
      },
      complete: done,
    });
  });
});
