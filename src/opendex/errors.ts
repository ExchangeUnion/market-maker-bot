const errorCodePrefix = 'arby';

const errorCodes = {
  XUD_CLIENT_INVALID_CERT: `${errorCodePrefix}.1`,
  BALANCE_MISSING: `${errorCodePrefix}.2`,
  TRADING_LIMITS_MISSING: `${errorCodePrefix}.3`,
  INVALID_ORDERS_LIST: `${errorCodePrefix}.4`,
  CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR: `${errorCodePrefix}.5`,
  CEX_INVALID_CREDENTIALS: `${errorCodePrefix}.6`,
  CEX_INVALID_MINIMUM_ORDER_QUANTITY: `${errorCodePrefix}.7`,
  CEX_INVALID_TRADING_PAIR: `${errorCodePrefix}.8`,
};

type ArbyError = {
  message: string;
  code: string;
};

const errors = {
  XUD_CLIENT_INVALID_CERT: (certPath: string) => ({
    message: `Unable to load xud.cert from ${certPath}`,
    code: errorCodes.XUD_CLIENT_INVALID_CERT,
  }),
  BALANCE_MISSING: (asset: string) => ({
    message: `Could not retrieve ${asset} balance`,
    code: errorCodes.BALANCE_MISSING,
  }),
  TRADING_LIMITS_MISSING: (asset: string) => ({
    message: `Could not retrieve ${asset} trading limits`,
    code: errorCodes.TRADING_LIMITS_MISSING,
  }),
  INVALID_ORDERS_LIST: (tradingPair: string) => ({
    message: `Could not retrieve orders list for ${tradingPair}`,
    code: errorCodes.INVALID_ORDERS_LIST,
  }),
  CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR: {
    message: 'Price feed lost',
    code: errorCodes.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR,
  },
  CEX_INVALID_CREDENTIALS: {
    message: 'Invalid CEX_API_KEY or CEX_API_SECRET',
    code: errorCodes.CEX_INVALID_CREDENTIALS,
  },
  CEX_INVALID_MINIMUM_ORDER_QUANTITY: (asset: string) => ({
    message: `Could not retrieve minimum order quantity for ${asset}`,
    code: errorCodes.CEX_INVALID_MINIMUM_ORDER_QUANTITY,
  }),
  CEX_INVALID_TRADING_PAIR: (tradingPair: string, CEX: string) => ({
    message: `The configured trading pair ${tradingPair} does not exist on ${CEX}`,
    code: errorCodes.CEX_INVALID_TRADING_PAIR,
  }),
};

export { errorCodes, errors, ArbyError };
