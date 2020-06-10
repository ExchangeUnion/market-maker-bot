import { Observable, of } from 'rxjs';
import { delay, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { Config, getConfig$ } from './config';
import { Logger, Loggers } from './logger';
import { getOpenDEXcomplete$ } from './opendex/complete';
import { getNewTrade$, GetTradeParams } from './trade/manager';
import { getStartShutdown$ } from './utils';

const getCentralizedExchangeOrder$ = (
  logger: Logger
): ((config: Config) => Observable<boolean>) => {
  return (config: Config) => {
    return of(true).pipe(
      tap(() => logger.info('Starting centralized exchange order.')),
      delay(5000)
    );
  };
};

export const startArby = ({
  config$,
  getLoggers,
  shutdown$,
  trade$,
}: {
  config$: Observable<Config>;
  getLoggers: (config: Config) => Loggers;
  shutdown$: Observable<unknown>;
  trade$: ({
    config,
    loggers,
    centralizedExchangeOrder$,
    getOpenDEXcomplete$,
    shutdown$,
  }: GetTradeParams) => Observable<boolean>;
}): Observable<any> => {
  return config$.pipe(
    mergeMap((config: Config) => {
      const loggers = getLoggers(config);
      loggers.global.info('Starting. Hello, Arby.');
      return trade$({
        config,
        loggers,
        getOpenDEXcomplete$,
        centralizedExchangeOrder$: getCentralizedExchangeOrder$(
          loggers.centralized
        ),
        shutdown$,
      });
    }),
    takeUntil(shutdown$)
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
  }).subscribe({
    next: () => console.log('Trade complete.'),
    error: console.log,
    complete: () => console.log('Received shutdown signal.'),
  });
}
