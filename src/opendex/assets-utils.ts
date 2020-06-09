import { BigNumber } from 'bignumber.js';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { Logger } from '../logger';
import { ExchangeAssetAllocation } from '../trade/info';
import { satsToCoinsStr } from '../utils';

type LogAssetBalanceParams = {
  logger: Logger;
  assetBalance: ExchangeAssetAllocation;
};

const logAssetBalance = ({
  logger,
  assetBalance,
}: LogAssetBalanceParams): void => {
  const { baseAssetBalance, quoteAssetBalance } = assetBalance;
  logger.trace(
    `Tradable base asset balance ${baseAssetBalance.toFixed()} and quote asset balance ${quoteAssetBalance.toFixed()}`
  );
};

const getOpenDEXtradableAssets = ({
  balanceResponse,
  baseAsset,
  quoteAsset,
}: {
  balanceResponse: GetBalanceResponse;
  baseAsset: string;
  quoteAsset: string;
}): ExchangeAssetAllocation => {
  const balancesMap = balanceResponse.getBalancesMap();
  try {
    const baseAssetBalance = new BigNumber(
      satsToCoinsStr(balancesMap.get(baseAsset).getChannelBalance())
    );
    const quoteAssetBalance = new BigNumber(
      satsToCoinsStr(balancesMap.get(quoteAsset).getChannelBalance())
    );
    return {
      baseAssetBalance,
      quoteAssetBalance,
    };
  } catch (e) {
    throw new Error(
      `OpenDEX balance does not include balance for base asset ${baseAsset} or quote asset ${quoteAsset}.`
    );
  }
};

export { getOpenDEXtradableAssets, logAssetBalance, LogAssetBalanceParams };
