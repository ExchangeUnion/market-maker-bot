import { ListOrdersResponse, Order } from '../proto/xudrpc_pb';
import { Config } from 'src/config';
import { errors } from './errors';

type ProcessListOrdersParams = {
  config: Config;
  listOrdersResponse: ListOrdersResponse;
};

const processListorders = ({
  listOrdersResponse,
  config,
}: ProcessListOrdersParams): string[] => {
  const ordersMap = listOrdersResponse.getOrdersMap();
  const { OPENDEX_BASEASSET, OPENDEX_QUOTEASSET } = config;
  const tradingPair = `${OPENDEX_BASEASSET}/${OPENDEX_QUOTEASSET}`;
  const tradingPairOrders = ordersMap.get(tradingPair);
  if (!tradingPairOrders) {
    throw errors.INVALID_ORDERS_LIST(tradingPair);
  }
  const buyOrders = tradingPairOrders.getBuyOrdersList();
  const sellOrders = tradingPairOrders.getSellOrdersList();
  const orderIds = buyOrders
    .concat(sellOrders)
    .reduce((allOrderIds: string[], currentOrder: Order) => {
      const ownOrder = currentOrder.getIsOwnOrder();
      const quantity = currentOrder.getQuantity();
      const hold = currentOrder.getHold();
      const remainingQuantity = quantity - hold;
      if (ownOrder && remainingQuantity) {
        return allOrderIds.concat(currentOrder.getLocalId());
      }
      return allOrderIds;
    }, []);
  return orderIds;
};

export { processListorders, ProcessListOrdersParams };
