import BigNumber from 'bignumber.js';
import { errors } from '../opendex/errors';

type MinimumCEXquantities = {
  [key: string]: BigNumber;
};

const MINIMUM_ORDER_SIZE: MinimumCEXquantities = {
  BTC: new BigNumber('0.001'),
  ETH: new BigNumber('0.05'),
  DAI: new BigNumber('15'),
  USDT: new BigNumber('15'),
};

const getMinimumOrderSize = (asset: string): BigNumber => {
  const minimumOrderSize = MINIMUM_ORDER_SIZE[asset];
  if (!minimumOrderSize) {
    throw errors.CEX_INVALID_MINIMUM_ORDER_QUANTITY(asset);
  }
  return minimumOrderSize;
};

const quantityAboveMinimum = (asset: string) => {
  return (quantity: BigNumber): boolean => {
    return quantity.isGreaterThanOrEqualTo(getMinimumOrderSize(asset));
  };
};

export { quantityAboveMinimum, MINIMUM_ORDER_SIZE };
