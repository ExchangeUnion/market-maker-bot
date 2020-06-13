import { parseGrpcError } from './parse-error';
import { errors, grpcErrorCodes } from '../errors';
import { ServiceError } from '@grpc/grpc-js';

describe('handleGrpcError', () => {
  test('returns XUD_UNAVAILABLE', () => {
    const inputError = ({
      code: grpcErrorCodes.UNAVAILABLE,
    } as unknown) as ServiceError;
    const expectedError = errors.XUD_UNAVAILABLE;
    expect(parseGrpcError(inputError)).toEqual(expectedError);
  });

  test('returns XUD_LOCKED', () => {
    const inputError = ({
      code: grpcErrorCodes.UNIMPLEMENTED,
    } as unknown) as ServiceError;
    const expectedError = errors.XUD_LOCKED;
    expect(parseGrpcError(inputError)).toEqual(expectedError);
  });

  test('returns null for code 1', () => {
    const inputError = ({
      code: grpcErrorCodes.CLIENT_CANCELED,
    } as unknown) as ServiceError;
    const expectedError = null;
    expect(parseGrpcError(inputError)).toEqual(expectedError);
  });
});
