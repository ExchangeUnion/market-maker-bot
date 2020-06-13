import { Observable } from 'rxjs';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { GetBalanceRequest, GetBalanceResponse } from '../../proto/xudrpc_pb';
import { processResponse } from './client';
import { parseGrpcError } from './parse-error';

const getXudBalance$ = (client: XudClient): Observable<GetBalanceResponse> => {
  const request = new GetBalanceRequest();
  const balance$ = new Observable(subscriber => {
    client.getBalance(
      request,
      processResponse({
        subscriber,
        parseGrpcError,
      })
    );
  });
  return balance$ as Observable<GetBalanceResponse>;
};

export { getXudBalance$ };
