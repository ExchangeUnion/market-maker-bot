import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { Config } from '../config';
import { SubscribeSwapsParams } from './xud/subscribe-swaps';
import { parseGrpcError } from './xud/parse-error';

type GetOpenDEXorderFilledParams = {
  config: Config;
  getXudClient$: (config: Config) => Observable<XudClient>;
  subscribeXudSwaps$: ({
    client,
    config,
  }: SubscribeSwapsParams) => Observable<SwapSuccess>;
};

const getOpenDEXorderFilled$ = ({
  config,
  getXudClient$,
  subscribeXudSwaps$,
}: GetOpenDEXorderFilledParams): Observable<SwapSuccess> => {
  return getXudClient$(config).pipe(
    mergeMap(client => {
      return subscribeXudSwaps$({ client, config, parseGrpcError });
    })
  );
};

export { getOpenDEXorderFilled$, GetOpenDEXorderFilledParams };
