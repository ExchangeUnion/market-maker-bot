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
  const { centralizedExchange, openDEX } = tradeInfo.assets;
  const {
    baseAssetMaxsell: openDEXbaseAssetMaxsell,
    quoteAssetMaxbuy: openDEXquoteAssetMaxbuy,
  } = openDEX;
  const {
    baseAssetBalance: centralizedExchangeBaseAssetBalance,
    quoteAssetBalance: centralizedExchangeQuoteAssetBalance,
  } = centralizedExchange;
  const buyQuantity = coinsToSats(
    BigNumber.minimum(
      openDEXquoteAssetMaxbuy,
      centralizedExchangeQuoteAssetBalance
    )
      .dividedBy(tradeInfo.price)
      .toNumber()
  );
  const pairId = `${config.BASEASSET}/${config.QUOTEASSET}`;
  const buyOrder = {
    quantity: buyQuantity,
    orderSide: OrderSide.BUY,
    pairId,
    price: 123,
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
    price: 123,
    orderId: `arby-sell-order-${pairId}`,
  };
  return {
    buyOrder,
    sellOrder,
  };
};

export { OpenDEXorders, tradeInfoToOpenDEXorders };
