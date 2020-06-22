import { concat, Observable } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { getCentralizedExchangeOrder$ } from './centralized/order';
import { Config, getConfig$ } from './config';
import { Logger, Loggers } from './logger';
import { catchOpenDEXerror } from './opendex/catch-error';
import { getOpenDEXcomplete$ } from './opendex/complete';
import { getCleanup$ } from './trade/cleanup';
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
  cleanup$: () => Observable<unknown>;
};

export const startArby = ({
  config$,
  getLoggers,
  shutdown$,
  trade$,
  cleanup$,
}: StartArbyParams): Observable<any> => {
  const tradeComplete$ = config$.pipe(
    mergeMap((config: Config) => {
      const loggers = getLoggers(config);
      loggers.global.info('Starting. Hello, Arby.');
      return trade$({
        config,
        loggers,
        getOpenDEXcomplete$,
        shutdown$,
        getCentralizedExchangeOrder$,
        catchOpenDEXerror,
      });
    }),
    takeUntil(shutdown$)
  );
  return concat(tradeComplete$, cleanup$());
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
    complete: () => console.log('Received shutdown signal.'),
  });
}
