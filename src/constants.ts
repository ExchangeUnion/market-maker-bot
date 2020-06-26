// Time in milliseconds between retry attempts from recoverable errors
const RETRY_INTERVAL = 5000;

type Asset = 'BTC' | 'ETH';

export { RETRY_INTERVAL, Asset };
