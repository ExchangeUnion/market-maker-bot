const errorCodePrefix = 'arby';

const errorCodes = {
  XUD_UNAVAILABLE: `${errorCodePrefix}.1`,
  XUD_CLIENT_INVALID_CERT: `${errorCodePrefix}.2`,
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
};

const xudErrorCodes = {
  UNAVAILABLE: 14,
  ENOENT: 'ENOENT',
};

export { errorCodes, errors, xudErrorCodes };
