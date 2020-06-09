import { CreateXudOrderParams } from './xud/create-order';
import { TradeInfo } from '../trade/manager';
import { OrderSide } from '../broker/opendex/proto/xudrpc_pb';
import BigNumber from 'bignumber.js';
import { coinsToSats } from '../utils';

type OpenDEXorder = Omit<CreateXudOrderParams, 'client'>;

type OpenDEXorders = {
  buyOrder: OpenDEXorder;
  sellOrder: OpenDEXorder;
};

const tradeInfoToOpenDEXorders = (tradeInfo: TradeInfo): OpenDEXorders => {
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
  const buyOrder = {
    quantity: buyQuantity,
    orderSide: OrderSide.BUY,
    pairId: 'ETH/BTC',
    price: 123,
    orderId: 'arby-buy-order',
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
    pairId: 'ETH/BTC',
    price: 123,
    orderId: 'arby-sell-order',
  };
  return {
    buyOrder,
    sellOrder,
  };
};

export { OpenDEXorders, tradeInfoToOpenDEXorders };
