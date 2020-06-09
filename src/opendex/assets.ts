import { Observable, combineLatest } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import {
  GetBalanceResponse,
  TradingLimitsResponse,
} from '../broker/opendex/proto/xudrpc_pb';
import { Config } from '../config';
import { Logger } from '../logger';
import { ExchangeAssetAllocation, OpenDEXassetAllocation } from '../trade/info';
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
    tap(assets => logBalance({ assets, logger }))
  );
};

export { getOpenDEXassets$ };
