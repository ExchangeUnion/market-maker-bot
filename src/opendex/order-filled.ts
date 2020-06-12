import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { XudClient } from '../proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../proto/xudrpc_pb';
import { Config } from '../config';

type GetOpenDEXorderFilledParams = {
  config: Config;
  getXudClient$: (config: Config) => Observable<XudClient>;
  subscribeXudSwaps$: (client: XudClient) => Observable<SwapSuccess>;
};

const getOpenDEXorderFilled$ = ({
  config,
  getXudClient$,
  subscribeXudSwaps$,
}: GetOpenDEXorderFilledParams): Observable<SwapSuccess> => {
  return getXudClient$(config).pipe(
    mergeMap(client => {
      return subscribeXudSwaps$(client);
    })
  );
};

export { getOpenDEXorderFilled$, GetOpenDEXorderFilledParams };
