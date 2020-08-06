import { DotenvParseOutput } from 'dotenv';
import { Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { Level } from './logger';
import { Asset } from './constants';

export type Config = {
  LOG_LEVEL: Level;
  BINANCE_API_KEY: string;
  BINANCE_API_SECRET: string;
  DATA_DIR: string;
  OPENDEX_CERT_PATH: string;
  OPENDEX_RPC_HOST: string;
  OPENDEX_RPC_PORT: string;
  MARGIN: string;
  BASEASSET: Asset;
  QUOTEASSET: Asset;
  TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: string;
  TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: string;
  LIVE_CEX: boolean;
};

const REQUIRED_CONFIGURATION_OPTIONS = [
  'LOG_LEVEL',
  'BINANCE_API_KEY',
  'BINANCE_API_SECRET',
  'DATA_DIR',
  'OPENDEX_CERT_PATH',
  'OPENDEX_RPC_HOST',
  'OPENDEX_RPC_PORT',
  'MARGIN',
  'BASEASSET',
  'QUOTEASSET',
  'TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE',
  'TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE',
  'LIVE_CEX',
];

const setLogLevel = (logLevel: string): Level => {
  return Object.values(Level).reduce((finalLevel, level) => {
    if (logLevel === level) {
      return level;
    }
    return finalLevel;
  }, Level.Trace);
};

const getEnvironmentConfig = (): DotenvParseOutput => {
  const environmentConfig = REQUIRED_CONFIGURATION_OPTIONS.reduce(
    (envConfig: DotenvParseOutput, configOption) => {
      if (process.env[configOption]) {
        return {
          ...envConfig,
          [configOption]: process.env[configOption]!,
        };
      }
      return envConfig;
    },
    {}
  );
  return environmentConfig;
};

const getMissingOptions = (config: DotenvParseOutput): string => {
  return REQUIRED_CONFIGURATION_OPTIONS.reduce(
    (missingOptions: string[], configOption) => {
      if (!config[configOption]) {
        return missingOptions.concat(configOption);
      }
      return missingOptions;
    },
    []
  ).join(', ');
};

const ALLOWED_TRADING_PAIRS: string[] = [
  'ETH/BTC',
  'BTC/USDT',
  'LTC/BTC',
  'LTC/USDT',
];

const checkConfigOptions = (dotEnvConfig: DotenvParseOutput): Config => {
  const config = {
    ...dotEnvConfig,
    ...getEnvironmentConfig(),
  };
  const missingOptions = getMissingOptions(config);
  if (missingOptions) {
    throw new Error(
      `Incomplete configuration. Please add the following options to .env or as environment variables: ${missingOptions}`
    );
  }
  const tradingPair = `${config.BASEASSET}/${config.QUOTEASSET}`;
  if (!ALLOWED_TRADING_PAIRS.includes(tradingPair)) {
    throw new Error(
      `Invalid trading pair ${tradingPair}. Supported trading pairs are: ${ALLOWED_TRADING_PAIRS.join(
        ', '
      )}`
    );
  }
  const verifiedConfig = {
    ...config,
    LOG_LEVEL: setLogLevel(config.LOG_LEVEL),
    LIVE_CEX: config.LIVE_CEX === 'true' ? true : false,
  };
  return verifiedConfig as Config;
};

const getConfig$ = (): Observable<Config> => {
  return of(require('dotenv').config()).pipe(
    pluck('parsed'),
    map(checkConfigOptions)
  );
};

export { getConfig$, checkConfigOptions };
