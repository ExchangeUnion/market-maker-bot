import { equals } from 'ramda';
import { v4 as uuidv4 } from 'uuid';
import { ListOrdersResponse } from '../proto/xudrpc_pb';
import { testConfig } from '../test-utils';
import { processListorders } from './process-listorders';

type TestOrderParams = {
  quantity: number;
  hold: number;
  ownOrder?: boolean;
};

type TestOrder = {
  getLocalId: () => string;
  getQuantity: () => number;
  getHold: () => number;
  getIsOwnOrder: () => boolean;
};

const testOrder = ({
  quantity,
  hold,
  ownOrder = true,
}: TestOrderParams): TestOrder => {
  const orderId = uuidv4();
  return {
    getLocalId: () => orderId,
    getQuantity: () => quantity,
    getHold: () => hold,
    getIsOwnOrder: () => ownOrder,
  };
};

type AssertProcessListOrdersParams = {
  buyOrders: TestOrder[];
  sellOrders: TestOrder[];
  expectedIds: string[];
};

const assertProcessListOrders = ({
  buyOrders,
  sellOrders,
  expectedIds,
}: AssertProcessListOrdersParams) => {
  const ordersMap = new Map();
  const orders = {
    getBuyOrdersList: () => buyOrders,
    getSellOrdersList: () => sellOrders,
  };
  const { BASEASSET, QUOTEASSET } = testConfig();
  ordersMap.set(`${BASEASSET}/${QUOTEASSET}`, orders);
  const listOrdersResponse = ({
    getOrdersMap: () => ordersMap,
  } as unknown) as ListOrdersResponse;
  const orderIds = processListorders({
    config: testConfig(),
    listOrdersResponse,
  });
  const orderIdsMatch = equals(orderIds, expectedIds);
  expect(orderIdsMatch).toBeTruthy();
};

describe('processListorders', () => {
  it('returns list of order ids from ListOrdersResponse', () => {
    expect.assertions(1);
    const sellOrder = testOrder({
      quantity: 100000,
      hold: 0,
    });
    const buyOrder = testOrder({
      quantity: 123000,
      hold: 0,
    });
    const expectedIds = [buyOrder.getLocalId(), sellOrder.getLocalId()];
    assertProcessListOrders({
      sellOrders: [sellOrder],
      buyOrders: [buyOrder],
      expectedIds,
    });
  });

  it('ignores orders with all of quantity on hold', () => {
    expect.assertions(1);
    const sellOrder = testOrder({
      quantity: 100000,
      hold: 100000,
    });
    const buyOrder = testOrder({
      quantity: 123000,
      hold: 123000,
    });
    assertProcessListOrders({
      sellOrders: [sellOrder],
      buyOrders: [buyOrder],
      expectedIds: [],
    });
  });

  it("ignores others' orders", () => {
    expect.assertions(1);
    const sellOrder = testOrder({
      quantity: 100000,
      hold: 0,
      ownOrder: false,
    });
    const buyOrder = testOrder({
      quantity: 123000,
      hold: 0,
      ownOrder: false,
    });
    assertProcessListOrders({
      sellOrders: [sellOrder],
      buyOrders: [buyOrder],
      expectedIds: [],
    });
  });

  it('errors when orders list is missing', () => {
    expect.assertions(1);
    const ordersMap = new Map();
    const listOrdersResponse = ({
      getOrdersMap: () => ordersMap,
    } as unknown) as ListOrdersResponse;
    expect(() => {
      processListorders({
        config: testConfig(),
        listOrdersResponse,
      });
    }).toThrowErrorMatchingSnapshot();
  });
});
