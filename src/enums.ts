export enum ExchangeType {
  Binance = 'BINANCE',
  OpenDEX = 'OPENDEX',
}

export enum OrderSide {
  Buy = 'BUY',
  Sell = 'SELL',
}

export enum OrderType {
  Market = 'MARKET',
  Limit = 'LIMIT',
  StopLimit = 'STOP_LOSS_LIMIT',
}

export enum OrderStatus {
  New = 'NEW',
  PartiallyFilled = 'PARTIALLY_FILLED',
  Filled = 'FILLED',
  Canceled = 'CANCELED',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED',
}
