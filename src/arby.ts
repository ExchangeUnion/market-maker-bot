import {
  getTrade$,
  getNewTrade$,
  GetTradeParams,
} from './trade/manager';
import { getConfig$, Config } from './config';
import { Observable, of } from 'rxjs';
import { tap, mergeMap, takeUntil, delay, mergeMapTo } from 'rxjs/operators';
import { getStartShutdown$ } from './utils';
import { Logger, Loggers } from './logger';
import { getXudClient$, getXudBalance$ } from './opendex/xud-client';
import {
  getOpenDEXassets$,
  xudBalanceToExchangeAssetAllocation,
} from './opendex/opendex';
import { getOpenDEXcomplete$ } from './opendex/complete';

const getCentralizedExchangeOrder$ = (
  logger: Logger,
): (config: Config) => Observable<boolean> => {
  return (config: Config) => {
    return of(true).pipe(
      tap(() => logger.info('Starting centralized exchange order.')),
      delay(5000)
    );
  };
};

export const startArby = (
  {
    config$,
    getLoggers,
    shutdown$,
    trade$,
  }:
  {
    config$: Observable<Config>
    getLoggers: (config: Config) => Loggers
    shutdown$: Observable<unknown>
    trade$: (
      {
        config,
        loggers,
        centralizedExchangeOrder$,
        getOpenDEXcomplete$,
        shutdown$,
      }: GetTradeParams
    ) => Observable<boolean>,
  },
): Observable<any> => {
  return config$.pipe(
    mergeMap((config: Config) =>{
      const loggers = getLoggers(config);
      loggers.global.info('Starting. Hello, Arby.');
      return trade$({
        config,
        loggers,
        getOpenDEXcomplete$,
        centralizedExchangeOrder$: getCentralizedExchangeOrder$(loggers.binance),
        shutdown$,
      });
    }),
    takeUntil(shutdown$),
  )
};

const getLoggers = (config: Config) => {
  return Logger.createLoggers(
    config.LOG_LEVEL,
    `${config.DATA_DIR}/arby.log`,
  );
};

if (!module.parent) {
  startArby({
    trade$: getNewTrade$,
    config$: getConfig$(),
    getLoggers,
    shutdown$: getStartShutdown$(),
  }).subscribe({
    next: (trade) => console.log(`Trade complete: ${trade}`),
    error: console.log,
    complete: () => console.log('Received shutdown signal.'),
  });
}
