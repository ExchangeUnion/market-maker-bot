import BigNumber from 'bignumber.js';
import { Config } from '../config';
import { CEXorder } from './order-builder';

const deriveCEXorderQuantity = (
  order: CEXorder,
  price: BigNumber,
  config: Config
): CEXorder => {
  if (config.CEX_BASEASSET === 'BTC') {
    return {
      ...order,
      quantity: new BigNumber(order.quantity.dividedBy(price).toFixed(8)),
    };
  } else {
    return order;
  }
};

export { deriveCEXorderQuantity };
