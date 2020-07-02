import { Exchange, Order } from 'ccxt';
import { OrderSide } from '../../constants';
import BigNumber from 'bignumber.js';
import { Observable, from } from 'rxjs';
import { Config } from '../../config';

const createOrder$ = (
  config: Config,
  exchange: Exchange,
  side: OrderSide,
  quantity: BigNumber
): Observable<Order> => {
  return from(
    exchange.createMarketOrder(
      `${config.BASEASSET}/${config.QUOTEASSET}`,
      side,
      quantity.toNumber()
    )
  );
};

export { createOrder$ };
