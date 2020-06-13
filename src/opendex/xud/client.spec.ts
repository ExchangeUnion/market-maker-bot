import { ServiceError } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { testConfig } from '../../test-utils';
import { errors } from '../errors';
import { getXudClient$, processResponse } from './client';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

describe('XudClient', () => {
  test('getXudClient$', done => {
    expect.assertions(2);
    const config = testConfig();
    const xudClient$ = getXudClient$(config);
    xudClient$.subscribe(() => {
      expect(XudClient).toHaveBeenCalledTimes(1);
      expect(XudClient).toHaveBeenCalledWith(
        `${config.OPENDEX_RPC_HOST}:${config.OPENDEX_RPC_PORT}`,
        expect.any(Object),
        expect.any(Object)
      );
      done();
    });
  });

  test('getXudClient$ invalid cert', done => {
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

  test('processResponse success', done => {
    expect.assertions(1);
    const nextValue = 'next';
    const parseGrpcError = jest.fn().mockReturnValue('error');
    const source$ = new Observable(subscriber => {
      processResponse({
        subscriber,
        parseGrpcError,
      })(null, nextValue);
    });
    source$.subscribe({
      next: actualNextValue => {
        expect(actualNextValue).toEqual(nextValue);
        done();
      },
    });
  });

  test('processResponse error', done => {
    expect.assertions(3);
    const errorValue = ('errorValue' as unknown) as ServiceError;
    const parsedError = 'parsedError';
    const parseGrpcError = jest.fn().mockReturnValue(parsedError);
    const source$ = new Observable(subscriber => {
      processResponse({
        parseGrpcError,
        subscriber,
      })(errorValue, null);
    });
    source$.subscribe({
      error: errorMsg => {
        expect(errorMsg).toEqual(parsedError);
        done();
      },
    });
    expect(parseGrpcError).toHaveBeenCalledWith(errorValue);
    expect(parseGrpcError).toHaveBeenCalledTimes(1);
  });
});
