import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { testConfig } from '../../test-utils';
import { errors } from '../errors';
import { getXudClient$ } from './client';
import { take } from 'rxjs/operators';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

describe('getXudClient$', () => {
  test('success', done => {
    expect.assertions(3);
    const config = testConfig();
    const xudClient$ = getXudClient$(config);

    xudClient$.pipe(take(1)).subscribe({
      next: client => {
        expect(XudClient).toHaveBeenCalledTimes(1);
        expect(XudClient).toHaveBeenCalledWith(
          `${config.OPENDEX_RPC_HOST}:${config.OPENDEX_RPC_PORT}`,
          expect.any(Object),
          expect.any(Object)
        );
        setImmediate(() => {
          expect(client.close).toHaveBeenCalledTimes(1);
          done();
        });
      },
    });
  });

  test('error invalid cert', done => {
    expect.assertions(2);
    const invalidCertPath = '/invalid/cert/path/tls.cert';
    const config = {
      ...testConfig(),
      OPENDEX_CERT_PATH: invalidCertPath,
    };
    const xudClient$ = getXudClient$(config);
    xudClient$.subscribe({
      error: error => {
        expect(XudClient).toHaveBeenCalledTimes(1);
        expect(error).toEqual(errors.XUD_CLIENT_INVALID_CERT(invalidCertPath));
        done();
      },
    });
  });
});
