import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { subscribeXudSwaps$ } from '../opendex/xud/subscribe-swaps';
import { Config } from '../config';
import { GetOpenDEXorderFilledParams } from '../opendex/order-filled';
import { getXudClient$ } from '../opendex/xud/client';
import { SwapSuccess } from '../proto/xudrpc_pb';

type GetCentralizedExchangeOrderParams = {
  config: Config;
  getOpenDEXorderFilled$: ({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }: GetOpenDEXorderFilledParams) => Observable<SwapSuccess>;
  createCentralizedExchangeOrder$: () => Observable<null>;
};

const getCentralizedExchangeOrder$ = ({
  config,
  getOpenDEXorderFilled$,
  createCentralizedExchangeOrder$,
}: GetCentralizedExchangeOrderParams): Observable<null> => {
  return getOpenDEXorderFilled$({
    config,
    getXudClient$,
    subscribeXudSwaps$,
  }).pipe(
    mergeMap(() => {
      return createCentralizedExchangeOrder$();
    })
  );
};

export { getCentralizedExchangeOrder$, GetCentralizedExchangeOrderParams };
