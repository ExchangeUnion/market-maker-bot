import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';
import { Config } from '../../config';
import { OrderSide } from '../../constants';
import { testConfig } from '../../test-utils';
import { createOrder$ } from './create-order';

describe('CCXT', () => {
  const orderQuantity = new BigNumber('0.01');

  it('Binance ETHBTC sell order', done => {
    expect.assertions(3);
    const orderResponse = 'orderResponse';
    const createMarketOrder = jest.fn(() => Promise.resolve(orderResponse));
    const exchange = ({
      createMarketOrder,
    } as unknown) as Exchange;
    const config: Config = {
      ...testConfig(),
      ...{
        BASEASSET: 'ETH',
        QUOTEASSET: 'BTC',
        CEX: 'Binance',
      },
    };
    const expectedSymbol = `${config.BASEASSET}/${config.QUOTEASSET}`;
    const sellOrder$ = createOrder$({
      config,
      exchange,
      side: OrderSide.SELL,
      quantity: orderQuantity,
    });
    sellOrder$.subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: () => {
        expect(createMarketOrder).toHaveBeenCalledTimes(1);
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.SELL,
          orderQuantity.toNumber(),
          undefined,
          undefined
        );
        done();
      },
    });
  });

  it('Binance BTCUSDT buy order', done => {
    expect.assertions(3);
    const orderResponse = 'orderResponse';
    const createMarketOrder = jest.fn(() => Promise.resolve(orderResponse));
    const exchange = ({
      createMarketOrder,
    } as unknown) as Exchange;
    const config: Config = {
      ...testConfig(),
      ...{
        BASEASSET: 'BTC',
        QUOTEASSET: 'USDT',
        CEX: 'Binance',
      },
    };
    const expectedSymbol = `${config.BASEASSET}/${config.QUOTEASSET}`;
    const buyOrder$ = createOrder$({
      config,
      exchange,
      side: OrderSide.BUY,
      quantity: orderQuantity,
    });
    buyOrder$.subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: () => {
        expect(createMarketOrder).toHaveBeenCalledTimes(1);
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.BUY,
          orderQuantity.toNumber(),
          undefined,
          undefined
        );
        done();
      },
    });
  });

  it('Kraken BTCUSDT buy order', done => {
    expect.assertions(3);
    const orderResponse = 'orderResponse';
    const createMarketOrder = jest.fn(() => Promise.resolve(orderResponse));
    const exchange = ({
      createMarketOrder,
    } as unknown) as Exchange;
    const config: Config = {
      ...testConfig(),
      ...{
        BASEASSET: 'BTC',
        QUOTEASSET: 'USDT',
        CEX: 'Kraken',
      },
    };
    const expectedSymbol = `${config.BASEASSET}/${config.QUOTEASSET}`;
    const buyOrder$ = createOrder$({
      config,
      exchange,
      side: OrderSide.BUY,
      quantity: orderQuantity,
    });
    buyOrder$.subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: () => {
        expect(createMarketOrder).toHaveBeenCalledTimes(1);
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.BUY,
          orderQuantity.toNumber(),
          undefined,
          expect.objectContaining({
            trading_agreement: 'agree',
          })
        );
        done();
      },
    });
  });

  it('Kraken ETHBTC sell order', done => {
    expect.assertions(3);
    const orderResponse = 'orderResponse';
    const createMarketOrder = jest.fn(() => Promise.resolve(orderResponse));
    const exchange = ({
      createMarketOrder,
    } as unknown) as Exchange;
    const config: Config = {
      ...testConfig(),
      ...{
        BASEASSET: 'ETH',
        QUOTEASSET: 'BTC',
        CEX: 'Kraken',
      },
    };
    const expectedSymbol = `${config.BASEASSET}/${config.QUOTEASSET}`;
    const sellOrder$ = createOrder$({
      config,
      exchange,
      side: OrderSide.SELL,
      quantity: orderQuantity,
    });
    sellOrder$.subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: () => {
        expect(createMarketOrder).toHaveBeenCalledTimes(1);
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.SELL,
          orderQuantity.toNumber(),
          undefined,
          expect.objectContaining({
            trading_agreement: 'agree',
          })
        );
        done();
      },
    });
  });
});
