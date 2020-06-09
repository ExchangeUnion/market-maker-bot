import { CreateXudOrderParams } from './xud/create-order';
import { TradeInfo } from '../trade/manager';
import { OrderSide } from '../broker/opendex/proto/xudrpc_pb';
import BigNumber from 'bignumber.js';
import { coinsToSats } from '../utils';
import { Config } from '../config';

type OpenDEXorder = Omit<CreateXudOrderParams, 'client'>;

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
    baseAssetMaxsell: openDEXbaseAssetMaxsell,
    quoteAssetMaxbuy: openDEXquoteAssetMaxbuy,
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
      openDEXquoteAssetMaxbuy,
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
    orderId: `arby-buy-order-${pairId}`,
  };
  const sellQuantity = coinsToSats(
    BigNumber.minimum(
      openDEXbaseAssetMaxsell,
      centralizedExchangeBaseAssetBalance
    ).toNumber()
  );
  const sellOrder = {
    quantity: sellQuantity,
    orderSide: OrderSide.SELL,
    pairId,
    price: sellPrice,
    orderId: `arby-sell-order-${pairId}`,
  };
  return {
    buyOrder,
    sellOrder,
  };
};

export {
  OpenDEXorders,
  tradeInfoToOpenDEXorders,
  TradeInfoToOpenDEXordersParams,
};
