import { ServiceError, status } from '@grpc/grpc-js';
import { ArbyError } from '../errors';

type ParseGrpcErrorResponse = ServiceError | ArbyError | null;

const parseGrpcError = (error: ServiceError): ParseGrpcErrorResponse => {
  // ignore the error
  if (error.code == status.CANCELLED) {
    return null;
  }
  // default
  return error;
};

export { parseGrpcError, ParseGrpcErrorResponse };
