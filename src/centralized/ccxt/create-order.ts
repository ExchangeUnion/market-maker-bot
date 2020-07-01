import { Exchange, Order } from 'ccxt';
import { OrderSide } from '../../constants';
import BigNumber from 'bignumber.js';
import { Observable, from } from 'rxjs';

const createOrder$ = (
  exchange: Exchange,
  side: OrderSide,
  amount: BigNumber
): Observable<Order> => {
  return from(exchange.createMarketOrder('ABC', side, amount.toNumber()));
};

export { createOrder$ };
