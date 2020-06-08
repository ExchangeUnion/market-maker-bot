import { ListOrdersResponse, Order } from 'src/broker/opendex/proto/xudrpc_pb';
import { Config } from 'src/config';

type ProcessListOrdersParams = {
  config: Config;
  listOrdersResponse: ListOrdersResponse;
};

const processListorders = ({
  listOrdersResponse,
  config,
}: ProcessListOrdersParams): string[] => {
  const ordersMap = listOrdersResponse.getOrdersMap();
  const tradingPair = `${config.BASEASSET}/${config.QUOTEASSET}`;
  const tradingPairOrders = ordersMap.get(tradingPair);
  const buyOrders = tradingPairOrders.getBuyOrdersList();
  const sellOrders = tradingPairOrders.getSellOrdersList();
  const orderIds = buyOrders
    .concat(sellOrders)
    .reduce((allOrderIds: string[], currentOrder: Order) => {
      return allOrderIds.concat(currentOrder.getId());
    }, []);
  return orderIds;
};

export { processListorders };
