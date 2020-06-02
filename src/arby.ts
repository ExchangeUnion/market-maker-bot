import { getTrade$, getNewTrade$} from './trade/manager';
import { getConfig$, Config } from './config';
import { Observable, of } from 'rxjs';
import { mergeMap, takeUntil, delay } from 'rxjs/operators';
import { getStartShutdown$ } from './utils';
import { Logger, Loggers } from './logger';

const getCentralizedExchangeOrder$ = (config: Config): Observable<boolean> => {
  return of(true).pipe(delay(5000));
};

const getOpenDEXcomplete$ = () => {
  return of(true).pipe(delay(3000));
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
        centralizedExchangeOrder$,
        openDEXcomplete$,
        shutdown$,
      }: {
        config: Config
        openDEXcomplete$: Observable<boolean>
        centralizedExchangeOrder$: (config: Config) => Observable<boolean>
        shutdown$: Observable<unknown>
      }
    ) => Observable<boolean>,
  },
): Observable<any> => {
  return config$.pipe(
    mergeMap((config: Config) =>{
      const loggers = getLoggers(config);
      loggers.global.info('Starting. Hello, Arby.');
      return trade$({
        config,
        centralizedExchangeOrder$: getCentralizedExchangeOrder$,
        openDEXcomplete$: getOpenDEXcomplete$(),
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
    error: (e) => {
      if (e.message) {
        console.log(`Error: ${e.message}`);
      } else {
        console.log(e);
      }
    },
    complete: () => console.log('Received shutdown signal.'),
  });
}
