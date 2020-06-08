import { Observable } from 'rxjs';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  GetBalanceRequest,
  GetBalanceResponse,
} from '../../broker/opendex/proto/xudrpc_pb';
import { processResponse } from './client';

const getXudBalance$ = (client: XudClient): Observable<GetBalanceResponse> => {
  const request = new GetBalanceRequest();
  const balance$ = new Observable(subscriber => {
    client.getBalance(request, processResponse(subscriber));
  });
  return balance$ as Observable<GetBalanceResponse>;
};

export { getXudBalance$ };
