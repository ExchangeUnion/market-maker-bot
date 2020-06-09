import { Observable, combineLatest } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import {
  GetBalanceResponse,
  TradingLimitsResponse,
} from '../broker/opendex/proto/xudrpc_pb';
import { Config } from '../config';
import { Logger } from '../logger';
import { ExchangeAssetAllocation } from '../trade/info';
import {
  LogAssetBalanceParams,
  ParseOpenDEXassetsParams,
} from './assets-utils';

type GetOpenDEXassetsParams = {
  config: Config;
  logger: Logger;
  logBalance: ({ logger, assetBalance }: LogAssetBalanceParams) => void;
  xudClient$: (config: Config) => Observable<XudClient>;
  xudBalance$: (client: XudClient) => Observable<GetBalanceResponse>;
  xudTradingLimits$: (client: XudClient) => Observable<TradingLimitsResponse>;
  parseOpenDEXassets: ({
    balanceResponse,
    tradingLimitsResponse,
    quoteAsset,
    baseAsset,
  }: ParseOpenDEXassetsParams) => ExchangeAssetAllocation;
};

const getOpenDEXassets$ = ({
  config,
  logger,
  logBalance,
  xudClient$,
  xudBalance$,
  xudTradingLimits$,
  parseOpenDEXassets,
}: GetOpenDEXassetsParams): Observable<ExchangeAssetAllocation> => {
  return xudClient$(config).pipe(
    mergeMap(client => {
      return combineLatest(xudBalance$(client), xudTradingLimits$(client));
    }),
    map(([balanceResponse, tradingLimitsResponse]) => {
      return parseOpenDEXassets({
        balanceResponse,
        tradingLimitsResponse,
        quoteAsset: config.QUOTEASSET,
        baseAsset: config.BASEASSET,
      });
    }),
    tap(assetBalance => logBalance({ assetBalance, logger }))
  );
};

export { getOpenDEXassets$ };
