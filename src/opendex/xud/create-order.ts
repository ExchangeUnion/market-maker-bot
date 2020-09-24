import { Observable, of } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { Logger } from '../../logger';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import { PlaceOrderRequest, PlaceOrderResponse } from '../../proto/xudrpc_pb';
import { satsToCoinsStr } from '../../utils';
import { OpenDEXorder } from '../orders';
import { processResponse } from './process-response';

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
  replaceOrderId,
}: CreateXudOrderParams): Observable<PlaceOrderResponse> => {
  if (quantity > 0) {
    const CREATING_OR_REPLACING = replaceOrderId ? 'Replacing' : 'Creating';
    logger.trace(
      `${CREATING_OR_REPLACING} ${pairId} ${
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
    if (replaceOrderId) {
      request.setReplaceOrderId(replaceOrderId);
    }
    const createXudOrder$ = new Observable(subscriber => {
      client.placeOrderSync(
        request,
        processResponse({
          subscriber,
        })
      );
    }).pipe(
      tap(() => {
        logger.trace(`Order ${orderId} created`);
      }),
      take(1)
    );
    return createXudOrder$ as Observable<PlaceOrderResponse>;
  } else {
    logger.trace(
      `Did not create ${orderSideMapping[orderSide]} order because calculated quantity was 0`
    );
    return of((null as unknown) as PlaceOrderResponse);
  }
};

export { createXudOrder$, CreateXudOrderParams };
