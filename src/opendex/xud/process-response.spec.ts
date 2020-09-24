import { ServiceError } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { processResponse } from './process-response';

jest.mock('../../proto/xudrpc_grpc_pb');
jest.mock('../../proto/xudrpc_pb');

describe('processResponse', () => {
  test('success', done => {
    expect.assertions(1);
    const nextValue = 'next';
    const source$ = new Observable(subscriber => {
      processResponse({
        subscriber,
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
    expect.assertions(1);
    const errorValue = ('errorValue' as unknown) as ServiceError;
    const source$ = new Observable(subscriber => {
      processResponse({
        subscriber,
      })(errorValue, null);
    });
    source$.subscribe({
      error: errorMsg => {
        expect(errorMsg).toEqual(errorValue);
        done();
      },
    });
  });
});
