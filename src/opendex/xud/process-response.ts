import { ServiceError } from '@grpc/grpc-js';
import { Subscriber } from 'rxjs';
import { ParseGrpcErrorResponse } from './parse-error';

type ProcessResponseParams = {
  subscriber: Subscriber<unknown>;
  parseGrpcError: (error: ServiceError) => ParseGrpcErrorResponse;
};

const processResponse = ({
  subscriber,
  parseGrpcError,
}: ProcessResponseParams) => {
  return (error: ServiceError | null, response: any) => {
    if (error) {
      const parsedError = parseGrpcError(error);
      parsedError && subscriber.error(parsedError);
    } else {
      subscriber.next(response);
    }
  };
};

export { processResponse };
