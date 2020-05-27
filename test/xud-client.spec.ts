import { XudGrpcClient } from '../src/broker/opendex/xud-client';
import { homedir } from 'os';
import {
  OrderSide as XudOrderSide,
  // PlaceOrderEvent,
} from '../src/broker/opendex/proto/xudrpc_pb';
import { v4 as uuidv4 } from 'uuid';

// This test suite is disabled by default because it requires xud to be up and running.
// This is mainly used for development proposes as the api spec deals with mocked responses.
describe.skip('xud client', () => {
  const tlscertpath = `${homedir()}/.xud/tls.cert`;
  // const tlscertpath = `${homedir()}/xud-simnet/xud-wd/tls.cert`;
  const rpchost = 'localhost';
  const rpcport = 8886;
  let xudClient: XudGrpcClient;

  beforeEach(() => {
    xudClient = new XudGrpcClient({
      tlscertpath,
      rpchost,
      rpcport,
    });
    xudClient.start();
  });

  describe('subscribeSwaps', () => {

    test('subscribes to swap complete and failed events', async () => {
      expect.assertions(1);
      const subscribeSwapsSubscription = xudClient.subscribeSwaps();
      expect(subscribeSwapsSubscription).toBeTruthy();
    });

  });

  describe('limit order', () => {

    test('creates order and cancels it', async () => {
      expect.assertions(3);
      const pairId = 'LTC/BTC';
      const quantity = 100000000;
      const orderSide = XudOrderSide.BUY;
      const price = 4000;
      const orderId = uuidv4();
      const newOrderSubscription = await xudClient.newOrder({
        pairId,
        quantity,
        orderSide,
        price,
        orderId,
      });
      const { remainingOrder } = newOrderSubscription;
      expect(remainingOrder).toBeTruthy();
      expect(remainingOrder).toEqual(
        expect.objectContaining({
          price,
          quantity,
          pairId,
          localId: orderId,
        }),
      );
      const removeOrderResponseObj = await xudClient.removeOrder(orderId);
      expect(removeOrderResponseObj).toBeTruthy();
    });

  });

  describe('market order', () => {

    test('creates order', async () => {
      expect.assertions(4);
      const pairId = 'LTC/BTC';
      const quantity = 1000;
      const orderSide = XudOrderSide.SELL;
      const price = 'mkt';
      const orderId = uuidv4();
      const newOrderSubscription = await xudClient.newOrder({
        pairId,
        quantity,
        orderSide,
        price,
        orderId,
      });
      const {
        internalMatchesList,
        swapSuccessesList,
        remainingOrder,
        swapFailuresList,
      } = newOrderSubscription;
      expect(remainingOrder).toBeUndefined();
      expect(swapSuccessesList.length).toEqual(0);
      expect(swapFailuresList.length).toEqual(0);
      expect(internalMatchesList.length).toEqual(0);
    });

  });

  describe('getbalance', () => {

    test('succeeds', async () => {
      await expect(
        xudClient.getBalance(),
      ).resolves.toBeTruthy();
    });

    test('fails', async () => {
      xudClient['rpchost'] = '123.456.789.321';
      xudClient.start();
      await expect(
        xudClient.getBalance(),
      ).rejects.toMatchSnapshot();
    });

  });

  describe('trading limits', () => {

    test('succeeds', async () => {
      await expect(
        xudClient.tradingLimits(),
      ).resolves.toEqual(
        expect.objectContaining({
          limitsMap: expect.any(Array),
        }),
      );
    });

  });

});
