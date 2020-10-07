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
  const CONNEXT_CURRENCIES = ['ETH', 'USDT', 'DAI'];
  const getOpenDEXMaxInbound = (asset: string) => {
    if (CONNEXT_CURRENCIES.includes(asset)) {
      if (asset === 'ETH') {
        // connext node provides us max inbound liquidity of 15 ETH
        return new BigNumber('14.25');
      } else {
        // ...and 5000 for other assets
        return new BigNumber('4750');
      }
    } else if (asset === config.BASEASSET) {
      return openDEXbaseAssetMaxInbound;
    } else {
      return openDEXquoteAssetMaxInbound;
    }
  };
  const buyQuantity = BigNumber.minimum(
    getOpenDEXMaxInbound(config.BASEASSET),
    openDEXquoteAssetMaxOutbound.dividedBy(buyPrice),
    centralizedExchangeBaseAssetBalance
  );
  const BUFFER = new BigNumber('0.01');
  const buyQuantityWithBuffer = buyQuantity.minus(
    buyQuantity.multipliedBy(BUFFER)
  );
  const sellQuantity = BigNumber.minimum(
    openDEXbaseAssetMaxOutbound,
    getOpenDEXMaxInbound(config.QUOTEASSET).dividedBy(sellPrice),
    centralizedExchangeQuoteAssetBalance.dividedBy(price)
  );
  const sellQuantityWithBuffer = sellQuantity.minus(
    sellQuantity.multipliedBy(BUFFER)
  );
  const buyOrder = {
    quantity: coinsToSats(
      new BigNumber(buyQuantityWithBuffer.toFixed(8, 1)).toNumber()
    ),
    orderSide: OrderSide.BUY,
    pairId,
    price: buyPrice.toNumber(),
    orderId: createOrderID(config, OrderSide.BUY),
  };
  const sellOrder = {
    quantity: coinsToSats(
      new BigNumber(sellQuantityWithBuffer.toFixed(8, 1)).toNumber()
    ),
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
