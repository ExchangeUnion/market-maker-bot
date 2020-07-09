import { fetchOpenOrders$ } from './fetch-open-orders';
import { Exchange } from 'ccxt';
import { testConfig } from '../../test-utils';

describe('CCXT', () => {
  it('fetch orders', done => {
    expect.assertions(3);
    const orders = 'fetchOrdersResponse';
    const fetchOpenOrdersMock = jest.fn(() => Promise.resolve(orders));
    const exchange = ({
      fetchOpenOrders: fetchOpenOrdersMock,
    } as unknown) as Exchange;
    const config = testConfig();
    const { BASEASSET, QUOTEASSET } = config;
    const tradingPair = `${BASEASSET}/${QUOTEASSET}`;
    const orders$ = fetchOpenOrders$(exchange, config);
    orders$.subscribe({
      next: actualOrders => {
        expect(actualOrders).toEqual(orders);
        expect(fetchOpenOrdersMock).toHaveBeenCalledWith(tradingPair);
        expect(fetchOpenOrdersMock).toHaveBeenCalledTimes(1);
      },
      complete: done,
    });
  });
});
