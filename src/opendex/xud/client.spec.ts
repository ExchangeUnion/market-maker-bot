import { ServiceError } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { testConfig } from '../../../test/utils';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import { getXudClient$, processResponse } from './client';

jest.mock('../../broker/opendex/proto/xudrpc_grpc_pb');
jest.mock('../../broker/opendex/proto/xudrpc_pb');

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

  test('processResponse success', done => {
    expect.assertions(1);
    const nextValue = 'next';
    const source$ = new Observable(subscriber => {
      processResponse(subscriber)(null, nextValue);
    });
    source$.subscribe(actualNextValue => {
      expect(actualNextValue).toEqual(nextValue);
      done();
    });
  });

  test('processResponse error', done => {
    expect.assertions(1);
    const errorValue = ('errorValue' as unknown) as ServiceError;
    const source$ = new Observable(subscriber => {
      processResponse(subscriber)(errorValue, null);
    });
    source$.subscribe({
      error: errorMsg => {
        expect(errorMsg).toEqual(errorValue);
        done();
      },
    });
  });
});
