import { Observable } from 'rxjs';
import { tap, map, take, mergeMap } from 'rxjs/operators';
import { ExchangeAssetAllocation } from '../trade/manager';
import { BigNumber } from 'bignumber.js';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { Config } from '../config';
import { Logger } from '../logger';

type LogAssetBalanceParams = {
  logger: Logger
  assetBalance: ExchangeAssetAllocation
};

const logAssetBalance = (
  { logger, assetBalance }: LogAssetBalanceParams
): void => {
  const { baseAssetBalance, quoteAssetBalance } = assetBalance;
  logger.trace(`Base asset balance ${baseAssetBalance.toFixed()} and quote asset balance ${quoteAssetBalance.toFixed()}}`)
};

const xudBalanceToExchangeAssetAllocation =
  (
    {
      balanceResponse,
      baseAsset,
      quoteAsset,
    }:
    {
      balanceResponse: GetBalanceResponse
      baseAsset: string,
      quoteAsset: string
    }
  ):
  ExchangeAssetAllocation => {
    const balancesMap = balanceResponse.getBalancesMap();
    const baseAssetBalance = new BigNumber(
      balancesMap
      .get(baseAsset)
      .getChannelBalance()
    );
    const quoteAssetBalance = new BigNumber(
      balancesMap
      .get(quoteAsset)
      .getChannelBalance()
    );
    return {
      baseAssetBalance,
      quoteAssetBalance,
    }
}

const getOpenDEXassets$ = (
  {
    config,
    logger,
    logBalance,
    xudClient$,
    xudBalance$,
    xudBalanceToExchangeAssetAllocation,
  }:
  {
    config: Config
    logger: Logger
    logBalance: (
      { logger, assetBalance }: LogAssetBalanceParams
    ) => void
    xudClient$: (config: Config) => Observable<XudClient>
    xudBalance$: (client: XudClient) => Observable<GetBalanceResponse>
    xudBalanceToExchangeAssetAllocation: (
      {
        balanceResponse,
        quoteAsset,
        baseAsset,
      }:
      {
        balanceResponse: GetBalanceResponse,
        quoteAsset: string,
        baseAsset: string
      }
    ) => ExchangeAssetAllocation,
  }
): Observable<ExchangeAssetAllocation> => {
  return xudClient$(config).pipe(
    mergeMap((client) => xudBalance$(client)),
    map((balanceResponse) => {
      return xudBalanceToExchangeAssetAllocation({
        balanceResponse,
        quoteAsset: config.QUOTEASSET,
        baseAsset: config.BASEASSET,
      });
    }),
    tap((assetBalance) => logBalance({ assetBalance, logger })),
    take(1),
  )
};

export {
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
  logAssetBalance,
};
