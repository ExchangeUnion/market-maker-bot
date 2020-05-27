import {
  ExchangeAPI,
  Balance,
  BalanceProperties,
  CancelOrderRequest,
  QueryOrderResponse,
} from '../api';
import { Logger } from '../../logger';
import { XudGrpcClient } from './xud-client';
import { v4 as uuidv4 } from 'uuid';
import {
  OrderSide as XudOrderSide,
  PlaceOrderResponse,
  SwapSuccess,
 } from './proto/xudrpc_pb';
import { ClientReadableStream, status } from '@grpc/grpc-js';
import { OrderSide } from '../../enums';
import {
  MarketOrderRequest,
  LimitOrderRequest,
  StopLimitOrderRequest,
} from '../exchange';
import { OpenDexOrder } from './order';
import { satsToCoinsStr, coinsToSats } from '../../utils';

class OpenDexAPI extends ExchangeAPI {
  private logger: Logger;
  private certPath: string;
  private rpchost: string;
  private rpcport: number;
  private xudClient!: XudGrpcClient;
  private swapSubscriptions = new Map<string, (swapSuccess: SwapSuccess.AsObject) => unknown >();
  private checkConnectionTimeout: ReturnType<typeof setTimeout> | undefined;

  private swapsCompleteSubscription: ClientReadableStream<SwapSuccess> | undefined;

  constructor(
    { logger, certPath, rpchost, rpcport }:
    {
      logger: Logger,
      certPath: string,
      rpchost: string,
      rpcport: number,
    },
  ) {
    super();
    this.logger = logger;
    this.certPath = certPath;
    this.rpchost = rpchost;
    this.rpcport = rpcport;
  }

  public start = async () => {
    this.xudClient = new XudGrpcClient({
      tlscertpath: this.certPath,
      rpchost: this.rpchost,
      rpcport: this.rpcport,
    });
    this.xudClient.start();
    await this.waitForConnection();
    this.swapsCompleteSubscription = await this.xudClient.subscribeSwaps();
    this.swapsCompleteSubscription.on('data', this.onSwapComplete.bind(this));
    this.swapsCompleteSubscription.on('end', () => {
      this.start();
      // TODO: cancel all orders on other exchanges
    });
    this.swapsCompleteSubscription.on('error', (error: any) => {
      if (error.code && error.code === status.CANCELLED) {
        return;
      } else {
        this.logger.error(`failed to subscribe to xud swaps: ${error}`);
      }
    });
    this.logger.info('OpenDEX API started');
  }

  private waitForConnection = () => {
    return new Promise((resolve, reject) => {
      const verifyConnection = async () => {
        try {
          await this.xudClient.getBalance();
          resolve();
        } catch (e) {
          if (e.code === 14) {
            this.logger.warn('could not verify connection to xud, retrying in 5 sec...');
            this.checkConnectionTimeout = setTimeout(verifyConnection, 5000);
          } else {
            reject();
          }
        }
      };
      verifyConnection();
    });
  }

  public stop = async () => {
    if (this.checkConnectionTimeout) {
      clearTimeout(this.checkConnectionTimeout);
    }
    if (this.swapsCompleteSubscription) {
      this.swapsCompleteSubscription.cancel();
    }
  }

  public getAssets = async (): Promise<Balance[]> => {
    const getBalanceResponse = await this.xudClient.getBalance();
    const assetsMap = new Map<string, BalanceProperties>();
    getBalanceResponse.balancesMap.forEach((balance) => {
      const asset = balance[0];
      const free = parseFloat(
        satsToCoinsStr(balance[1].channelBalance),
      );
      const locked = parseFloat(
        satsToCoinsStr(balance[1].walletBalance),
      );
      assetsMap.set(asset, {
        free,
        locked,
      });
    });
    const tradingLimitsResponse = await this.xudClient.tradingLimits();
    tradingLimitsResponse.limitsMap.forEach((limit) => {
      const asset = limit[0];
      const maxbuy = limit[1].maxbuy;
      const maxsell = limit[1].maxsell;
      let balance = assetsMap.get(asset);
      if (balance) {
        balance = {
          maxbuy,
          maxsell,
          ...balance,
        };
        assetsMap.set(asset, balance);
      }
    });
    const balances: Balance[] = [];
    assetsMap.forEach((balance, asset) => {
      balances.push({
        asset,
        ...balance,
      });
    });
    return balances;
  }

  public newOrder = (
    orderRequest: MarketOrderRequest | LimitOrderRequest | StopLimitOrderRequest,
  ): OpenDexOrder => {
    const orderId = uuidv4();
    const order = new OpenDexOrder({
      ...orderRequest,
      orderId,
      api: this,
      logger: this.logger,
    });
    return order;
  }

  public startOrder = async (
    orderRequest: MarketOrderRequest | LimitOrderRequest | StopLimitOrderRequest,
  ): Promise<PlaceOrderResponse.AsObject> => {
    const pairId = `${orderRequest.baseAsset}/${orderRequest.quoteAsset}`;
    const quantityInSatoshis = coinsToSats(orderRequest.quantity);
    const xudOrderSide = orderRequest.orderSide === OrderSide.Buy
      ? XudOrderSide.BUY
      : XudOrderSide.SELL;
    const xudOrderRequest = {
      pairId,
      orderId: orderRequest.orderId,
      price: orderRequest.price,
      quantity: quantityInSatoshis,
      orderSide: xudOrderSide,
    };
    const placeOrderResponse = await this.xudClient.newOrder(xudOrderRequest);
    return placeOrderResponse;
  }

  public cancelOrder = async (cancelOrderRequest: CancelOrderRequest): Promise<boolean> => {
    try {
      await this.xudClient.removeOrder(cancelOrderRequest.orderId);
      return true;
    } catch (e) {
      return false;
    }
  }

  public subscribeSwap = (id: string, cb: (swapSuccess: SwapSuccess.AsObject) => unknown) => {
    this.swapSubscriptions.set(id, cb);
  }

  public queryOrder = async (): Promise<QueryOrderResponse> => {
    throw new Error('not implemented');
  }

  private onSwapComplete = (swapSuccess: SwapSuccess) => {
    const swapSuccessObject = swapSuccess.toObject();
    const swapSubscription = this.swapSubscriptions.get(swapSuccessObject.localId);
    swapSubscription && swapSubscription(swapSuccessObject);
  }

}

export { OpenDexAPI };
