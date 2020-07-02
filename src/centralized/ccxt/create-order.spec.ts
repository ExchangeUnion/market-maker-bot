import { createOrder$ } from './create-order';
import { Exchange } from 'ccxt';
import { OrderSide } from '../../constants';
import BigNumber from 'bignumber.js';
import { testConfig } from '../../test-utils';
import { merge } from 'rxjs';

describe('CCXT', () => {
  it('creates market orders', done => {
    expect.assertions(5);
    const orderResponse = 'orderResponse';
    const createMarketOrder = jest.fn(() => Promise.resolve(orderResponse));
    const exchange = ({
      createMarketOrder,
    } as unknown) as Exchange;
    const config = testConfig();
    const orderQuantity = new BigNumber('0.01');
    const expectedSymbol = `${config.BASEASSET}/${config.QUOTEASSET}`;
    const buyOrder$ = createOrder$(
      config,
      exchange,
      OrderSide.BUY,
      orderQuantity
    );
    const sellOrder$ = createOrder$(
      config,
      exchange,
      OrderSide.SELL,
      orderQuantity
    );
    merge(buyOrder$, sellOrder$).subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: () => {
        expect(createMarketOrder).toHaveBeenCalledTimes(2);
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.BUY,
          orderQuantity.toNumber()
        );
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.SELL,
          orderQuantity.toNumber()
        );
        done();
      },
    });
  });
});
