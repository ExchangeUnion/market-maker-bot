import BigNumber from 'bignumber.js';
import { OrderSide, Asset } from '../constants';
import { deriveCEXorderQuantity } from './derive-order-quantity';
import { CEXorder } from './order-builder';
import { testConfig } from '../test-utils';

describe('deriveCEXorderQuantity', () => {
  it('derives quantity when base asset is profit asset (BTC)', () => {
    OrderSide;
    const order: CEXorder = {
      quantity: new BigNumber('10.94381840'),
      side: OrderSide.BUY,
    };
    const expectedOrder = {
      quantity: new BigNumber('0.00104227'),
      side: OrderSide.BUY,
    };
    const CEX_BASEASSET: Asset = 'BTC';
    const CEX_QUOTEASSET: Asset = 'USDT';
    const config = {
      ...testConfig(),
      CEX_BASEASSET,
      CEX_QUOTEASSET,
    };
    const price = new BigNumber('10500');
    expect(deriveCEXorderQuantity(order, price, config)).toEqual(expectedOrder);
  });

  it('returns order as is when base asset is not profit asset (BTC)', () => {
    OrderSide;
    const order: CEXorder = {
      quantity: new BigNumber('10.94381840'),
      side: OrderSide.BUY,
    };
    const CEX_BASEASSET: Asset = 'ETH';
    const CEX_QUOTEASSET: Asset = 'BTC';
    const config = {
      ...testConfig(),
      CEX_BASEASSET,
      CEX_QUOTEASSET,
    };
    const price = new BigNumber('0.03');
    expect(deriveCEXorderQuantity(order, price, config)).toEqual(order);
  });
});
