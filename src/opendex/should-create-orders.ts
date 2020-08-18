import BigNumber from 'bignumber.js';

// decide whether to update orders based on
// last price update and new price
const shouldCreateOpenDEXorders = (
  newPrice: BigNumber,
  lastPriceUpdate: BigNumber
): boolean => {
  const priceDiff = lastPriceUpdate.minus(newPrice).absoluteValue();
  const maxPriceDiff = lastPriceUpdate.multipliedBy(new BigNumber('0.001'));
  if (priceDiff.isGreaterThanOrEqualTo(maxPriceDiff)) {
    return true;
  }
  return false;
};

export { shouldCreateOpenDEXorders };
