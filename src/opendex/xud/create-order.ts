import { Observable, empty, of } from 'rxjs';
import { XudClient } from '../../broker/opendex/proto/xudrpc_grpc_pb';
import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  OrderSide,
} from '../../broker/opendex/proto/xudrpc_pb';
import { processResponse } from './client';
import { take } from 'rxjs/operators';

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
