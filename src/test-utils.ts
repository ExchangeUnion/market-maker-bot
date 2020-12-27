import { Config } from './config';
import { Level, Loggers } from './logger';

const testConfig = (): Config => {
  return {
    LOG_LEVEL: Level.Trace,
    CEX: 'Binance',
    CEX_API_KEY: '123',
    CEX_API_SECRET: 'abc',
    DATA_DIR: '',
    OPENDEX_CERT_PATH: `${__dirname}/../mock-data/tls.cert`,
    OPENDEX_RPC_HOST: 'localhost',
    OPENDEX_RPC_PORT: '1234',
    MARGIN: '0.06',
    BASEASSET: 'ETH',
    QUOTEASSET: 'BTC',
    CEX_BASEASSET: 'ETH',
    CEX_QUOTEASSET: 'BTC',
    TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: '321',
    TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: '123',
    TEST_MODE: true,
  };
};

const getLoggers = (): Loggers => {
  const mockLogger = {
    warn: () => {},
    info: () => {},
    verbose: () => {},
    debug: () => {},
    trace: () => {},
    error: () => {},
  };
  return ({
    global: mockLogger,
    centralized: mockLogger,
    opendex: mockLogger,
    db: mockLogger,
  } as unknown) as Loggers;
};

type TestError = {
  code: string | number;
  message: string;
};

export { getLoggers, testConfig, TestError };
