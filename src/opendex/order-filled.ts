import { Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import { SwapSuccess } from '../broker/opendex/proto/xudrpc_pb';
import { Config } from '../config';
import { errors, xudErrorCodes } from './errors';

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
    }),
    catchError(e => {
      if (e.code == xudErrorCodes.UNAVAILABLE) {
        return throwError(errors.XUD_UNAVAILABLE);
      }
      return throwError(e);
    })
  );
};

export { getOpenDEXorderFilled$, GetOpenDEXorderFilledParams };
