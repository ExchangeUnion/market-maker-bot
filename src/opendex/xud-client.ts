import { Subscriber, Observable, of } from 'rxjs';
import { Config } from '../config';
import { XudClient } from '@proto/xudrpc_grpc_pb';
import fs from 'fs';
import { credentials } from '@grpc/grpc-js';
import {
  GetBalanceRequest,
  GetBalanceResponse,
} from '@proto/xudrpc_pb';
import { ServiceError } from '@grpc/grpc-js';

const getXudClient$ = (config: Config): Observable<XudClient> => {
  const cert = fs.readFileSync(config.OPENDEX_CERT_PATH);
  const sslCredentials = credentials.createSsl(cert);
  const options = {
    'grpc.ssl_target_name_override' : 'localhost',
    'grpc.default_authority': 'localhost'
  };
  const client = new XudClient(
    `${config.OPENDEX_RPC_HOST}:${config.OPENDEX_RPC_PORT}`,
    sslCredentials,
    options,
  );
  return of(client);
};

const processResponse = (subscriber: Subscriber<unknown>) => {
  return (error: ServiceError | null, response: any) => {
    if (error) {
      subscriber.error(error);
    } else {
      subscriber.next(response);
    }
  };
};

const getXudBalance$ = (client: XudClient): Observable<GetBalanceResponse> => {
  const request = new GetBalanceRequest();
  const balance$ = new Observable((subscriber) => {
    client.getBalance(request, processResponse(subscriber));
  });
  return balance$ as Observable<GetBalanceResponse>;
};

export {
  getXudClient$,
  getXudBalance$,
  processResponse,
};
