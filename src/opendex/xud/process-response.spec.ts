import { ServiceError } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { processResponse } from './process-response';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

describe('processResponse', () => {
  test('success', done => {
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

  test('error', done => {
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
