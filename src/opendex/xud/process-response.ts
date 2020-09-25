import { ServiceError } from '@grpc/grpc-js';
import { Subscriber } from 'rxjs';

type ProcessResponseParams = {
  subscriber: Subscriber<unknown>;
};

const processResponse = ({ subscriber }: ProcessResponseParams) => {
  return (error: ServiceError | null, response: any) => {
    if (error) {
      subscriber.error(error);
    } else {
      subscriber.next(response);
    }
  };
};

export { processResponse };
