import { Exchange, Order } from 'ccxt';
import { OrderSide } from '../../constants';
import BigNumber from 'bignumber.js';
import { Observable, from, defer } from 'rxjs';
import { Config } from '../../config';

const createOrder$ = (
  config: Config,
  exchange: Exchange,
  side: OrderSide,
  quantity: BigNumber
): Observable<Order> => {
  return defer(() => {
    const price = undefined;
    const params =
      config.CEX === 'Kraken' ? { trading_agreement: 'agree' } : undefined;
    return from(
      exchange.createMarketOrder(
        `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`,
        side,
        parseFloat(quantity.toFixed(4, BigNumber.ROUND_DOWN)),
        price,
        params
      )
    );
  });
};

type CreateOrderParams = Parameters<typeof createOrder$>;

export { createOrder$, CreateOrderParams };
