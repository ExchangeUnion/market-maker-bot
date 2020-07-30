// Time in milliseconds between retry attempts from recoverable errors
const RETRY_INTERVAL = 5000;
const MAX_RETRY_ATTEMPS = 10;
const MAX_RETRY_ATTEMPS_CLEANUP = 5;
const CLEANUP_RETRY_INTERVAL = 1000;

type Asset = 'BTC' | 'ETH';

enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export {
  CLEANUP_RETRY_INTERVAL,
  MAX_RETRY_ATTEMPS_CLEANUP,
  MAX_RETRY_ATTEMPS,
  RETRY_INTERVAL,
  Asset,
  OrderSide,
};
