import { BinanceOrder } from '../src/broker/binance/order';
import { BinanceAPI } from '../src/broker/binance/api';
import {
  OrderType,
  OrderSide,
  OrderStatus,
} from '../src/enums';
import { Logger, Level } from '../src/logger';

jest.mock('../src/broker/binance/api');

const mockedBinance = <jest.Mock<BinanceAPI>><any>BinanceAPI;
const loggers = Logger.createLoggers(Level.Warn);

describe('Binance.Order', () => {
  let binanceAPI: any;
  let orderRequest: any;

  beforeEach(() => {
    binanceAPI = new mockedBinance();
    const orderId = '6gCrw2kRUAF9CvJDGP16IP';
    orderRequest = {
      orderId: 'abc123',
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderType: OrderType.StopLimit,
      orderSide: OrderSide.Buy,
      quantity: 10000,
      price: 5000,
      stopPrice: 5500,
      api: binanceAPI,
      logger: loggers.binance,
    };
    const tradingPair = `${orderRequest.baseAsset}${orderRequest.quoteAsset}`;
    binanceAPI.startOrder = jest
      .fn()
      .mockReturnValue(orderId);
    const queryOrderResponseNew = {
      tradingPair,
      status: OrderStatus.New,
    };
    const queryOrderResponseFilled = {
      tradingPair,
      status: OrderStatus.Filled,
    };
    binanceAPI.queryOrder = jest.fn()
      .mockReturnValue(queryOrderResponseFilled)
      .mockReturnValueOnce(queryOrderResponseNew)
      .mockReturnValueOnce(queryOrderResponseNew)
      .mockReturnValueOnce(queryOrderResponseNew);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('it creates the order and checks for status', async () => {
    jest.useFakeTimers();
    const order = new BinanceOrder(orderRequest);
    expect(order['baseAsset']).toEqual(orderRequest.baseAsset);
    expect(order['quoteAsset']).toEqual(orderRequest.quoteAsset);
    expect(order['orderType']).toEqual(orderRequest.orderType);
    expect(order['orderSide']).toEqual(orderRequest.orderSide);
    expect(order['quantity']).toEqual(orderRequest.quantity);
    expect(order['price']).toEqual(orderRequest.price);
    expect(order['stopPrice']).toEqual(orderRequest.stopPrice);
    await order.start();
    jest.advanceTimersByTime(1000);
    expect(binanceAPI.startOrder).toHaveBeenCalledTimes(1);
    expect(binanceAPI.startOrder).toHaveBeenCalledWith({
      orderId: orderRequest.orderId,
      baseAsset: orderRequest.baseAsset,
      quoteAsset: orderRequest.quoteAsset,
      orderSide: orderRequest.orderSide,
      orderType: orderRequest.orderType,
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      stopPrice: orderRequest.stopPrice,
    });
    expect(binanceAPI.queryOrder).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(binanceAPI.queryOrder).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1000);
    expect(binanceAPI.queryOrder).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(1000);
    jest.useRealTimers();
  });

  test('limit order does not include stopPrice', async () => {
    const limitOrderRequest = {
      ...orderRequest,
      orderType: OrderType.Limit,
    };
    delete limitOrderRequest.stopPrice;
    const order = new BinanceOrder(limitOrderRequest);
    await order.start();
    expect(binanceAPI.startOrder).toHaveBeenCalledWith({
      orderId: expect.any(String),
      baseAsset: limitOrderRequest.baseAsset,
      quoteAsset: limitOrderRequest.quoteAsset,
      orderSide: limitOrderRequest.orderSide,
      orderType: limitOrderRequest.orderType,
      quantity: limitOrderRequest.quantity,
      price: limitOrderRequest.price,
    });
  });

  test('checkOrder emits statuses and retries if necessary', async () => {
    const order = new BinanceOrder(orderRequest);
    const onStatus = jest.fn();
    const onComplete = jest.fn();
    order.on('status', onStatus);
    order.on('complete', onComplete);
    order['orderId'] = '123';
    order['checkOrderInterval'] = setInterval(() => {}, 1000);
    await order['checkOrder']();
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(order['status']).toEqual(OrderStatus.New);
    await order['checkOrder']();
    expect(onStatus).toHaveBeenCalledTimes(1);
    await order['checkOrder']();
    expect(onStatus).toHaveBeenCalledTimes(1);
    await order['checkOrder']();
    expect(onStatus).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(order['status']).toEqual(OrderStatus.Filled);
    await order['checkOrder']();
    expect(onStatus).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('it emits error when startOrder fails', async () => {
    const order = new BinanceOrder(orderRequest);
    binanceAPI.startOrder = jest
      .fn()
      .mockReturnValue(Promise.reject('failed'));
    const onFailure = jest.fn();
    order.on('failure', onFailure);
    await order.start();
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  test('it emits error when queryOrder fails', async () => {
    expect.assertions(2);
    const waitFor = (ms: number) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    };
    jest.useFakeTimers();
    const order = new BinanceOrder(orderRequest);
    binanceAPI.newOrder = jest
      .fn()
      .mockReturnValue(Promise.resolve('123'));
    const errorMsg = 'mock fail';
    binanceAPI.queryOrder = jest
      .fn()
      .mockReturnValue(Promise.reject(errorMsg));
    const onFailure = jest.fn();
    order.on('failure', onFailure);
    await order.start();
    waitFor(1000).then(() => {
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(errorMsg);
    });
    jest.advanceTimersByTime(1000);
  });

});
