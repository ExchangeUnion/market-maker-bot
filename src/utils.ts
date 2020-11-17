import moment from 'moment';
import { Observable, Subject, timer, merge } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { curry } from 'ramda';

/** Get the current date in the given dateFormat, if not provided formats with `YYYY-MM-DD hh:mm:ss.sss`.
 */
export const getTsString = (dateFormat?: string): string =>
  moment().format(dateFormat || 'YYYY-MM-DD hh:mm:ss.sss');

const SATOSHIS_PER_COIN = 10 ** 8;

/** Returns a number of satoshis as a string representation of coins with up to 8 decimal places. */
export const satsToCoinsStr = (satsQuantity: number): string => {
  return (satsQuantity / SATOSHIS_PER_COIN).toFixed(8).replace(/\.?0+$/, '');
};

/** Returns a number of coins as an integer number of satoshis. */
export const coinsToSats = (coinsQuantity: number): number => {
  return Math.round(coinsQuantity * SATOSHIS_PER_COIN);
};

export const getStartShutdown$ = (): Observable<unknown> => {
  const shutdown$ = new Subject();
  process.on('SIGINT', () => shutdown$.next());
  process.on('SIGTERM', () => shutdown$.next());
  const ONE_MINUTE = 1000 * 60;
  const ONE_HOUR = ONE_MINUTE * 60;
  const restart$ = timer(ONE_HOUR).pipe(
    tap(() => console.log('Restarting Arby to reduce memory usage.'))
  );
  return merge(shutdown$.asObservable(), restart$).pipe(take(1));
};

const debugObservable = (prefix: string, source: Observable<any>) => {
  return source.pipe(
    tap({
      next: v => console.log(`${prefix} next: ${v}`),
      error: e => console.log(`${prefix} error: ${e}`),
      complete: () => console.log(`${prefix} complete`),
    })
  );
};

const debugLog = curry(debugObservable);

export { debugLog };
