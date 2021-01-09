import { Logger } from '../logger';
import { InitDBResponse } from './db';
import { from, Observable } from 'rxjs';
import { Order, Trade } from 'ccxt';
import { OrderAttributes, OrderInstance } from './order';
import { map, mergeMap } from 'rxjs/operators';
import { TradeAttributes } from './trade';

type SaveOrderParams = {
  order: Order;
  models: InitDBResponse;
  logger: Logger;
};

const saveOrder$ = ({
  order,
  models,
  logger,
}: SaveOrderParams): Observable<OrderInstance> => {
  logger.trace(`Saving order ${JSON.stringify(order)} into database`);

  const arbyOrder = convertToArbyOrder(order);
  const arbyTrades = convertToArbyTrades(order.trades, order.id);
  // TODO async
  return from(models.Order.create(arbyOrder)).pipe(
    mergeMap(order => {
      return from(models.Trade.bulkCreate(arbyTrades)).pipe(
        map(() => {
          logger.trace(`Order with id ${order.id} has been successfully saved`);
          return order;
        })
      );
    })
  );
};

const convertToArbyOrder = (order: Order): OrderAttributes => {
  return {
    id: order.id,
    datetime: order.datetime,
    timestamp: order.timestamp,
    lastTradeTimestamp: order.lastTradeTimestamp,
    status: order.status,
    symbol: order.symbol,
    type: order.type,
    side: order.side,
    price: order.price,
    average: order.average,
    amount: order.amount,
    filled: order.filled,
    remaining: order.remaining,
    cost: order.cost,
    info: order.info,
    feeType: order.fee.type,
    feeCurrency: order.fee.currency,
    feeRate: order.fee.rate,
    feeCost: order.fee.cost,
  };
};

const convertToArbyTrades = (
  trades: Trade[],
  orderId: string
): TradeAttributes[] => {
  const result: TradeAttributes[] = [];
  trades.forEach(trade => {
    result.push({
      id: trade.id,
      orderId,
      amount: trade.amount,
      datetime: trade.datetime,
      info: trade.info,
      price: trade.price,
      timestamp: trade.timestamp,
      type: trade.type,
      side: trade.side,
      symbol: trade.symbol,
      takerOrMaker: trade.takerOrMaker,
      cost: trade.cost,
    });
  });

  return result;
};

export { saveOrder$, SaveOrderParams };
