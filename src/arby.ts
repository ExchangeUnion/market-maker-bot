import { getTrade$ } from './trade/manager';
import { getConfig$, Config } from './config';
import { Observable } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { getStartShutdown$ } from './utils';

export const startArby = (
  {
    config$,
    shutdown$,
    trade$,
  }:
  {
    config$: Observable<Config>
    shutdown$: Observable<unknown>
    trade$: (config: Config) => Observable<string>,
  },
): Observable<any> => {
  return config$.pipe(
    mergeMap(trade$),
    takeUntil(shutdown$),
  )
};

if (!module.parent) {
  startArby({
    trade$: getTrade$,
    config$: getConfig$(),
    shutdown$: getStartShutdown$(),
  }).subscribe({
    next: console.log,
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
