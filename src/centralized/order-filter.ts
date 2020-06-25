import BigNumber from 'bignumber.js';

const shouldCreateCEXorder = (quantity: BigNumber): boolean => {
  const MINIMUM_CEX_QUANTITY = new BigNumber('123');
  return quantity.isGreaterThanOrEqualTo(MINIMUM_CEX_QUANTITY);
};

export { shouldCreateCEXorder };
