import { Config } from './config';
import { Level, Loggers } from './logger';
import { InitDBResponse } from './db/db';
import { Sequelize } from 'sequelize';
import { Order } from './db/order';
import { Trade } from './db/trade';

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
    START_HTTP: false,
    HTTP_PORT: '10000',
  };
};

const getModels = (): InitDBResponse => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
  });
  return {
    Order: Order(sequelize),
    Trade: Trade(sequelize),
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

export { getModels, getLoggers, testConfig, TestError };
