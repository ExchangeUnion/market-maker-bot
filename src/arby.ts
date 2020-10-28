import { concat, Observable } from 'rxjs';
import { catchError, mergeMap, takeUntil } from 'rxjs/operators';
import { getExchange } from './centralized/ccxt/exchange';
import {
  initCEX$,
  InitCEXparams,
  InitCEXResponse,
} from './centralized/ccxt/init';
import { loadMarkets$ } from './centralized/ccxt/load-markets';
import { getCentralizedExchangePrice$ } from './centralized/exchange-price';
import { getCentralizedExchangeOrder$ } from './centralized/order';
import { removeCEXorders$ } from './centralized/remove-orders';
import { Config, getConfig$ } from './config';
import { Logger, Loggers } from './logger';
import { catchOpenDEXerror } from './opendex/catch-error';
import { getOpenDEXcomplete$ } from './opendex/complete';
import { removeOpenDEXorders$ } from './opendex/remove-orders';
import { getArbyStore } from './store';
import { getCleanup$, GetCleanupParams } from './trade/cleanup';
import { getNewTrade$, GetTradeParams } from './trade/trade';
import { getStartShutdown$ } from './utils';
import { Dictionary, Market } from 'ccxt';
import { verifyMarkets } from './centralized/verify-markets';

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
  initCEX$: ({
    getExchange,
    config,
    loadMarkets$,
  }: InitCEXparams) => Observable<InitCEXResponse>;
  verifyMarkets: (config: Config, CEXmarkets: Dictionary<Market>) => boolean;
};

const logConfig = (config: Config, logger: Logger) => {
  const {
    LOG_LEVEL,
    DATA_DIR,
    OPENDEX_CERT_PATH,
    OPENDEX_RPC_HOST,
    OPENDEX_RPC_PORT,
    MARGIN,
    CEX_BASEASSET,
    CEX_QUOTEASSET,
    BASEASSET,
    QUOTEASSET,
    TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE,
    TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE,
    TEST_MODE,
    CEX,
  } = config;
  logger.info(`Running with config:
TEST_MODE: ${TEST_MODE}
CEX: ${CEX}
LOG_LEVEL: ${LOG_LEVEL}
DATA_DIR: ${DATA_DIR}
OPENDEX_CERT_PATH: ${OPENDEX_CERT_PATH}
OPENDEX_RPC_HOST: ${OPENDEX_RPC_HOST}
OPENDEX_RPC_PORT: ${OPENDEX_RPC_PORT}
MARGIN: ${MARGIN}
BASEASSET: ${BASEASSET}
QUOTEASSET: ${QUOTEASSET}
CEX_BASEASSET: ${CEX_BASEASSET}
CEX_QUOTEASSET: ${CEX_QUOTEASSET}
TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE: ${TEST_CENTRALIZED_EXCHANGE_BASEASSET_BALANCE}
TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE: ${TEST_CENTRALIZED_EXCHANGE_QUOTEASSET_BALANCE}`);
};

export const startArby = ({
  config$,
  getLoggers,
  shutdown$,
  trade$,
  cleanup$,
  initCEX$,
  verifyMarkets,
}: StartArbyParams): Observable<any> => {
  const store = getArbyStore();
  return config$.pipe(
    mergeMap(config => {
      const CEX$ = initCEX$({
        config,
        loadMarkets$,
        getExchange,
      });
      return CEX$.pipe(
        mergeMap(({ markets: CEXmarkets, exchange: CEX }) => {
          const loggers = getLoggers(config);
          loggers.global.info('Starting. Hello, Arby.');
          logConfig(config, loggers.global);
          verifyMarkets(config, CEXmarkets);
          const tradeComplete$ = trade$({
            config,
            loggers,
            getOpenDEXcomplete$,
            shutdown$,
            getCentralizedExchangeOrder$,
            catchOpenDEXerror,
            getCentralizedExchangePrice$,
            CEX,
            store,
          }).pipe(takeUntil(shutdown$));
          return concat(
            tradeComplete$,
            cleanup$({
              config,
              loggers,
              removeOpenDEXorders$,
              removeCEXorders$,
              CEX,
            })
          ).pipe(
            catchError(e => {
              loggers.global.info(
                `Unrecoverable error: ${JSON.stringify(e)} - cleaning up.`
              );
              return cleanup$({
                config,
                loggers,
                removeOpenDEXorders$,
                removeCEXorders$,
                CEX,
              });
            })
          );
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
    initCEX$,
    verifyMarkets,
  }).subscribe({
    error: error => {
      if (error.message) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log(error);
      }
      process.exit(1);
    },
    complete: () => console.log('Shutdown complete. Goodbye, Arby.'),
  });
}
