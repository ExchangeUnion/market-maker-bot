import {
  OrderType,
  OrderStatus,
} from '../../enums';
import {
  LimitOrderRequest,
  StopLimitOrderRequest,
} from '../exchange';
import { BinanceAPI } from './api';
import { Order } from '../order';

class BinanceOrder extends Order {
  private checkOrderInterval!: ReturnType<typeof setInterval>;

  public start = async () => {
    if (typeof this.price === 'string') {
      throw new Error('Price cannot be string for Binance orders');
    }
    const orderRequest: LimitOrderRequest | StopLimitOrderRequest = {
      orderId: this.orderId,
      baseAsset: this.baseAsset,
      quoteAsset: this.quoteAsset,
      orderSide: this.orderSide,
      orderType: this.orderType,
      quantity: this.quantity,
      price: this.price,
    };
    if (this.orderType === OrderType.StopLimit && this.stopPrice) {
      (orderRequest as StopLimitOrderRequest).stopPrice = this.stopPrice;
    }
    this.logger.info(`starting new order: ${JSON.stringify(orderRequest)}`);
    try {
      this.orderId = await (this.api as BinanceAPI).startOrder(orderRequest);
      this.logger.info(`order acknowledged with id: ${this.orderId}`);
      this.checkOrderInterval = setInterval(() => {
        this.checkOrder();
      }, 1000);
    } catch (e) {
      this.logger.info(`failed to start the order: ${JSON.stringify(orderRequest)}`);
      this.emit('failure', e);
    }
  }

  public cancel = async () => {
    if (!this.orderId) {
      return;
    }
    if (
      this.status === OrderStatus.New ||
      this.status === OrderStatus.PartiallyFilled
    ) {
      const cancelSuccess = await this.api.cancelOrder({
        tradingPair: this.tradingPair,
        orderId: this.orderId,
      });
      if (cancelSuccess) {
        this.logger.info(`canceled order with id: ${this.orderId}`);
      }
      this.status = OrderStatus.Canceled;
      this.emit('status', OrderStatus.Canceled);
      clearInterval(this.checkOrderInterval);
    }
  }

  private checkOrder = async () => {
    if (
      !this.orderId ||
      this.status === OrderStatus.Filled
    ) {
      return;
    }
    try {
      const orderInfo = await this.api.queryOrder({
        tradingPair: this.tradingPair,
        orderId: this.orderId,
      });
      if (orderInfo.status !== this.status) {
        this.status = orderInfo.status;
        this.emit('status', this.status);
      }
      if (orderInfo.status === OrderStatus.Filled) {
        // TODO: handle partial fills. Skipping for now since we're
        // switching to CCXT.
        this.emit('complete', this.orderId, this.quantity);
        clearInterval(this.checkOrderInterval);
      }
    } catch (e) {
      clearInterval(this.checkOrderInterval);
      this.emit('failure', e);
    }
  }

}

export { BinanceOrder };
