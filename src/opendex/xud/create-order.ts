import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { XudClient } from '../../proto/xudrpc_grpc_pb';
import {
  OrderSide,
  PlaceOrderRequest,
  PlaceOrderResponse,
} from '../../proto/xudrpc_pb';
import { processResponse } from './client';

type CreateXudOrderParams = {
  client: XudClient;
  quantity: number;
  orderSide: OrderSide;
  pairId: string;
  price: number;
  orderId: string;
};

const createXudOrder$ = ({
  client,
  quantity,
  orderSide,
  pairId,
  price,
  orderId,
}: CreateXudOrderParams): Observable<PlaceOrderResponse> => {
  if (quantity > 0) {
    const request = new PlaceOrderRequest();
    request.setQuantity(quantity);
    request.setSide(orderSide);
    request.setPairId(pairId);
    request.setPrice(price);
    request.setOrderId(orderId);
    const createXudOrder$ = new Observable(subscriber => {
      client.placeOrderSync(request, processResponse(subscriber));
    }).pipe(take(1));
    return createXudOrder$ as Observable<PlaceOrderResponse>;
  } else {
    return of((null as unknown) as PlaceOrderResponse);
  }
};

export { createXudOrder$, CreateXudOrderParams };
