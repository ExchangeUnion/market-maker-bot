import { Observable } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { Config, getConfig$ } from './config';
import { Logger, Loggers } from './logger';
import { getOpenDEXcomplete$ } from './opendex/complete';
import { getNewTrade$, GetTradeParams } from './trade/trade';
import { getStartShutdown$ } from './utils';
import { getCentralizedExchangeOrder$ } from './centralized/order';
import { catchArbyError } from './trade/catch-error';

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
    getCentralizedExchangeOrder$,
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
        shutdown$,
        getCentralizedExchangeOrder$,
        catchArbyError,
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
    error: error => {
      if (error.message) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log(error);
      }
    },
    complete: () => console.log('Received shutdown signal.'),
  });
}
