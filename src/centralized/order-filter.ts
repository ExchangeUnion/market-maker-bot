import BigNumber from 'bignumber.js';
import { Config } from '../config';
import { Asset } from '../constants';

type MinimumCEXquantities = {
  BTC: BigNumber;
  ETH: BigNumber;
  DAI: BigNumber;
  USDT: BigNumber;
};

const MINIMUM_ORDER_SIZE: MinimumCEXquantities = {
  BTC: new BigNumber('0.0001'),
  ETH: new BigNumber('0.005'),
  DAI: new BigNumber('10'),
  USDT: new BigNumber('10'),
};

const shouldCreateCEXorder = (config: Config) => {
  const assetToTradeOnCEX: Asset =
    config.QUOTEASSET === 'BTC' ? config.BASEASSET : config.QUOTEASSET;
  return (quantity: BigNumber): boolean => {
    return quantity.isGreaterThanOrEqualTo(
      MINIMUM_ORDER_SIZE[assetToTradeOnCEX]
    );
  };
};

export { shouldCreateCEXorder, MINIMUM_ORDER_SIZE };
