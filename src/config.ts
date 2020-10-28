import { DotenvParseOutput } from 'dotenv';
import { Observable, of } from 'rxjs';
import { map, pluck } from 'rxjs/operators';
import { Level } from './logger';

export type Config = {
  LOG_LEVEL: Level;
  CEX: string;
  CEX_API_KEY: string;
  CEX_API_SECRET: string;
  DATA_DIR: string;
  OPENDEX_CERT_PATH: string;
  OPENDEX_RPC_HOST: string;
  OPENDEX_RPC_PORT: string;
  MARGIN: string;
  BASEASSET: string;
  QUOTEASSET: string;
  CEX_BASEASSET: string;
  CEX_QUOTEASSET: string;
  TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: string;
  TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: string;
  TEST_MODE: boolean;
};

const REQUIRED_CONFIGURATION_OPTIONS = [
  'LOG_LEVEL',
  'CEX',
  'DATA_DIR',
  'OPENDEX_CERT_PATH',
  'OPENDEX_RPC_HOST',
  'OPENDEX_RPC_PORT',
  'MARGIN',
  'BASEASSET',
  'QUOTEASSET',
  'TEST_MODE',
];

const REQUIRED_CONFIGURATION_OPTIONS_TEST_MODE_ENABLED = [
  'TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE',
  'TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE',
];

const REQUIRED_CONFIGURATION_OPTIONS_TEST_MODE_DISABLED = [
  'CEX_API_KEY',
  'CEX_API_SECRET',
];

const OPTIONAL_CONFIG = ['CEX_BASEASSET', 'CEX_QUOTEASSET'];

const setLogLevel = (logLevel: string): Level => {
  return Object.values(Level).reduce((finalLevel, level) => {
    if (logLevel === level) {
      return level;
    }
    return finalLevel;
  }, Level.Trace);
};

const getEnvironmentConfig = (): DotenvParseOutput => {
  const environmentConfig = REQUIRED_CONFIGURATION_OPTIONS.concat(
    REQUIRED_CONFIGURATION_OPTIONS_TEST_MODE_ENABLED,
    REQUIRED_CONFIGURATION_OPTIONS_TEST_MODE_DISABLED,
    OPTIONAL_CONFIG
  ).reduce((envConfig: DotenvParseOutput, configOption) => {
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
  const ADDITIONAL_CONF_OPTIONS =
    config['TEST_MODE'] === 'true'
      ? REQUIRED_CONFIGURATION_OPTIONS_TEST_MODE_ENABLED
      : REQUIRED_CONFIGURATION_OPTIONS_TEST_MODE_DISABLED;
  return REQUIRED_CONFIGURATION_OPTIONS.concat(ADDITIONAL_CONF_OPTIONS)
    .reduce((missingOptions: string[], configOption) => {
      if (!config[configOption]) {
        return missingOptions.concat(configOption);
      }
      return missingOptions;
    }, [])
    .join(', ');
};

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
  const BASEASSET = config.BASEASSET.toUpperCase();
  const QUOTEASSET = config.QUOTEASSET.toUpperCase();
  const CEX_BASEASSET = config.CEX_BASEASSET
    ? config.CEX_BASEASSET.toUpperCase()
    : BASEASSET;
  const CEX_QUOTEASSET = config.CEX_QUOTEASSET
    ? config.CEX_QUOTEASSET.toUpperCase()
    : QUOTEASSET;
  const verifiedConfig = {
    ...config,
    LOG_LEVEL: setLogLevel(config.LOG_LEVEL),
    TEST_MODE: config.TEST_MODE === 'true' ? true : false,
    CEX: config.CEX.toUpperCase(),
    BASEASSET,
    QUOTEASSET,
    CEX_BASEASSET,
    CEX_QUOTEASSET,
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
