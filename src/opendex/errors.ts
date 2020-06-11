const errorCodePrefix = 'arby';

const errorCodes = {
  XUD_UNAVAILABLE: `${errorCodePrefix}.1`,
  XUD_CLIENT_INVALID_CERT: `${errorCodePrefix}.2`,
  BALANCE_MISSING: `${errorCodePrefix}.3`,
  TRADING_LIMITS_MISSING: `${errorCodePrefix}.4`,
  INVALID_ORDERS_LIST: `${errorCodePrefix}.5`,
  CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR: `${errorCodePrefix}.6`,
};

const errors = {
  XUD_UNAVAILABLE: {
    message: 'Could not establish connection to xud',
    code: errorCodes.XUD_UNAVAILABLE,
  },
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
  CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR: ({
    message: 'Price feed lost',
    code: errorCodes.CENTRALIZED_EXCHANGE_PRICE_FEED_ERROR,
  }),
};

const xudErrorCodes = {
  UNAVAILABLE: 14,
  ENOENT: 'ENOENT',
};

export { errorCodes, errors, xudErrorCodes };
