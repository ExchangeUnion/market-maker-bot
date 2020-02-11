import { OpenDexOrder } from '../src/broker/opendex/order';
import { OpenDexAPI } from '../src/broker/opendex/api';
import {
  OrderType,
  OrderSide,
  OrderStatus,
} from '../src/enums';
import {
  SwapSuccess,
} from '../src/broker/opendex/proto/xudrpc_pb';
import { Logger, Level } from '../src/logger';

jest.mock('../src/broker/opendex/api');

const mockedOpenDex = <jest.Mock<OpenDexAPI>><any>OpenDexAPI;
const loggers = Logger.createLoggers(Level.Warn);

describe('OpenDEX.Order', () => {
  let openDexAPI: any;
  let orderRequest: any;

  beforeEach(() => {
    openDexAPI = new mockedOpenDex();
    const orderId = '6gCrw2kRUAF9CvJDGP16IP';
    orderRequest = {
      orderId,
      baseAsset: 'ETH',
      quoteAsset: 'BTC',
      orderType: OrderType.Limit,
      orderSide: OrderSide.Buy,
      quantity: 10000,
      price: 5000,
      api: openDexAPI,
      logger: loggers.opendex,
    };
    openDexAPI.startOrder = jest
      .fn();
    openDexAPI.subscribeSwap = jest
      .fn();
  });

  test('it creates a market order', async () => {
    const marketOrderRequest = {
      ...orderRequest,
      orderType: OrderType.Market,
    };
    delete marketOrderRequest.price;
    const marketOrder = new OpenDexOrder(marketOrderRequest);
    const emitSpy = jest.spyOn(marketOrder, 'emit');
    await marketOrder.start();
    expect(openDexAPI.startOrder).toHaveBeenCalledTimes(1);
    expect(openDexAPI.startOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: expect.any(String),
        baseAsset: marketOrderRequest.baseAsset,
        quoteAsset: marketOrderRequest.quoteAsset,
        orderSide: marketOrderRequest.orderSide,
        orderType: marketOrderRequest.orderType,
        quantity: marketOrderRequest.quantity,
        price: 'mkt',
      }),
    );
    expect(openDexAPI.subscribeSwap).toHaveBeenCalledWith(
      orderRequest.orderId,
      expect.any(Function),
    );
    expect(marketOrder['status']).toEqual(OrderStatus.New);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('status', OrderStatus.New);
  });

  test('it creates a new order subscription', async () => {
    const order = new OpenDexOrder(orderRequest);
    const emitSpy = jest.spyOn(order, 'emit');
    await order.start();
    expect(openDexAPI.startOrder).toHaveBeenCalledTimes(1);
    expect(openDexAPI.startOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: expect.any(String),
        baseAsset: orderRequest.baseAsset,
        quoteAsset: orderRequest.quoteAsset,
        orderSide: orderRequest.orderSide,
        orderType: orderRequest.orderType,
        quantity: orderRequest.quantity,
        price: orderRequest.price,
      }),
    );
    expect(openDexAPI.subscribeSwap).toHaveBeenCalledWith(
      orderRequest.orderId,
      expect.any(Function),
    );
    expect(order['status']).toEqual(OrderStatus.New);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('status', OrderStatus.New);
  });

  test('it does not support StopLimit orders', async () => {
    expect.assertions(1);
    const order = new OpenDexOrder({
      ...orderRequest,
      orderType: OrderType.StopLimit,
      stopPrice: 4000,
    });
    try {
      await order.start();
    } catch (e) {
      expect(e).toMatchSnapshot();
    }
  });

  describe('onSwapComplete', () => {

    test('it emits success event', () => {
      const order = new OpenDexOrder(orderRequest);
      const emitSpy = jest.spyOn(order, 'emit');
      const swapSuccess = {
        orderId: '123abc',
      } as SwapSuccess.AsObject;
      order['onSwapComplete'](swapSuccess);
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy)
        .toHaveBeenCalledWith('complete', expect.any(String));
    });

  });

  describe('cancel', () => {

    test('it emits cancel event', async () => {
      openDexAPI.cancelOrder = jest
        .fn()
        .mockReturnValue(true);
      const order = new OpenDexOrder(orderRequest);
      const emitSpy = jest.spyOn(order, 'emit');
      await order.cancel();
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy)
        .toHaveBeenCalledWith('status', OrderStatus.Canceled);
    });

  });

  afterEach(() => {
    jest.resetAllMocks();
  });

});
