// Time in milliseconds between retry attempts from recoverable errors
const RETRY_INTERVAL = 5000;

type Asset = 'BTC' | 'ETH';

enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export { RETRY_INTERVAL, Asset, OrderSide };
