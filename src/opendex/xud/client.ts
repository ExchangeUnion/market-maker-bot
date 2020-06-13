import { credentials, ServiceError } from '@grpc/grpc-js';
import fs from 'fs';
import { Observable, Subscriber, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Config } from '../../config';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { errors, grpcErrorCodes } from '../errors';
import { ParseGrpcErrorResponse } from './parse-error';

const getXudClient$ = (config: Config): Observable<XudClient> => {
  const client$ = new Observable(subscriber => {
    const cert = fs.readFileSync(config.OPENDEX_CERT_PATH);
    const sslCredentials = credentials.createSsl(cert);
    const options = {
      'grpc.ssl_target_name_override': 'localhost',
      'grpc.default_authority': 'localhost',
    };
    const client = new XudClient(
      `${config.OPENDEX_RPC_HOST}:${config.OPENDEX_RPC_PORT}`,
      sslCredentials,
      options
    );
    subscriber.next(client);
    subscriber.complete();
  }).pipe(
    catchError(error => {
      if (error.code === grpcErrorCodes.ENOENT) {
        return throwError(
          errors.XUD_CLIENT_INVALID_CERT(config.OPENDEX_CERT_PATH)
        );
      }
      return throwError(error);
    })
  );
  return client$ as Observable<XudClient>;
};

type ProcessResponseParams = {
  subscriber: Subscriber<unknown>;
  parseGrpcError: (error: ServiceError) => ParseGrpcErrorResponse;
};

const processResponse = ({
  subscriber,
  parseGrpcError,
}: ProcessResponseParams) => {
  return (error: ServiceError | null, response: any) => {
    if (error) {
      const parsedError = parseGrpcError(error);
      parsedError && subscriber.error(parsedError);
    } else {
      subscriber.next(response);
    }
  };
};

export { getXudClient$, processResponse };
