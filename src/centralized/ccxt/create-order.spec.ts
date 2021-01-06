import BigNumber from 'bignumber.js';
import { Exchange } from 'ccxt';
import { Config } from '../../config';
import { OrderSide } from '../../constants';
import { testConfig } from '../../test-utils';
import { createOrder$ } from './create-order';

describe('CCXT', () => {
  let orderQuantity: BigNumber;
  beforeEach(() => {
    orderQuantity = new BigNumber('0.01');
  });

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
        CEX_BASEASSET: 'ETH',
        CEX_QUOTEASSET: 'BTC',
        CEX: 'Binance',
      },
    };
    const expectedSymbol = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
    const sellOrder$ = createOrder$(
      config,
      exchange,
      OrderSide.SELL,
      orderQuantity
    );
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
        CEX_BASEASSET: 'BTC',
        CEX_QUOTEASSET: 'USDT',
        CEX: 'Binance',
      },
    };
    orderQuantity = new BigNumber('0.12345678');
    const expectedSymbol = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
    const buyOrder$ = createOrder$(
      config,
      exchange,
      OrderSide.BUY,
      orderQuantity
    );
    buyOrder$.subscribe({
      next: actualOrderResponse => {
        expect(actualOrderResponse).toEqual(orderResponse);
      },
      complete: () => {
        expect(createMarketOrder).toHaveBeenCalledTimes(1);
        expect(createMarketOrder).toHaveBeenCalledWith(
          expectedSymbol,
          OrderSide.BUY,
          0.1234,
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
        CEX_BASEASSET: 'BTC',
        CEX_QUOTEASSET: 'USDT',
        CEX: 'Kraken',
      },
    };
    const expectedSymbol = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
    const buyOrder$ = createOrder$(
      config,
      exchange,
      OrderSide.BUY,
      orderQuantity
    );
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
        CEX_BASEASSET: 'ETH',
        CEX_QUOTEASSET: 'BTC',
        CEX: 'Kraken',
      },
    };
    const expectedSymbol = `${config.CEX_BASEASSET}/${config.CEX_QUOTEASSET}`;
    const sellOrder$ = createOrder$(
      config,
      exchange,
      OrderSide.SELL,
      orderQuantity
    );
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
