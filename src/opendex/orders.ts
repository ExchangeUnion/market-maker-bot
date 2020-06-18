import BigNumber from 'bignumber.js';
import { v4 as uuidv4 } from 'uuid';
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
};

type OpenDEXorders = {
  buyOrder: OpenDEXorder;
  sellOrder: OpenDEXorder;
};

type TradeInfoToOpenDEXordersParams = {
  tradeInfo: TradeInfo;
  config: Config;
};

const tradeInfoToOpenDEXorders = ({
  tradeInfo,
  config,
}: TradeInfoToOpenDEXordersParams): OpenDEXorders => {
  const { price } = tradeInfo;
  const { centralizedExchange, openDEX } = tradeInfo.assets;
  const {
    baseAssetMaxOutbound: openDEXbaseAssetMaxOutbound,
    quoteAssetMaxInbound: openDEXquoteAssetMaxInbound,
  } = openDEX;
  const {
    baseAssetBalance: centralizedExchangeBaseAssetBalance,
    quoteAssetBalance: centralizedExchangeQuoteAssetBalance,
  } = centralizedExchange;
  const margin = new BigNumber(config.MARGIN);
  const spread = price.multipliedBy(margin);
  const buyPrice = price.minus(spread).toNumber();
  const sellPrice = price.plus(spread).toNumber();
  const buyQuantity = coinsToSats(
    BigNumber.minimum(
      openDEXquoteAssetMaxInbound,
      centralizedExchangeQuoteAssetBalance
    )
      .dividedBy(price)
      .toNumber()
  );
  const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
  const buyOrder = {
    quantity: buyQuantity,
    orderSide: OrderSide.BUY,
    pairId,
    price: buyPrice,
    orderId: uuidv4(),
  };
  const sellQuantity = coinsToSats(
    BigNumber.minimum(
      openDEXbaseAssetMaxOutbound,
      centralizedExchangeBaseAssetBalance
    ).toNumber()
  );
  const sellOrder = {
    quantity: sellQuantity,
    orderSide: OrderSide.SELL,
    pairId,
    price: sellPrice,
    orderId: uuidv4(),
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
  TradeInfoToOpenDEXordersParams,
};
