import { concat, Observable } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { initBinance$ } from './centralized/ccxt/init';
import { getCentralizedExchangePrice$ } from './centralized/exchange-price';
import { getCentralizedExchangeOrder$ } from './centralized/order';
import { removeCEXorders$ } from './centralized/remove-orders';
import { Config, getConfig$ } from './config';
import { Logger, Loggers } from './logger';
import { catchOpenDEXerror } from './opendex/catch-error';
import { getOpenDEXcomplete$ } from './opendex/complete';
import { removeOpenDEXorders$ } from './opendex/remove-orders';
import { getCleanup$, GetCleanupParams } from './trade/cleanup';
import { getNewTrade$, GetTradeParams } from './trade/trade';
import { getStartShutdown$ } from './utils';

type StartArbyParams = {
  config$: Observable<Config>;
  getLoggers: (config: Config) => Loggers;
  shutdown$: Observable<unknown>;
  trade$: ({
    config,
    loggers,
    getCentralizedExchangeOrder$,
    getOpenDEXcomplete$,
    shutdown$,
  }: GetTradeParams) => Observable<boolean>;
  cleanup$: ({
    config,
    removeOpenDEXorders$,
  }: GetCleanupParams) => Observable<unknown>;
};

const logConfig = (config: Config, logger: Logger) => {
  const {
    LOG_LEVEL,
    DATA_DIR,
    OPENDEX_CERT_PATH,
    OPENDEX_RPC_HOST,
    OPENDEX_RPC_PORT,
    MARGIN,
    BASEASSET,
    QUOTEASSET,
    TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE,
    TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE,
    LIVE_CEX,
  } = config;
  logger.info(`Running with config:
LIVE_CEX: ${LIVE_CEX}
LOG_LEVEL: ${LOG_LEVEL}
DATA_DIR: ${DATA_DIR}
OPENDEX_CERT_PATH: ${OPENDEX_CERT_PATH}
OPENDEX_RPC_HOST: ${OPENDEX_RPC_HOST}
OPENDEX_RPC_PORT: ${OPENDEX_RPC_PORT}
MARGIN: ${MARGIN}
BASEASSET: ${BASEASSET}
QUOTEASSET: ${QUOTEASSET}
TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: ${TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE}
TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: ${TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE}`);
};

export const startArby = ({
  config$,
  getLoggers,
  shutdown$,
  trade$,
  cleanup$,
}: StartArbyParams): Observable<any> => {
  return config$.pipe(
    mergeMap(config => {
      const loggers = getLoggers(config);
      loggers.global.info('Starting. Hello, Arby.');
      logConfig(config, loggers.global);
      const tradeComplete$ = trade$({
        config,
        loggers,
        getOpenDEXcomplete$,
        shutdown$,
        getCentralizedExchangeOrder$,
        catchOpenDEXerror,
        getCentralizedExchangePrice$,
        initBinance$,
      }).pipe(takeUntil(shutdown$));
      return concat(
        tradeComplete$,
        cleanup$({
          config,
          loggers,
          removeOpenDEXorders$,
          removeCEXorders$,
        })
      );
    })
  );
};

const getLoggers = (config: Config) => {
  return Logger.createLoggers(config.LOG_LEVEL, `${config.DATA_DIR}/arby.log`);
};

if (!module.parent) {
  startArby({
    trade$: getNewTrade$,
    config$: getConfig$(),
    getLoggers,
    shutdown$: getStartShutdown$(),
    cleanup$: getCleanup$,
  }).subscribe({
    error: error => {
      if (error.message) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log(error);
      }
    },
    complete: () => console.log('Shutdown complete. Goodbye, Arby.'),
  });
}
