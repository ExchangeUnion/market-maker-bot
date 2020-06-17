import { Observable } from 'rxjs';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import {
  TradingLimitsRequest,
  TradingLimitsResponse,
} from '../../proto/xudrpc_pb';
import { processResponse } from './process-response';
import { parseGrpcError } from './parse-error';

const getXudTradingLimits$ = (
  client: XudClient
): Observable<TradingLimitsResponse> => {
  const request = new TradingLimitsRequest();
  const tradingLimits$ = new Observable(subscriber => {
    client.tradingLimits(
      request,
      processResponse({
        subscriber,
        parseGrpcError,
      })
    );
  });
  return tradingLimits$ as Observable<TradingLimitsResponse>;
};

export { getXudTradingLimits$ };
