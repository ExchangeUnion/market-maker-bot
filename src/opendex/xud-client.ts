import { Observable, of } from 'rxjs';
import { Config } from '../config';
import { XudClient } from '../broker/opendex/proto/xudrpc_grpc_pb';
import fs from 'fs';
import { credentials } from '@grpc/grpc-js';

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

export { getXudClient$ };
