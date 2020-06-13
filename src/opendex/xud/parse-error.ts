import { ServiceError } from '@grpc/grpc-js';
import { errors, grpcErrorCodes, ArbyError } from '../errors';

type ParseGrpcErrorResponse = ServiceError | ArbyError | null;

const parseGrpcError = (error: ServiceError): ParseGrpcErrorResponse => {
  // ignore the error
  if (error.code == grpcErrorCodes.CLIENT_CANCELED) {
    return null;
  }
  // remap
  if (error.code == grpcErrorCodes.UNAVAILABLE) {
    return errors.XUD_UNAVAILABLE;
  }
  if (error.code == grpcErrorCodes.UNIMPLEMENTED) {
    return errors.XUD_LOCKED;
  }
  if (error.code == grpcErrorCodes.FAILED_PRECONDITION) {
    return errors.INSUFFICIENT_OUTBOUND_BALANCE;
  }
  // default
  return error;
};

export { parseGrpcError, ParseGrpcErrorResponse };
