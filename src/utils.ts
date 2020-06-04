import moment from 'moment';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ExchangeAssetAllocation } from './trade/manager';
import { Logger } from './logger';

/** Get the current date in the given dateFormat, if not provided formats with `YYYY-MM-DD hh:mm:ss.sss`.
 */
export const getTsString = (dateFormat?: string): string => moment().format(dateFormat || 'YYYY-MM-DD hh:mm:ss.sss');

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
  return shutdown$
    .asObservable()
    .pipe(
      take(1),
    );
};
