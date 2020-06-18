import { BigNumber } from 'bignumber.js';
import { Logger } from '../logger';
import { GetBalanceResponse, TradingLimitsResponse } from '../proto/xudrpc_pb';
import { OpenDEXassetAllocation } from '../trade/info';
import { satsToCoinsStr } from '../utils';
import { errors } from './errors';

type LogAssetBalanceParams = {
  logger: Logger;
  assets: OpenDEXassetAllocation;
};

const logAssetBalance = ({ logger, assets }: LogAssetBalanceParams): void => {
  const {
    baseAssetBalance,
    baseAssetMaxInbound,
    baseAssetMaxOutbound,
    quoteAssetBalance,
    quoteAssetMaxInbound,
    quoteAssetMaxOutbound,
  } = assets;
  logger.trace(
    `Base asset balance ${baseAssetBalance.toFixed()} (maxinbound: ${baseAssetMaxInbound.toFixed()}, maxoutbound: ${baseAssetMaxOutbound.toFixed()}) and quote asset balance ${quoteAssetBalance.toFixed()} (maxinbound: ${quoteAssetMaxInbound.toFixed()}, maxoutbound: ${quoteAssetMaxOutbound.toFixed()}).`
  );
};

type ParseOpenDEXassetsParams = {
  balanceResponse: GetBalanceResponse;
  tradingLimitsResponse: TradingLimitsResponse;
  baseAsset: string;
  quoteAsset: string;
};

const parseOpenDEXassets = ({
  balanceResponse,
  tradingLimitsResponse,
  baseAsset,
  quoteAsset,
}: ParseOpenDEXassetsParams): OpenDEXassetAllocation => {
  const balancesMap = balanceResponse.getBalancesMap();
  const baseAssetBalances = balancesMap.get(baseAsset);
  if (!baseAssetBalances) {
    throw errors.BALANCE_MISSING(baseAsset);
  }
  const baseAssetBalance = new BigNumber(
    satsToCoinsStr(baseAssetBalances.getChannelBalance())
  );
  const quoteAssetBalances = balancesMap.get(quoteAsset);
  if (!quoteAssetBalances) {
    throw errors.BALANCE_MISSING(quoteAsset);
  }
  const quoteAssetBalance = new BigNumber(
    satsToCoinsStr(quoteAssetBalances.getChannelBalance())
  );
  const tradingLimitsMap = tradingLimitsResponse.getLimitsMap();
  const baseAssetLimits = tradingLimitsMap.get(baseAsset);
  if (!baseAssetLimits) {
    throw errors.TRADING_LIMITS_MISSING(baseAsset);
  }
  const baseAssetMaxOutbound = new BigNumber(
    satsToCoinsStr(baseAssetLimits.getMaxsell())
  );
  const baseAssetMaxInbound = new BigNumber(
    satsToCoinsStr(baseAssetLimits.getMaxbuy())
  );
  const quoteAssetLimits = tradingLimitsMap.get(quoteAsset);
  if (!quoteAssetLimits) {
    throw errors.TRADING_LIMITS_MISSING(quoteAsset);
  }
  const quoteAssetMaxOutbound = new BigNumber(
    satsToCoinsStr(quoteAssetLimits.getMaxsell())
  );
  const quoteAssetMaxInbound = new BigNumber(
    satsToCoinsStr(quoteAssetLimits.getMaxbuy())
  );
  return {
    baseAssetBalance,
    quoteAssetBalance,
    baseAssetMaxOutbound,
    baseAssetMaxInbound,
    quoteAssetMaxInbound,
    quoteAssetMaxOutbound,
  };
};

export {
  parseOpenDEXassets,
  logAssetBalance,
  LogAssetBalanceParams,
  ParseOpenDEXassetsParams,
};
