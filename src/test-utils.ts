import { Config } from './config';
import { Level, Loggers } from './logger';

const testConfig = (): Config => {
  return {
    LOG_LEVEL: Level.Trace,
    BINANCE_API_KEY: '123',
    BINANCE_API_SECRET: 'abc',
    DATA_DIR: '',
    OPENDEX_CERT_PATH: `${__dirname}/../mock-data/tls.cert`,
    OPENDEX_RPC_HOST: 'localhost',
    OPENDEX_RPC_PORT: '1234',
    MARGIN: '0.06',
    BASEASSET: 'ETH',
    QUOTEASSET: 'BTC',
  };
};

const getLoggers = (): Loggers => {
  const mockLogger = {
    warn: () => {},
    info: () => {},
    verbose: () => {},
    debug: () => {},
    trace: () => {},
  };
  return ({
    global: mockLogger,
    centralized: mockLogger,
    opendex: mockLogger,
  } as unknown) as Loggers;
};

type TestError = {
  code: string | number;
  message: string;
};

export { getLoggers, testConfig, TestError };