import BigNumber from 'bignumber.js';
import { Asset } from '../constants';

type MinimumCEXquantities = {
  BTC: BigNumber;
  ETH: BigNumber;
  DAI: BigNumber;
  USDT: BigNumber;
};

const MINIMUM_ORDER_SIZE: MinimumCEXquantities = {
  BTC: new BigNumber('0.001'),
  ETH: new BigNumber('0.05'),
  DAI: new BigNumber('15'),
  USDT: new BigNumber('15'),
};

const quantityAboveMinimum = (asset: Asset) => {
  return (quantity: BigNumber): boolean => {
    return quantity.isGreaterThanOrEqualTo(MINIMUM_ORDER_SIZE[asset]);
  };
};

export { quantityAboveMinimum, MINIMUM_ORDER_SIZE };
