import {
  MarketOrderRequest,
  LimitOrderRequest,
} from '../exchange';
import {
  OrderType,
  OrderStatus,
} from '../../enums';
import { Order } from '../order';
import {
  SwapSuccess,
 } from './proto/xudrpc_pb';
import { OpenDexAPI } from './api';

class OpenDexOrder extends Order {

  public start = async () => {
    if (this.orderType === OrderType.StopLimit) {
      throw new Error('OpenDEX broker does not currently support StopLimit orders');
    }
    const orderRequest: MarketOrderRequest = {
      orderId: this.orderId,
      baseAsset: this.baseAsset,
      quoteAsset: this.quoteAsset,
      orderSide: this.orderSide,
      orderType: this.orderType,
      quantity: this.quantity,
      price: 'mkt',
    };
    if (this.orderType === OrderType.Limit) {
      if (!this.price) {
        throw new Error('Price is required for limit orders.');
      }
      if (typeof this.price !== 'number') {
        throw new Error('Price must be a number.');
      }
      (orderRequest as unknown as LimitOrderRequest).price = this.price;
    }
    if (this.orderType === OrderType.Market) {
      (orderRequest as MarketOrderRequest).price = 'mkt';
    }
    try {
      (this.api as OpenDexAPI).subscribeSwap(
        this.orderId, this.onSwapComplete.bind(this),
      );
      await (this.api as OpenDexAPI).startOrder(orderRequest);
      this.status = OrderStatus.New;
      this.emit('status', this.status);
    } catch (e) {
      this.logger.info(`failed to start the order: ${JSON.stringify(orderRequest)}`);
      this.emit('failure', e);
    }
  }

  private onSwapComplete = (swapSuccess: SwapSuccess.AsObject) => {
    this.logger.info(`swapSuccess: ${JSON.stringify(swapSuccess)}`);
    // TODO: emit fill instead of complete when quantity is partial
    this.emit('complete', this.orderId, swapSuccess.quantity);
  }

  public cancel = async () => {
    const cancelSuccess = await this.api.cancelOrder({
      tradingPair: this.tradingPair,
      orderId: this.orderId,
    });
    if (cancelSuccess) {
      this.logger.info(`canceled order with id: ${this.orderId}`);
    }
    this.status = OrderStatus.Canceled;
    this.emit('status', OrderStatus.Canceled);
  }

}

export { OpenDexOrder };
