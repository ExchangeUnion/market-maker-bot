import { CreateXudOrderParams } from './xud/create-order';
import { TradeInfo } from '../trade/manager';
import { OrderSide } from '../broker/opendex/proto/xudrpc_pb';

type OpenDEXorder = Omit<CreateXudOrderParams, 'client'>;

type OpenDEXorders = {
  buyOrder: OpenDEXorder;
  sellOrder: OpenDEXorder;
};

const tradeInfoToOpenDEXorders = (tradeInfo: TradeInfo): OpenDEXorders => {
  const buyOrder = {
    quantity: 1000,
    orderSide: OrderSide.BUY,
    pairId: 'ETH/BTC',
    price: 123,
    orderId: '123-orderid',
  };
  const sellOrder = {
    quantity: 1000,
    orderSide: OrderSide.SELL,
    pairId: 'ETH/BTC',
    price: 123,
    orderId: '123-orderid',
  };
  return {
    buyOrder,
    sellOrder,
  };
};

export { OpenDEXorders, tradeInfoToOpenDEXorders };
