import { BigNumber } from 'bignumber.js';
import {
  GetBalanceResponse,
  TradingLimitsResponse,
} from '../broker/opendex/proto/xudrpc_pb';
import { Logger } from '../logger';
import { OpenDEXassetAllocation } from '../trade/info';
import { satsToCoinsStr } from '../utils';

type LogAssetBalanceParams = {
  logger: Logger;
  assets: OpenDEXassetAllocation;
};

const logAssetBalance = ({ logger, assets }: LogAssetBalanceParams): void => {
  const {
    baseAssetBalance,
    baseAssetMaxbuy,
    baseAssetMaxsell,
    quoteAssetBalance,
    quoteAssetMaxbuy,
    quoteAssetMaxsell,
  } = assets;
  logger.trace(
    `Base asset balance ${baseAssetBalance.toFixed()} (maxbuy: ${baseAssetMaxbuy.toFixed()}, maxsell: ${baseAssetMaxsell.toFixed()}) and quote asset balance ${quoteAssetBalance.toFixed()} (maxbuy: ${quoteAssetMaxbuy.toFixed()}, maxsell: ${quoteAssetMaxsell.toFixed()}).`
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
  try {
    const balancesMap = balanceResponse.getBalancesMap();
    const baseAssetBalance = new BigNumber(
      satsToCoinsStr(balancesMap.get(baseAsset).getChannelBalance())
    );
    const quoteAssetBalance = new BigNumber(
      satsToCoinsStr(balancesMap.get(quoteAsset).getChannelBalance())
    );
    const tradingLimitsMap = tradingLimitsResponse.getLimitsMap();
    const baseAssetLimits = tradingLimitsMap.get(baseAsset);
    const baseAssetMaxsell = new BigNumber(
      satsToCoinsStr(baseAssetLimits.getMaxsell())
    );
    const baseAssetMaxbuy = new BigNumber(
      satsToCoinsStr(baseAssetLimits.getMaxbuy())
    );
    const quoteAssetLimits = tradingLimitsMap.get(quoteAsset);
    const quoteAssetMaxsell = new BigNumber(
      satsToCoinsStr(quoteAssetLimits.getMaxsell())
    );
    const quoteAssetMaxbuy = new BigNumber(
      satsToCoinsStr(quoteAssetLimits.getMaxbuy())
    );
    return {
      baseAssetBalance,
      quoteAssetBalance,
      baseAssetMaxsell,
      baseAssetMaxbuy,
      quoteAssetMaxbuy,
      quoteAssetMaxsell,
    };
  } catch (e) {
    throw new Error(
      `Failed to get asset allocation for OpenDEX baseAsset ${baseAsset} or quote asset ${quoteAsset}.`
    );
  }
};

export {
  parseOpenDEXassets,
  logAssetBalance,
  LogAssetBalanceParams,
  ParseOpenDEXassetsParams,
};
