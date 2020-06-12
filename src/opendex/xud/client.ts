import { credentials, ServiceError } from '@grpc/grpc-js';
import fs from 'fs';
import { Observable, Subscriber, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Config } from '../../config';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { errors, xudErrorCodes } from '../errors';

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
      if (error.code === xudErrorCodes.ENOENT) {
        return throwError(
          errors.XUD_CLIENT_INVALID_CERT(config.OPENDEX_CERT_PATH)
        );
      }
      return throwError(error);
    })
  );
  return client$ as Observable<XudClient>;
};

const processResponse = (subscriber: Subscriber<unknown>) => {
  return (error: ServiceError | null, response: any) => {
    if (error) {
      // remap expected xud unavailable error
      if (error.code == xudErrorCodes.UNAVAILABLE) {
        subscriber.error(errors.XUD_UNAVAILABLE);
        return;
      }
      // remap expected xud unimplemented error
      if (error.code == xudErrorCodes.UNIMPLEMENTED) {
        subscriber.error(errors.XUD_LOCKED);
        return;
      }
      subscriber.error(error);
    } else {
      subscriber.next(response);
    }
  };
};

export { getXudClient$, processResponse };
