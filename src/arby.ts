import { Logger } from './logger';
import { ExchangeBroker } from './broker/exchange';
import { TradeManager } from './trade/manager';
import {
  ExchangeType,
} from './enums';
import { getConfig$, Config } from './config';
import { Observable, Subject, from } from 'rxjs';
import {
  take,
  mergeMap,
  mapTo,
  takeUntil,
} from 'rxjs/operators';

const getStartShutdown$ = (): Observable<unknown> => {
  const shutdown$ = new Subject();
  process.on('SIGINT', () => shutdown$.next());
  process.on('SIGTERM', () => shutdown$.next());
  return shutdown$
    .asObservable()
    .pipe(
      take(1),
    );
};

const getTradeManager$ = (config: Config): Observable<string> => {
  const loggers = Logger.createLoggers(
    config.LOG_LEVEL,
    config.LOG_PATH,
  );
  loggers.global.info('Starting. Hello, Arby.');
  const openDexBroker = new ExchangeBroker({
    exchange: ExchangeType.OpenDEX,
    logger: loggers.opendex,
    certPath: process.env.OPENDEX_CERT_PATH,
    rpchost: process.env.OPENDEX_RPC_HOST,
    rpcport: parseInt(process.env.OPENDEX_RPC_PORT!, 10),
  });
  const binanceBroker = new ExchangeBroker({
    exchange: ExchangeType.Binance,
    logger: loggers.binance,
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  });
  const tradeManager = new TradeManager({
    logger: loggers.trademanager,
    opendex: openDexBroker,
    binance: binanceBroker,
  });
  const startShutdown$ = getStartShutdown$();
  const shutdownComplete$ = startShutdown$.pipe(
    mergeMap(() => from(tradeManager.close()))
  );
  startShutdown$.subscribe({
    complete: () => {
      loggers.global.info('Received shutdown signal.');
    }
  });
  shutdownComplete$.subscribe({
    complete: () => {
      loggers.global.info('Shutdown complete. Goodbye, Arby.');
    }
  });
  return from(tradeManager.start()).pipe(
    mapTo('Shutdown complete. Goodbye, Arby.'),
  );
};

export const startArby = (
  {
    config$,
    shutdown$,
    startTradeManager,
  }:
  {
    config$: Observable<Config>
    shutdown$: Observable<unknown>
    startTradeManager: (config: Config) => Observable<string>,
  },
): Observable<any> => {
  return config$.pipe(
    mergeMap(startTradeManager),
    takeUntil(shutdown$),
  )
};

if (!module.parent) {
  startArby({
    config$: getConfig$(),
    shutdown$: getStartShutdown$(),
    startTradeManager: getTradeManager$
  }).subscribe({
    next: (val) => console.log(`arby$ next: ${val}`),
    error: (e) => console.log(`arby$ error: ${e}`),
    complete: () => console.log('arby$ complete'),
  });
}
