import { Config } from '../config';
import { Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

const getOpenDEXorderFilled$ = (config: Config): Observable<boolean> => {
  // mock implementation
  return of(true).pipe(
    delay(10000),
    tap(() => console.log('Mock OpenDEX orders have been filled.'))
  );
};

export { getOpenDEXorderFilled$ };
