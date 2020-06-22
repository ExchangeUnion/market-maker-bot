import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Logger } from '../logger';

const removeCEXorders$ = (logger: Logger) => {
  return of(null).pipe(
    tap(() => logger.info('Removing CEX orders')),
    delay(1000),
    tap(() => logger.info('Finished removing CEX orders'))
  );
};

export { removeCEXorders$ };
