import { Observable } from 'rxjs';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  TradingLimitsRequest,
  TradingLimitsResponse,
} from '../../broker/opendex/proto/xudrpc_pb';
import { processResponse } from './client';

const getXudTradingLimits$ = (
  client: XudClient
): Observable<TradingLimitsResponse> => {
  const request = new TradingLimitsRequest();
  const tradingLimits$ = new Observable(subscriber => {
    client.tradingLimits(request, processResponse(subscriber));
  });
  return tradingLimits$ as Observable<TradingLimitsResponse>;
};

export { getXudTradingLimits$ };
