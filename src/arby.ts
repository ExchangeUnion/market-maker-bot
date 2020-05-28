import { Logger } from './logger';
import { ExchangeBroker } from './broker/exchange';
import { TradeManager } from './trade/manager';
import {
  ExchangeType,
} from './enums';
import { loadConfig, Config } from './config';
import { Observable, Subject, from } from 'rxjs';
import { take, mergeMap } from 'rxjs/operators';

const monitorKillSignals = (): Observable<unknown> => {
  const shutDown$ = new Subject();
  process.on('SIGINT', () => shutDown$.next());
  process.on('SIGTERM', () => shutDown$.next());
  return shutDown$
    .asObservable()
    .pipe(
      take(1),
    );
};

const startArby = (config: Config) => {
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
  const startShutdown$ = monitorKillSignals();
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
  tradeManager.start();
};

if (!module.parent) {
  const config$ = loadConfig();
  config$.subscribe({
    next: (config: Config) => {
      startArby(config);
    },
    error: (e) => console.log(e.message)
  });
}
