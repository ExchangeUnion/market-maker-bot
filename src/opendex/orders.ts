import BigNumber from 'bignumber.js';
import { Config } from '../config';
import { OrderSide } from '../proto/xudrpc_pb';
import { TradeInfo } from '../trade/info';
import { coinsToSats } from '../utils';

type OpenDEXorder = {
  quantity: number;
  orderSide: OrderSide;
  pairId: string;
  price: number;
  orderId: string;
  replaceOrderId?: string;
};

type OpenDEXorders = {
  buyOrder: OpenDEXorder;
  sellOrder: OpenDEXorder;
};

type TradeInfoToOpenDEXordersParams = {
  tradeInfo: TradeInfo;
  config: Config;
};

const createOrderID = (config: Config, orderSide: OrderSide): string => {
  const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
  return orderSide === OrderSide.BUY
    ? `arby-${pairId}-buy-order`
    : `arby-${pairId}-sell-order`;
};

const tradeInfoToOpenDEXorders = ({
  tradeInfo,
  config,
}: TradeInfoToOpenDEXordersParams): OpenDEXorders => {
  const { price } = tradeInfo;
  const { centralizedExchange, openDEX } = tradeInfo.assets;
  const {
    baseAssetMaxOutbound: openDEXbaseAssetMaxOutbound,
    baseAssetMaxInbound: openDEXbaseAssetMaxInbound,
    quoteAssetMaxOutbound: openDEXquoteAssetMaxOutbound,
    quoteAssetMaxInbound: openDEXquoteAssetMaxInbound,
  } = openDEX;
  const {
    baseAssetBalance: centralizedExchangeBaseAssetBalance,
    quoteAssetBalance: centralizedExchangeQuoteAssetBalance,
  } = centralizedExchange;
  const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
  const marginPercentage = new BigNumber(config.MARGIN);
  const margin = price.multipliedBy(marginPercentage);
  const buyPrice = price.minus(margin);
  const sellPrice = price.plus(margin);
  const buyQuantity = BigNumber.minimum(
    openDEXbaseAssetMaxInbound,
    openDEXquoteAssetMaxOutbound.dividedBy(buyPrice),
    centralizedExchangeBaseAssetBalance
  );
  const sellQuantity = BigNumber.minimum(
    openDEXbaseAssetMaxOutbound,
    openDEXquoteAssetMaxInbound.dividedBy(sellPrice),
    centralizedExchangeQuoteAssetBalance.dividedBy(price)
  );
  const buyOrder = {
    quantity: coinsToSats(new BigNumber(buyQuantity.toFixed(8, 1)).toNumber()),
    orderSide: OrderSide.BUY,
    pairId,
    price: buyPrice.toNumber(),
    orderId: createOrderID(config, OrderSide.BUY),
  };
  const sellOrder = {
    quantity: coinsToSats(new BigNumber(sellQuantity.toFixed(8, 1)).toNumber()),
    orderSide: OrderSide.SELL,
    pairId,
    price: sellPrice.toNumber(),
    orderId: createOrderID(config, OrderSide.SELL),
  };
  return {
    buyOrder,
    sellOrder,
  };
};

export {
  OpenDEXorders,
  OpenDEXorder,
  tradeInfoToOpenDEXorders,
  createOrderID,
  TradeInfoToOpenDEXordersParams,
};
