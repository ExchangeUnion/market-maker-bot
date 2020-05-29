import {
  Observable,
  of,
} from 'rxjs';
import { pluck, map } from 'rxjs/operators';
import { Level } from './logger';
import { DotenvParseOutput } from 'dotenv';

export type Config = {
  LOG_LEVEL: Level;
  LOG_PATH: string;
  BINANCE_API_KEY: string;
  BINANCE_API_SECRET: string;
  DATA_DIR: string;
  OPENDEX_CERT_PATH: string;
  OPENDEX_RPC_HOST: string;
  OPENDEX_RPC_PORT: string;
  MARGIN: string;
  MAXLTC: string;
  MINLTC: string;
};

const REQUIRED_CONFIGURATION_OPTIONS = [
  'LOG_LEVEL',
  'LOG_PATH',
  'BINANCE_API_KEY',
  'BINANCE_API_SECRET',
  'DATA_DIR',
  'OPENDEX_CERT_PATH',
  'OPENDEX_RPC_HOST',
  'OPENDEX_RPC_PORT',
];

const setLogLevel = (logLevel: string): Level => {
  return Object.values(Level).reduce((finalLevel, level) => {
    if (logLevel === level) {
      return level;
    }
    return finalLevel;
  }, Level.Trace);
};

const checkConfigOptions = (config: DotenvParseOutput): Config => {
  const missingOptions = REQUIRED_CONFIGURATION_OPTIONS.reduce(
    (missingOptions: string[], configOption) => {
      if (!config[configOption]) {
        return missingOptions.concat(configOption);
      }
      return missingOptions;
    }, []);
  if (missingOptions.length) {
    throw new Error(`Incomplete configuration. Please add the following options to .env: ${missingOptions.join(', ')}`);
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
