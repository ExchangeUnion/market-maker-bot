import { Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { GetBalanceResponse } from '../broker/opendex/proto/xudrpc_pb';
import { Config } from '../config';
import { Logger } from '../logger';
import { ExchangeAssetAllocation } from '../trade/info';
import { LogAssetBalanceParams } from './assets-utils';

const getOpenDEXassets$ = ({
  config,
  logger,
  logBalance,
  xudClient$,
  xudBalance$,
  xudBalanceToExchangeAssetAllocation,
}: {
  config: Config;
  logger: Logger;
  logBalance: ({ logger, assetBalance }: LogAssetBalanceParams) => void;
  xudClient$: (config: Config) => Observable<XudClient>;
  xudBalance$: (client: XudClient) => Observable<GetBalanceResponse>;
  xudBalanceToExchangeAssetAllocation: ({
    balanceResponse,
    quoteAsset,
    baseAsset,
  }: {
    balanceResponse: GetBalanceResponse;
    quoteAsset: string;
    baseAsset: string;
  }) => ExchangeAssetAllocation;
}): Observable<ExchangeAssetAllocation> => {
  return xudClient$(config).pipe(
    mergeMap(client => xudBalance$(client)),
    map(balanceResponse => {
      return xudBalanceToExchangeAssetAllocation({
        balanceResponse,
        quoteAsset: config.QUOTEASSET,
        baseAsset: config.BASEASSET,
      });
    }),
    tap(assetBalance => logBalance({ assetBalance, logger }))
  );
};

export { getOpenDEXassets$ };
