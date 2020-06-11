const errorCodePrefix = 'arby';

const errorCodes = {
  XUD_UNAVAILABLE: `${errorCodePrefix}.1`,
};

const errors = {
  XUD_UNAVAILABLE: {
    message: 'could not establish connection to xud',
    code: errorCodes.XUD_UNAVAILABLE,
  },
};

const xudErrorCodes = {
  UNAVAILABLE: 14,
};

export { errorCodes, errors, xudErrorCodes };
