import { Exchange, Order } from 'ccxt';
import { OrderSide } from '../../constants';
import BigNumber from 'bignumber.js';
import { Observable, from, defer } from 'rxjs';
import { Config } from '../../config';

type CreateOrderParams = {
  config: Config;
  exchange: Exchange;
  side: OrderSide;
  quantity: BigNumber;
};

const createOrder$ = ({
  config,
  exchange,
  side,
  quantity,
}: CreateOrderParams): Observable<Order> => {
  return defer(() => {
    const price = undefined;
    const params =
      config.CEX === 'Kraken' ? { trading_agreement: 'agree' } : undefined;
    return from(
      exchange.createMarketOrder(
        `${config.BASEASSET}/${config.QUOTEASSET}`,
        side,
        quantity.toNumber(),
        price,
        params
      )
    );
  });
};

export { createOrder$, CreateOrderParams };
