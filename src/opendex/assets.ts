import { combineLatest, interval, Observable } from 'rxjs';
import { map, mergeMap, repeatWhen, take, tap } from 'rxjs/operators';
import { Config } from '../config';
import { Logger } from '../logger';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { GetBalanceResponse, TradingLimitsResponse } from '../proto/xudrpc_pb';
import { OpenDEXassetAllocation } from '../trade/info';
import {
  LogAssetBalanceParams,
  ParseOpenDEXassetsParams,
} from './assets-utils';

type GetOpenDEXassetsParams = {
  config: Config;
  logger: Logger;
  logBalance: ({ logger, assets }: LogAssetBalanceParams) => void;
  xudClient$: (config: Config) => Observable<XudClient>;
  xudBalance$: (client: XudClient) => Observable<GetBalanceResponse>;
  xudTradingLimits$: (client: XudClient) => Observable<TradingLimitsResponse>;
  parseOpenDEXassets: ({
    balanceResponse,
    tradingLimitsResponse,
    quoteAsset,
    baseAsset,
  }: ParseOpenDEXassetsParams) => OpenDEXassetAllocation;
};

const getOpenDEXassets$ = ({
  config,
  logger,
  logBalance,
  xudClient$,
  xudBalance$,
  xudTradingLimits$,
  parseOpenDEXassets,
}: GetOpenDEXassetsParams): Observable<OpenDEXassetAllocation> => {
  return xudClient$(config).pipe(
    mergeMap(client => {
      return combineLatest(xudBalance$(client), xudTradingLimits$(client));
    }),
    map(([balanceResponse, tradingLimitsResponse]) => {
      return parseOpenDEXassets({
        balanceResponse,
        tradingLimitsResponse,
        quoteAsset: config.OPENDEX_QUOTEASSET,
        baseAsset: config.OPENDEX_BASEASSET,
      });
    }),
    tap(assets => logBalance({ assets, logger })),
    take(1),
    // refresh assets every 30 seconds
    repeatWhen(() => interval(30000))
  );
};

export { getOpenDEXassets$ };
