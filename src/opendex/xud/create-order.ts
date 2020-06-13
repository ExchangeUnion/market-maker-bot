import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  OrderSide,
} from '../../proto/xudrpc_pb';
import { processResponse } from './client';
import { Logger } from '../../logger';
import { OpenDEXorder } from '../orders';
import { satsToCoinsStr } from '../../utils';
import { parseGrpcError } from './parse-error';

type CreateXudOrderParams = OpenDEXorder & {
  logger: Logger;
  client: XudClient;
};

const orderSideMapping = {
  0: 'buy',
  1: 'sell',
  2: 'both',
};

const createXudOrder$ = ({
  client,
  logger,
  quantity,
  orderSide,
  pairId,
  price,
  orderId,
}: CreateXudOrderParams): Observable<PlaceOrderResponse> => {
  if (quantity > 0) {
    logger.trace(
      `Creating ${pairId} ${
        orderSideMapping[orderSide]
      } order with id ${orderId}, quantity ${satsToCoinsStr(
        quantity
      )} and price ${price}`
    );
    const request = new PlaceOrderRequest();
    request.setQuantity(quantity);
    request.setSide(orderSide);
    request.setPairId(pairId);
    request.setPrice(price);
    request.setOrderId(orderId);
    const createXudOrder$ = new Observable(subscriber => {
      client.placeOrderSync(
        request,
        processResponse({
          subscriber,
          parseGrpcError,
        })
      );
    }).pipe(take(1));
    return createXudOrder$ as Observable<PlaceOrderResponse>;
  } else {
    return of((null as unknown) as PlaceOrderResponse);
  }
};

export { createXudOrder$, CreateXudOrderParams };
