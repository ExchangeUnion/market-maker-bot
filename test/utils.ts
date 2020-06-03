import { Config } from '../src/config';
import { Loggers } from '../src/logger';
import { Level } from '../src/logger';

const testConfig = (): Config => {
  return {
    LOG_LEVEL: Level.Debug,
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
  return {
    global: {
      info: () => {},
      db: () => {},
      stream: () => {},
      binance: () => {},
      opendex: () => {},
      trademanager: () => {},
      balancer: () => {},
    }
  } as unknown as Loggers;
};

export {
  getLoggers,
  testConfig,
};
