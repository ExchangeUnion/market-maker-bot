import { getTrade$, getNewTrade$} from './trade/manager';
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

const getOpenDEXcomplete$ = (config: Config, logger: Logger) => {
  // extract
  /*
  const xudClient$ = getXudClient$(config).pipe(
    mergeMap((client) => {
      return getOpenDEXassets$({
        xudBalance$: getXudBalance$(client),
        xudBalanceToExchangeAssetAllocation,
        quoteAsset: 'ETH',
        baseAsset: 'BTC',
      })
    })
  );
  xudClient$.subscribe({
    next: (a) => {
      console.log('got asset allocation', a);
    },
    error: (e) => {
      console.log('got error', e);
    },
    complete: () => {
      console.log('asset allocation complete');
    }
  });
  */
  // end/extract
  return of(true).pipe(
    delay(3000),
    tap(() => logger.info('OpenDEX order filled.')),
  );
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
        centralizedExchangeOrder$: getCentralizedExchangeOrder$(loggers.binance),
        openDEXcomplete$: getOpenDEXcomplete$(config, loggers.opendex),
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
