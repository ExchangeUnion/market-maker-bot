import { ServiceError, status } from '@grpc/grpc-js';
import { parseGrpcError } from './parse-error';

describe('handleGrpcError', () => {
  test('returns null for status.CANCELLED', () => {
    const inputError = ({
      code: status.CANCELLED,
    } as unknown) as ServiceError;
    const expectedError = null;
    expect(parseGrpcError(inputError)).toEqual(expectedError);
  });
});
