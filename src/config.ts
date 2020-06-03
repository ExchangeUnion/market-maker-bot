import {
  Observable,
  of,
} from 'rxjs';
import { pluck, map } from 'rxjs/operators';
import { Level } from './logger';
import { DotenvParseOutput } from 'dotenv';

export type Config = {
  LOG_LEVEL: Level;
  BINANCE_API_KEY: string;
  BINANCE_API_SECRET: string;
  DATA_DIR: string;
  OPENDEX_CERT_PATH: string;
  OPENDEX_RPC_HOST: string;
  OPENDEX_RPC_PORT: string;
  MARGIN: string;
  BASEASSET: string;
  QUOTEASSET: string;
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
    }, {});
  return environmentConfig;
};

const getMissingOptions = (config: DotenvParseOutput): string => {
  return REQUIRED_CONFIGURATION_OPTIONS.reduce(
    (missingOptions: string[], configOption) => {
      if (!config[configOption]) {
        return missingOptions.concat(configOption);
      }
      return missingOptions;
    }, []).join(', ');
};

const checkConfigOptions = (dotEnvConfig: DotenvParseOutput): Config => {
  const config = {
    ...dotEnvConfig,
    ...getEnvironmentConfig(),
  };
  const missingOptions = getMissingOptions(config);
  if (missingOptions) {
    throw new Error(`Incomplete configuration. Please add the following options to .env or as environment variables: ${missingOptions}`);
  }
  const verifiedConfig = {
    ...config,
    LOG_LEVEL: setLogLevel(config.LOG_LEVEL),
  };
  return verifiedConfig as Config;
};

export const getConfig$ = (): Observable<Config> => {
  return of(
    require('dotenv').config()
  ).pipe(
    pluck('parsed'),
    map(checkConfigOptions)
  );
};
