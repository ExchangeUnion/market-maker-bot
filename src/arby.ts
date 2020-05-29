import { startTradeManager } from './trade/manager';
import { getConfig$, Config } from './config';
import { Observable } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { getStartShutdown$ } from './utils';

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
    startTradeManager,
    config$: getConfig$(),
    shutdown$: getStartShutdown$(),
  }).subscribe({
    next: console.log,
    error: (e) => console.log(`arby$ error: ${e}`),
    complete: () => console.log('Received shutdown signal.'),
  });
}
