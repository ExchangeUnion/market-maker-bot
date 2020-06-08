import { processListorders } from './process-listorders';
import { ListOrdersResponse } from '../broker/opendex/proto/xudrpc_pb';
import { testConfig } from '../../test/utils';

describe('processListorders', () => {
  it('returns list of order ids from ListOrdersResponse', () => {
    const ordersMap = new Map();
    const sellOrder = {
      getLocalId: () => '123',
    };
    const buyOrder = {
      getLocalId: () => '321',
    };
    const orders = {
      getBuyOrdersList: () => [sellOrder],
      getSellOrdersList: () => [buyOrder],
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
    expect(orderIds).toEqual(expect.arrayContaining(['123', '321']));
  });
});
