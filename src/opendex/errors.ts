const errorCodePrefix = 'arby';

const errorCodes = {
  XUD_UNAVAILABLE: `${errorCodePrefix}.1`,
  XUD_CLIENT_INVALID_CERT: `${errorCodePrefix}.2`,
  BALANCE_MISSING: `${errorCodePrefix}.3`,
  TRADING_LIMITS_MISSING: `${errorCodePrefix}.4`,
};

const errors = {
  XUD_UNAVAILABLE: {
    message: 'Could not establish connection to xud.',
    code: errorCodes.XUD_UNAVAILABLE,
  },
  XUD_CLIENT_INVALID_CERT: (certPath: string) => ({
    message: `Unable to load xud.cert from ${certPath}`,
    code: errorCodes.XUD_CLIENT_INVALID_CERT,
  }),
  BALANCE_MISSING: (asset: string) => ({
    message: `Could not retrieve ${asset} balance.`,
    code: errorCodes.BALANCE_MISSING,
  }),
  TRADING_LIMITS_MISSING: (asset: string) => ({
    message: `Could not retrieve ${asset} trading limits.`,
    code: errorCodes.TRADING_LIMITS_MISSING,
  }),
};

const xudErrorCodes = {
  UNAVAILABLE: 14,
  ENOENT: 'ENOENT',
};

export { errorCodes, errors, xudErrorCodes };
