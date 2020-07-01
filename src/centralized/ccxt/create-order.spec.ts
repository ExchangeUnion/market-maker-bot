import { createOrder$ } from './create-order';
import { Exchange } from 'ccxt';
import { OrderSide } from '../../constants';
import BigNumber from 'bignumber.js';

describe('CCXT', () => {
  it('creates market order', done => {
    expect.assertions(1);
    const orderResponse = 'orderResponse';
    const exchange = ({
      createMarketOrder: () => Promise.resolve(orderResponse),
    } as unknown) as Exchange;
    const order$ = createOrder$(exchange, OrderSide.BUY, new BigNumber('0.01'));
    order$.subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: done,
    });
  });
});
