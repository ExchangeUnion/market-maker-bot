import { OpenDexAPI } from '../src/broker/opendex/api';
import { OpenDexOrder } from '../src/broker/opendex/order';
import { Level, Logger } from '../src/logger';
import { XudGrpcClient } from '../src/broker/opendex/xud-client';
import {
  getBalanceResponse,
  tradingLimitsResponse,
} from '../mock-data/xud-grpc-responses';
import {
  OrderType,
  OrderSide,
} from '../src/enums';
import {
  OrderSide as XudOrderSide,
  SwapSuccess,
} from '../src/broker/opendex/proto/xudrpc_pb';

jest.mock('../src/broker/opendex/xud-client');
const mockedXudGrpcClient = <jest.Mock<XudGrpcClient>><any>XudGrpcClient;
const loggers = Logger.createLoggers(Level.Warn);

describe('OpenDexAPI', () => {
  let openDexAPI: OpenDexAPI;
  let onSwapsSubscription: any;
  let onCancelSubscribeSwaps: any;

  beforeEach(async () => {
    mockedXudGrpcClient.prototype.start = jest.fn();
    onSwapsSubscription = jest.fn();
    onCancelSubscribeSwaps = jest.fn();
    mockedXudGrpcClient.prototype.subscribeSwaps = jest.fn()
      .mockImplementation(() => {
        return Promise.resolve({
          cancel: onCancelSubscribeSwaps,
          on: onSwapsSubscription,
        });
      });
    openDexAPI = new OpenDexAPI({
      logger: loggers.opendex,
      certPath: '/path/to/cert',
      rpchost: 'localhost',
      rpcport: 8886,
    });
    openDexAPI['waitForConnection'] = jest.fn()
      .mockReturnValue(Promise.resolve());
    await openDexAPI.start();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('start and stop', async () => {
    expect(mockedXudGrpcClient).toHaveBeenCalledTimes(1);
    expect(mockedXudGrpcClient.prototype.start).toHaveBeenCalledTimes(1);
    expect(mockedXudGrpcClient.prototype.subscribeSwaps).toHaveBeenCalledTimes(1);
    expect(openDexAPI['xudClient']).toBeTruthy();
    expect(openDexAPI['swapsCompleteSubscription']).toBeTruthy();
    expect(onSwapsSubscription).toHaveBeenCalledTimes(3);
    expect(onSwapsSubscription).toHaveBeenCalledWith('data', expect.any(Function));
    expect(onSwapsSubscription).toHaveBeenCalledWith('error', expect.any(Function));
    expect(onSwapsSubscription).toHaveBeenCalledWith('end', expect.any(Function));
    openDexAPI.stop();
    expect(onCancelSubscribeSwaps).toHaveBeenCalledTimes(1);
  });

  test('getAssets', async () => {
    mockedXudGrpcClient.prototype.getBalance = jest.fn()
      .mockReturnValue(getBalanceResponse);
    mockedXudGrpcClient.prototype.tradingLimits = jest.fn()
      .mockReturnValue(tradingLimitsResponse);
    const ownedAssets = await openDexAPI.getAssets();
    expect(ownedAssets).toMatchSnapshot();
  });

  describe('subscribeSwap', () => {

    test('onSwapComplete does trigger the callbacks', () => {
      const cb = jest.fn();
      const cb2 = jest.fn();
      const id = '123abc';
      const id2 = '321abc';
      openDexAPI.subscribeSwap(id, cb);
      openDexAPI.subscribeSwap(id2, cb2);
      expect(openDexAPI['swapSubscriptions'].has(id)).toBeTruthy();
      const mockSwapSuccess = {
        toObject: () => {
          return {
            localId: id,
          };
        },
      };
      openDexAPI['onSwapComplete'](mockSwapSuccess as SwapSuccess);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(0);
      const mockSwapSuccess2 = {
        toObject: () => {
          return {
            localId: id2,
          };
        },
      };
      jest.resetAllMocks();
      openDexAPI['onSwapComplete'](mockSwapSuccess2 as SwapSuccess);
      expect(cb).toHaveBeenCalledTimes(0);
      expect(cb2).toHaveBeenCalledTimes(1);
    });

  });

  describe('cancel', () => {

    test('returns true when request succeeds', async () => {
      mockedXudGrpcClient.prototype.removeOrder = jest.fn()
        .mockReturnValue(Promise.resolve(true));
      await expect(
        openDexAPI.cancelOrder(
          {
            tradingPair: 'BTC/DAI',
            orderId: '123',
          },
        )).resolves.toBeTruthy();
    });

    test('returns false when request fails', async () => {
      mockedXudGrpcClient.prototype.removeOrder = jest.fn()
        .mockReturnValue(Promise.reject(false));
      await expect(
        openDexAPI.cancelOrder(
          {
            tradingPair: 'BTC/DAI',
            orderId: '123',
          },
        )).resolves.toBeFalsy();
    });

  });

  describe('newOrder', () => {

    test('limit order succeeds', async () => {
      mockedXudGrpcClient.prototype.newOrder =
        jest.fn();
      const orderRequest = {
        orderId: '123',
        baseAsset: 'LTC',
        quoteAsset: 'BTC',
        orderType: OrderType.Limit,
        orderSide: OrderSide.Buy,
        quantity: 0.005,
        price: 0.021185,
      };
      const order = openDexAPI.newOrder(orderRequest);
      expect(order instanceof OpenDexOrder).toBeTruthy();
      await order.start();
      expect(mockedXudGrpcClient.prototype.newOrder)
        .toHaveBeenCalledTimes(1);
      expect(mockedXudGrpcClient.prototype.newOrder)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: expect.any(String),
            orderSide: XudOrderSide.BUY,
            pairId: `${orderRequest.baseAsset}/${orderRequest.quoteAsset}`,
            price: orderRequest.price,
            quantity: orderRequest.quantity * 10 ** 8,
          }),
        );
    });

    test('market order succeeds', async () => {
      mockedXudGrpcClient.prototype.newOrder =
        jest.fn();
      const orderRequest = {
        orderId: '123',
        baseAsset: 'LTC',
        quoteAsset: 'BTC',
        orderType: OrderType.Market,
        orderSide: OrderSide.Sell,
        quantity: 0.005,
        price: 'mkt',
      };
      const order = openDexAPI.newOrder(orderRequest);
      expect(order instanceof OpenDexOrder).toBeTruthy();
      await order.start();
      expect(mockedXudGrpcClient.prototype.newOrder)
        .toHaveBeenCalledTimes(1);
      expect(mockedXudGrpcClient.prototype.newOrder)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: expect.any(String),
            orderSide: XudOrderSide.SELL,
            pairId: `${orderRequest.baseAsset}/${orderRequest.quoteAsset}`,
            price: 'mkt',
            quantity: orderRequest.quantity * 10 ** 8,
          }),
        );
    });

  });

});
