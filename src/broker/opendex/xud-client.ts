import fs from 'fs';
import {
  credentials,
  ClientReadableStream,
  ServiceError,
} from '@grpc/grpc-js';
import { XudClient } from './proto/xudrpc_grpc_pb';
import {
  SwapSuccess,
  SubscribeSwapsRequest,
  GetBalanceRequest,
  GetBalanceResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
  RemoveOrderRequest,
  RemoveOrderResponse,
  TradingLimitsRequest,
  TradingLimitsResponse,
  OrderSide as XudOrderSide,
 } from './proto/xudrpc_pb';

interface GrpcResponse {
  toObject: () => unknown;
}

type XudOrderRequest = {
  orderId: string,
  price: number | string,
  quantity: number,
  pairId: string,
  orderSide: XudOrderSide,
};

class XudGrpcClient {
  private tlscertpath: string;
  private rpchost: string;
  private rpcport: number;
  private client!: XudClient;

  constructor(
    { tlscertpath, rpchost, rpcport }:
    {
      tlscertpath: string,
      rpchost: string,
      rpcport: number,
    },
  ) {
    this.tlscertpath = tlscertpath;
    this.rpchost = rpchost;
    this.rpcport = rpcport;
  }

  public start = () => {
    const cert = fs.readFileSync(this.tlscertpath);
    const sslCredentials = credentials.createSsl(cert);
    const options = {
      'grpc.ssl_target_name_override' : 'localhost',
      'grpc.default_authority': 'localhost'
    };
    this.client = new XudClient(
      `${this.rpchost}:${this.rpcport}`,
      sslCredentials,
      options,
    );
  }

  public subscribeSwaps = (): ClientReadableStream<SwapSuccess> => {
    const swapsRequest = new SubscribeSwapsRequest();
    swapsRequest.setIncludeTaker(true);
    return this.client.subscribeSwaps(swapsRequest);
  }

  public getBalance = async (currency?: string): Promise<GetBalanceResponse.AsObject> => {
    const request = new GetBalanceRequest();
    if (currency) {
      request.setCurrency(currency.toUpperCase());
    }
    const balances = await new Promise((resolve, reject) => {
      this.client.getBalance(request, this.processResponse(resolve, reject));
    });
    return balances as GetBalanceResponse.AsObject;
  }

  public tradingLimits = async (): Promise<TradingLimitsResponse.AsObject> => {
    const request = new TradingLimitsRequest();
    const limits = await new Promise((resolve, reject) => {
      this.client.tradingLimits(request, this.processResponse(resolve, reject));
    });
    return limits as TradingLimitsResponse.AsObject;
  }

  public newOrder = async (orderRequest: XudOrderRequest): Promise<PlaceOrderResponse.AsObject> => {
    if (typeof orderRequest.price === 'string') {
      delete orderRequest.price;
    }
    const request = new PlaceOrderRequest();
    request.setQuantity(orderRequest.quantity);
    request.setSide(orderRequest.orderSide);
    request.setPairId(orderRequest.pairId);
    if (orderRequest.price) {
      request.setPrice(orderRequest.price as number);
    }
    request.setOrderId(orderRequest.orderId);
    const placeOrderResponse = await new Promise((resolve, reject) => {
      this.client.placeOrderSync(request, this.processResponse(resolve, reject));
    });
    return placeOrderResponse as PlaceOrderResponse.AsObject;
  }

  public removeOrder = async (orderId: string) => {
    const request = new RemoveOrderRequest();
    request.setOrderId(orderId);
    const removeOrderResponseObj = await new Promise((resolve, reject) => {
      this.client.removeOrder(request, this.processResponse(resolve, reject));
    });
    return removeOrderResponseObj as RemoveOrderResponse.AsObject;
  }

  private processResponse = (resolve: (value: unknown) => unknown, reject: (value: unknown) => unknown) => {
    return (error: ServiceError | null, response: GrpcResponse) => {
      if (error) {
        reject(error);
      } else {
        const responseObj = response.toObject();
        resolve(responseObj);
      }
    };
  }

}

export { XudGrpcClient };
